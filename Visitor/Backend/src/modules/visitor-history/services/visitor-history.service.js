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
    await visitorHistoryRepository.updateMetadata(id, updateData);
    const history = await visitorHistoryRepository.getById(id);
    return history;
  }

  async softDeleteHistory(id) {
    return await visitorHistoryRepository.softDelete(id);
  }
}

module.exports = new VisitorHistoryService();
