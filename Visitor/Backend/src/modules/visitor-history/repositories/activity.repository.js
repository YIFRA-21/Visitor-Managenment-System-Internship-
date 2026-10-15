const mockActivities = [
  { id: 1, userId: 1, username: 'John Smith', action: 'created organization "Acme Corp"', module: 'Organization', timestamp: '2026-07-20T09:15:00Z', status: 'completed' },
  { id: 2, userId: 2, username: 'Sarah Johnson', action: 'updated branch "Downtown Office"', module: 'Branch', timestamp: '2026-07-20T08:45:00Z', status: 'completed' },
  { id: 3, userId: 3, username: 'Michael Chen', action: 'created department "R&D"', module: 'Department', timestamp: '2026-07-19T16:30:00Z', status: 'completed' },
  { id: 4, userId: 4, username: 'Emily Davis', action: 'activated organization "TechStart"', module: 'Organization', timestamp: '2026-07-19T14:15:00Z', status: 'completed' },
  { id: 5, userId: 5, username: 'Robert Wilson', action: 'updated branding', module: 'Branding', timestamp: '2026-07-19T11:00:00Z', status: 'completed' },
  { id: 6, userId: 6, username: 'Lisa Thompson', action: 'archived department "Legacy Products"', module: 'Department', timestamp: '2026-07-18T15:45:00Z', status: 'completed' },
  { id: 7, userId: 7, username: 'James Brown', action: 'added holiday to business calendar', module: 'Calendar', timestamp: '2026-07-18T13:20:00Z', status: 'pending' },
  { id: 8, userId: 8, username: 'Amanda Garcia', action: 'modified organization settings', module: 'Settings', timestamp: '2026-07-18T10:30:00Z', status: 'completed' },
  { id: 9, userId: 1, username: 'John Smith', action: 'created branch "West Coast Hub"', module: 'Branch', timestamp: '2026-07-17T16:00:00Z', status: 'completed' },
  { id: 10, userId: 2, username: 'Sarah Johnson', action: 'updated contact information', module: 'Contact', timestamp: '2026-07-17T14:00:00Z', status: 'completed' },
  { id: 11, userId: 1, username: 'John Smith', action: 'viewed organization tree', module: 'Organization Tree', timestamp: '2026-07-17T11:15:00Z', status: 'completed' },
  { id: 12, userId: 2, username: 'Sarah Johnson', action: 'exported audit logs', module: 'Audit Logs', timestamp: '2026-07-16T16:45:00Z', status: 'completed' },
];

class ActivityRepository {
  async findAll(limit = 20) {
    return mockActivities.slice(0, limit);
  }

  async findRecent(limit = 10) {
    return [...mockActivities].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }

  async findByUser(userId) {
    return mockActivities.filter(a => a.userId === Number(userId));
  }

  async search(query) {
    const q = query.toLowerCase();
    return mockActivities.filter(
      a => a.username.toLowerCase().includes(q) || a.action.toLowerCase().includes(q) || a.module.toLowerCase().includes(q)
    );
  }

  async create(data) {
    const newActivity = { id: mockActivities.length + 1, ...data, timestamp: new Date().toISOString() };
    mockActivities.unshift(newActivity);
    return newActivity;
  }
}

module.exports = new ActivityRepository();
