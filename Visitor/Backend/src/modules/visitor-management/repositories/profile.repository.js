const db = require('../../../config/db');

class ProfileRepository {
  async createManager(data) {
    const {
      userId,
      managerNumber,
      departmentId = null,
      position = null,
      office = null,
      phone = null,
      email = null,
      employeeReference = null,
      approvalAuthorityLevel = 1,
      photoUrl = null
    } = data;

    const result = await db.query(
      `INSERT INTO manager_profiles (
        user_id, manager_number, department_id, position, office, phone, email,
        employee_reference, approval_authority_level, photo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        managerNumber,
        departmentId,
        position,
        office,
        phone,
        email,
        employeeReference,
        approvalAuthorityLevel,
        photoUrl
      ]
    );
    return result.insertId;
  }

  async createReceptionist(data) {
    const {
      userId,
      receptionistNumber,
      assignedBuilding = null,
      receptionDesk = null,
      shift = null,
      workingHours = null,
      phone = null,
      email = null,
      photoUrl = null,
      supervisorUserId = null
    } = data;

    const result = await db.query(
      `INSERT INTO receptionist_profiles (
        user_id, receptionist_number, assigned_building, reception_desk, shift,
        working_hours, phone, email, photo_url, supervisor_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        receptionistNumber,
        assignedBuilding,
        receptionDesk,
        shift,
        workingHours,
        phone,
        email,
        photoUrl,
        supervisorUserId
      ]
    );
    return result.insertId;
  }

  async createSecurity(data) {
    const {
      userId,
      securityNumber,
      securityLevel = null,
      assignedGate = null,
      assignedBuilding = null,
      shift = null,
      phone = null,
      email = null,
      photoUrl = null,
      supervisorUserId = null,
      certificationNumber = null,
      badgeNumber = null
    } = data;

    const result = await db.query(
      `INSERT INTO security_profiles (
        user_id, security_number, security_level, assigned_gate, assigned_building, shift,
        phone, email, photo_url, supervisor_user_id, certification_number, badge_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        securityNumber,
        securityLevel,
        assignedGate,
        assignedBuilding,
        shift,
        phone,
        email,
        photoUrl,
        supervisorUserId,
        certificationNumber,
        badgeNumber
      ]
    );
    return result.insertId;
  }

  async createAdmin(data) {
    const {
      userId,
      adminNumber,
      department = null,
      phone = null,
      email = null,
      photoUrl = null,
      position = null,
      systemAccessLevel = null
    } = data;

    const result = await db.query(
      `INSERT INTO administrator_profiles (
        user_id, admin_number, department, phone, email, photo_url, position, system_access_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        adminNumber,
        department,
        phone,
        email,
        photoUrl,
        position,
        systemAccessLevel
      ]
    );
    return result.insertId;
  }

  async createVerificationRequest(data) {
    const { userId, status = 'PENDING' } = data;
    const result = await db.query(
      `INSERT INTO verification_requests (user_id, status) VALUES (?, ?)`,
      [userId, status]
    );
    return result.insertId;
  }

  async findManagerByUserId(userId) {
    const rows = await db.query(`SELECT * FROM manager_profiles WHERE user_id = ?`, [userId]);
    return rows[0] || null;
  }

  async findReceptionistByUserId(userId) {
    const rows = await db.query(`SELECT * FROM receptionist_profiles WHERE user_id = ?`, [userId]);
    return rows[0] || null;
  }

  async findSecurityByUserId(userId) {
    const rows = await db.query(`SELECT * FROM security_profiles WHERE user_id = ?`, [userId]);
    return rows[0] || null;
  }

  async findAdminByUserId(userId) {
    const rows = await db.query(`SELECT * FROM administrator_profiles WHERE user_id = ?`, [userId]);
    return rows[0] || null;
  }
}

module.exports = new ProfileRepository();
