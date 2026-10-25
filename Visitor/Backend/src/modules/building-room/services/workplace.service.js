const db = require('../../../config/db');
const buildingRepository = require('../repositories/building.repository');
const floorRepository = require('../repositories/floor.repository');
const roomRepository = require('../repositories/room.repository');
const { AppError } = require('../../../middleware/errorHandler');

class WorkplaceService {
  /**
   * Get employee workplace assignment details
   */
  async getEmployeeWorkplace(employeeId) {
    const sql = `
      SELECT 
        e.id AS employee_id,
        e.full_name,
        e.employee_number,
        e.email,
        e.office_phone,
        e.extension,
        e.office_location,
        e.effective_start_date,
        e.effective_end_date,
        e.workplace_status,
        e.organization_id,
        o.name AS organization_name,
        e.branch_id,
        ob.branch_name,
        e.department_id,
        d.department_name,
        e.building_id,
        b.building_name,
        b.building_code,
        b.location AS building_location,
        e.floor_id,
        f.floor_name,
        f.floor_number,
        f.floor_code,
        e.room_id,
        mr.room_name,
        mr.room_number,
        mr.room_type
      FROM employees e
      LEFT JOIN organizations o ON e.organization_id = o.id
      LEFT JOIN organization_branches ob ON e.branch_id = ob.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN buildings b ON e.building_id = b.id
      LEFT JOIN floors f ON e.floor_id = f.id
      LEFT JOIN meeting_rooms mr ON e.room_id = mr.id
      WHERE e.id = ? AND e.deleted_at IS NULL
    `;
    const rows = await db.query(sql, [employeeId]);
    if (!rows[0]) {
      throw new AppError('Employee not found', 404);
    }
    return rows[0];
  }

  /**
   * Assign or transfer employee workplace
   */
  async assignWorkplace(employeeId, assignmentData, actorUser) {
    const {
      organization_id,
      branch_id,
      department_id,
      building_id,
      floor_id,
      room_id,
      office_number,
      effective_start_date = new Date().toISOString().split('T')[0],
      effective_end_date = null,
      workplace_status = 'PRIMARY',
      reason = 'Workplace location allocation'
    } = assignmentData;

    // 1. Fetch employee
    const empRows = await db.query('SELECT * FROM employees WHERE id = ? AND deleted_at IS NULL', [employeeId]);
    const employee = empRows[0];
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // 2. RBAC check: If actor is Department Manager, verify department and organization scope
    if (actorUser.role === 'manager' || actorUser.role === 'dept_manager') {
      const actorManagerDept = actorUser.department_id || actorUser.departmentId;
      if (Number(employee.department_id) !== Number(actorManagerDept)) {
        throw new AppError('Department Managers can only manage workplace assignments for employees in their own department', 403);
      }
    } else if (actorUser.role !== 'admin' && actorUser.role !== 'system_admin') {
      throw new AppError('Unauthorized: Only Administrators and authorized Department Managers can manage workplace assignments', 403);
    }

    // 3. Validation: Verify building and branch consistency
    let building = null;
    if (building_id) {
      building = await buildingRepository.findById(building_id);
      if (!building || !building.is_active) {
        throw new AppError('Selected building does not exist or is inactive', 400);
      }
      if (branch_id && Number(building.branch_id) !== Number(branch_id)) {
        throw new AppError('Integrity error: Selected building does not belong to the selected branch/campus', 400);
      }
    }

    // 4. Validation: Verify floor belongs to building
    let floor = null;
    if (floor_id) {
      floor = await floorRepository.findById(floor_id);
      if (!floor || !floor.is_active) {
        throw new AppError('Selected floor does not exist or is inactive', 400);
      }
      if (building_id && Number(floor.building_id) !== Number(building_id)) {
        throw new AppError('Integrity error: Selected floor does not belong to the selected building', 400);
      }
    }

    // 5. Validation: Verify room belongs to floor
    let room = null;
    if (room_id) {
      room = await roomRepository.findById(room_id);
      if (!room || !room.is_active) {
        throw new AppError('Selected room/office does not exist or is inactive', 400);
      }
      if (floor_id && room.floor_id && Number(room.floor_id) !== Number(floor_id)) {
        throw new AppError('Integrity error: Selected office does not belong to the selected floor', 400);
      }
    }

    // Format legacy office_location string for backwards compatibility
    const locationParts = [];
    if (building) locationParts.push(building.building_name);
    if (floor) locationParts.push(floor.floor_name);
    if (room) locationParts.push(room.room_name || `Office ${room.room_number}`);
    else if (office_number) locationParts.push(`Office ${office_number}`);

    const officeLocationString = locationParts.join(' • ') || 'Main Campus';

    // 6. Record old assignment into employee_workplace_history
    await db.query(
      `INSERT INTO employee_workplace_history (
        employee_id, organization_id, branch_id, department_id,
        building_id, floor_id, room_id, office_number,
        workplace_status, effective_start_date, effective_end_date,
        reason, assigned_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee.id,
        employee.organization_id,
        employee.branch_id,
        employee.department_id,
        employee.building_id,
        employee.floor_id,
        employee.room_id,
        employee.office_number,
        employee.workplace_status || 'PRIMARY',
        employee.effective_start_date || employee.created_at,
        effective_start_date, // ends when new begins
        reason,
        actorUser.id
      ]
    );

    // 7. Update employee record
    await db.query(
      `UPDATE employees SET
        organization_id = COALESCE(?, organization_id),
        branch_id = COALESCE(?, branch_id),
        department_id = COALESCE(?, department_id),
        building_id = ?,
        floor_id = ?,
        room_id = ?,
        office_number = ?,
        office_location = ?,
        effective_start_date = ?,
        effective_end_date = ?,
        workplace_status = ?,
        updated_by = ?
      WHERE id = ?`,
      [
        organization_id || null,
        branch_id || null,
        department_id || null,
        building_id || null,
        floor_id || null,
        room_id || null,
        office_number || (room ? room.room_number : null),
        officeLocationString,
        effective_start_date,
        effective_end_date,
        workplace_status,
        actorUser.id,
        employeeId
      ]
    );

    return this.getEmployeeWorkplace(employeeId);
  }

  /**
   * Get employee workplace assignment history
   */
  async getWorkplaceHistory(employeeId) {
    const sql = `
      SELECT 
        ewh.*,
        b.building_name,
        b.building_code,
        f.floor_name,
        mr.room_name,
        mr.room_number,
        u.name AS assigned_by_name
      FROM employee_workplace_history ewh
      LEFT JOIN buildings b ON ewh.building_id = b.id
      LEFT JOIN floors f ON ewh.floor_id = f.id
      LEFT JOIN meeting_rooms mr ON ewh.room_id = mr.id
      LEFT JOIN users u ON ewh.assigned_by = u.id
      WHERE ewh.employee_id = ?
      ORDER BY ewh.created_at DESC
    `;
    return db.query(sql, [employeeId]);
  }
}

module.exports = new WorkplaceService();
