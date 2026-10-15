// src/repositories/ReceptionQueueRepository.js
// Repository for Reception Waiting Queue and Performance Metrics

const mockQueues = [
  {
    queueId: 'q_main_01',
    deskId: 'desk_main_lobby_01',
    buildingId: 'bldg_hq',
    totalWaiting: 5,
    avgWaitTimeMinutes: 11.5,
    longWaitingCount: 1,
    queueList: [
      { ticketNo: 'T-101', visitorName: 'Sarah Jenkins', type: 'VIP Appointment', waitMinutes: 18, status: 'Waiting Host' },
      { ticketNo: 'T-102', visitorName: 'Michael Brown', type: 'Contractor', waitMinutes: 12, status: 'Badge Pending' },
      { ticketNo: 'T-103', visitorName: 'Carlos Santana', type: 'Walk-in', waitMinutes: 8, status: 'Check-In In Progress' },
      { ticketNo: 'T-104', visitorName: 'Dr. Aris Thorne', type: 'Pre-registered', waitMinutes: 5, status: 'Identity Verifying' },
      { ticketNo: 'T-105', visitorName: 'Jessica Taylor', type: 'Standard Appointment', waitMinutes: 2, status: 'Waiting Desk' }
    ]
  }
];

class ReceptionQueueRepository {
  async getQueueStatus(scope) {
    return mockQueues.find(q => q.deskId === scope.deskId) || mockQueues[0];
  }
}

module.exports = new ReceptionQueueRepository();
