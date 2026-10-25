const floorService = require('../services/floor.service');

class FloorController {
  async list(req, res, next) {
    try {
      const {
        building_id,
        organization_id,
        branch_id,
        status,
        search,
        page = 1,
        limit = 50
      } = req.query;

      const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

      const result = await floorService.listFloors({
        buildingId: building_id,
        organizationId: organization_id,
        branchId: branch_id,
        status,
        search,
        limit: parseInt(limit, 10),
        offset
      });

      res.status(200).json({
        success: true,
        data: result.records,
        pagination: {
          total: result.total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(result.total / parseInt(limit, 10))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async get(req, res, next) {
    try {
      const floor = await floorService.getFloor(req.params.id);
      res.status(200).json({ success: true, data: floor });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId || null;
      const floor = await floorService.createFloor(req.body, userId);
      res.status(201).json({ success: true, message: 'Floor created successfully', data: floor });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId || null;
      const floor = await floorService.updateFloor(req.params.id, req.body, userId);
      res.status(200).json({ success: true, message: 'Floor updated successfully', data: floor });
    } catch (err) {
      next(err);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId || null;
      const { is_active } = req.body;
      const floor = await floorService.changeStatus(req.params.id, is_active, userId);
      res.status(200).json({
        success: true,
        message: `Floor ${is_active ? 'activated' : 'deactivated'} successfully`,
        data: floor
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId || null;
      await floorService.deleteFloor(req.params.id, userId);
      res.status(200).json({ success: true, message: 'Floor deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FloorController();
