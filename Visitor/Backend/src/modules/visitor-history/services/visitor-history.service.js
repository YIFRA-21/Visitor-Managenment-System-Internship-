const visitorHistoryRepository = require('../repositories/visitor-history.repository');

class VisitorHistoryService {
  async getVisitorHistory(queryParams) {
    return visitorHistoryRepository.getAll(queryParams);
  }

  async getHistoryStats() {
    return visitorHistoryRepository.getStats();
  }

  async getHistoryDetails(id) {
    const history = await visitorHistoryRepository.getById(id);
    if (!history) {
      const error = new Error('Visitor history record not found.');
      error.statusCode = 404;
      throw error;
    }
    return history;
  }

  async updateHistoryMetadata(id, updateData) {
    const history = await visitorHistoryRepository.getById(id);
    if (!history) {
      const error = new Error('Visitor history record not found.');
      error.statusCode = 404;
      throw error;
    }

    const success = await visitorHistoryRepository.updateMetadata(id, updateData);
    if (!success) {
      throw new Error('Failed to update visitor history record.');
    }
    return visitorHistoryRepository.getById(id);
  }

  async softDeleteHistory(id) {
    const history = await visitorHistoryRepository.getById(id);
    if (!history) {
      const error = new Error('Visitor history record not found.');
      error.statusCode = 404;
      throw error;
    }

    return visitorHistoryRepository.softDelete(id);
  }
}

module.exports = new VisitorHistoryService();
