const activityRepository = require('../repositories/activity.repository');

class ActivityService {
  async getActivities(limit = 10) {
    const activities = await activityRepository.findRecent(limit);
    // Format activities for Frontend view
    const formatted = activities.map(a => ({
      id: a.id,
      user: a.username,
      action: a.action,
      date: new Date(a.timestamp).toISOString().split('T')[0],
      time: new Date(a.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: a.status || 'completed',
      module: a.module,
      avatar: null
    }));
    return { success: true, data: formatted, total: formatted.length };
  }

  async searchActivities(query) {
    const activities = await activityRepository.search(query);
    const formatted = activities.map(a => ({
      id: a.id,
      user: a.username,
      action: a.action,
      date: new Date(a.timestamp).toISOString().split('T')[0],
      time: new Date(a.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: a.status || 'completed',
      module: a.module,
      avatar: null
    }));
    return { success: true, data: formatted, total: formatted.length };
  }
}

module.exports = new ActivityService();
