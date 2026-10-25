const buildingService = require('../services/building.service');

class BuildingController {
  async list(req, res, next) {
    try {
      const {
        organization_id,
        branch_id,
        status,
        search,
        page = 1,
        limit = 20
      } = req.query;

      const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

      const result = await buildingService.listBuildings({
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
      const building = await buildingService.getBuilding(req.params.id);
      res.status(200).json({ success: true, data: building });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId || null;
      const building = await buildingService.createBuilding(req.body, userId);
      res.status(201).json({ success: true, message: 'Building created successfully', data: building });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId || null;
      const building = await buildingService.updateBuilding(req.params.id, req.body, userId);
      res.status(200).json({ success: true, message: 'Building updated successfully', data: building });
    } catch (err) {
      next(err);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId || null;
      const { is_active } = req.body;
      const building = await buildingService.changeStatus(req.params.id, is_active, userId);
      res.status(200).json({
        success: true,
        message: `Building ${is_active ? 'activated' : 'deactivated'} successfully`,
        data: building
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId || null;
      await buildingService.deleteBuilding(req.params.id, userId);
      res.status(200).json({ success: true, message: 'Building deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getUtilization(req, res, next) {
    try {
      const utilization = await buildingService.getBuildingUtilization(req.params.id);
      res.status(200).json({ success: true, data: utilization });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BuildingController();
