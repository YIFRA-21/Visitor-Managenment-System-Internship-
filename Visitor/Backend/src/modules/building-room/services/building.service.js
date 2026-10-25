const buildingRepository = require('../repositories/building.repository');
const { AppError } = require('../../../middleware/errorHandler');

class BuildingService {
  async listBuildings(filters) {
    return buildingRepository.findAll(filters);
  }

  async getBuilding(id) {
    const building = await buildingRepository.findById(id);
    if (!building) {
      throw new AppError('Building not found', 404);
    }
    return building;
  }

  async createBuilding(data, userId) {
    if (!data.building_name || !data.building_name.trim()) {
      throw new AppError('Building name is required', 400);
    }
    if (!data.building_code || !data.building_code.trim()) {
      throw new AppError('Building code is required', 400);
    }
    if (!data.branch_id) {
      throw new AppError('Branch assignment is required', 400);
    }

    const code = data.building_code.trim().toUpperCase();
    const existing = await buildingRepository.findByCode(code);
    if (existing) {
      throw new AppError(`Building code "${code}" already exists in the system`, 409);
    }

    return buildingRepository.create({
      ...data,
      building_name: data.building_name.trim(),
      building_code: code,
      created_by: userId
    });
  }

  async updateBuilding(id, data, userId) {
    const existing = await this.getBuilding(id);

    if (data.building_code) {
      const code = data.building_code.trim().toUpperCase();
      const duplicate = await buildingRepository.findByCode(code, id);
      if (duplicate) {
        throw new AppError(`Building code "${code}" is already in use by another building`, 409);
      }
      data.building_code = code;
    }

    if (data.building_name) {
      data.building_name = data.building_name.trim();
    }

    return buildingRepository.update(id, {
      ...data,
      updated_by: userId
    });
  }

  async changeStatus(id, isActive, userId) {
    const building = await this.getBuilding(id);

    // If deactivating, check active dependencies
    if (!isActive) {
      const deps = await buildingRepository.checkActiveDependencies(id);
      if (deps.activeAppointments > 0) {
        throw new AppError(
          `Cannot deactivate building "${building.building_name}". There are ${deps.activeAppointments} active/upcoming appointments scheduled in its rooms. Please reassign or conclude them first.`,
          400
        );
      }
      if (deps.activeEmployees > 0) {
        throw new AppError(
          `Cannot deactivate building "${building.building_name}". There are ${deps.activeEmployees} employees assigned here. Please reassign their workplace location first.`,
          400
        );
      }
    }

    return buildingRepository.update(id, {
      is_active: isActive ? 1 : 0,
      updated_by: userId
    });
  }

  async deleteBuilding(id, userId) {
    const building = await this.getBuilding(id);
    const deps = await buildingRepository.checkActiveDependencies(id);

    if (deps.activeFloors > 0) {
      throw new AppError(
        `Cannot delete building "${building.building_name}". It currently has ${deps.activeFloors} active floors. Delete or move floors first.`,
        400
      );
    }
    if (deps.activeAppointments > 0) {
      throw new AppError(
        `Cannot delete building "${building.building_name}". There are ${deps.activeAppointments} active appointments linked to this location.`,
        400
      );
    }
    if (deps.activeEmployees > 0) {
      throw new AppError(
        `Cannot delete building "${building.building_name}". There are ${deps.activeEmployees} employees assigned to this building.`,
        400
      );
    }

    return buildingRepository.softDelete(id, userId);
  }

  async getBuildingUtilization(id) {
    const util = await buildingRepository.getUtilization(id);
    if (!util) {
      throw new AppError('Building not found', 404);
    }
    return util;
  }
}

module.exports = new BuildingService();
