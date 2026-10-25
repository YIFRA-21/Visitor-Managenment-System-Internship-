const floorRepository = require('../repositories/floor.repository');
const buildingRepository = require('../repositories/building.repository');
const { AppError } = require('../../../middleware/errorHandler');

class FloorService {
  async listFloors(filters) {
    return floorRepository.findAll(filters);
  }

  async getFloor(id) {
    const floor = await floorRepository.findById(id);
    if (!floor) {
      throw new AppError('Floor not found', 404);
    }
    return floor;
  }

  async createFloor(data, userId) {
    if (!data.building_id) {
      throw new AppError('Building selection is required', 400);
    }
    if (!data.floor_name || !data.floor_name.trim()) {
      throw new AppError('Floor name is required', 400);
    }
    if (data.floor_number === undefined || data.floor_number === null || isNaN(Number(data.floor_number))) {
      throw new AppError('Valid numeric floor number is required (0 for Ground, negative for Basement)', 400);
    }

    const building = await buildingRepository.findById(data.building_id);
    if (!building) {
      throw new AppError('Selected building does not exist', 404);
    }

    const floorNum = parseInt(data.floor_number, 10);
    const existing = await floorRepository.findByBuildingAndNumber(data.building_id, floorNum);
    if (existing) {
      throw new AppError(`Floor level ${floorNum} already exists in "${building.building_name}"`, 409);
    }

    return floorRepository.create({
      ...data,
      floor_number: floorNum,
      floor_name: data.floor_name.trim(),
      created_by: userId
    });
  }

  async updateFloor(id, data, userId) {
    const current = await this.getFloor(id);

    if (data.floor_number !== undefined && data.floor_number !== null) {
      const floorNum = parseInt(data.floor_number, 10);
      const bId = data.building_id || current.building_id;
      const duplicate = await floorRepository.findByBuildingAndNumber(bId, floorNum, id);
      if (duplicate) {
        throw new AppError(`Floor level ${floorNum} is already taken in this building`, 409);
      }
      data.floor_number = floorNum;
    }

    if (data.floor_name) {
      data.floor_name = data.floor_name.trim();
    }

    return floorRepository.update(id, {
      ...data,
      updated_by: userId
    });
  }

  async changeStatus(id, isActive, userId) {
    const floor = await this.getFloor(id);

    if (!isActive) {
      const deps = await floorRepository.checkActiveDependencies(id);
      if (deps.activeRooms > 0) {
        throw new AppError(
          `Cannot deactivate floor "${floor.floor_name}". It contains ${deps.activeRooms} active rooms. Deactivate or reassign rooms first.`,
          400
        );
      }
      if (deps.activeEmployees > 0) {
        throw new AppError(
          `Cannot deactivate floor "${floor.floor_name}". There are ${deps.activeEmployees} employees located on this floor.`,
          400
        );
      }
    }

    return floorRepository.update(id, {
      is_active: isActive ? 1 : 0,
      updated_by: userId
    });
  }

  async deleteFloor(id, userId) {
    const floor = await this.getFloor(id);
    const deps = await floorRepository.checkActiveDependencies(id);

    if (deps.activeRooms > 0) {
      throw new AppError(
        `Cannot delete floor "${floor.floor_name}". It contains ${deps.activeRooms} rooms. Remove rooms first.`,
        400
      );
    }
    if (deps.activeEmployees > 0) {
      throw new AppError(
        `Cannot delete floor "${floor.floor_name}". There are ${deps.activeEmployees} employees assigned here.`,
        400
      );
    }

    return floorRepository.softDelete(id, userId);
  }
}

module.exports = new FloorService();
