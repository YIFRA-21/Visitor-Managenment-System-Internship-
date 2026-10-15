// src/repositories/SecurityInvestigationRepository.js
// Repository for Security Investigation Cases

const mockCases = [
  {
    caseId: 'case_8001',
    title: 'Watchlist Visitor Detection & Turnstile Attempt',
    subjectName: 'Arthur Pendelton',
    idNumber: 'ID-99021-X',
    status: 'Active Investigation',
    priority: 'High',
    buildingId: 'bldg_hq',
    assignedOfficer: 'Officer Marcus Vance',
    linkedNotifications: ['secnotif_3001'],
    evidenceList: [
      { type: 'CCTV Snapshot', filename: 'snap_turnstile_3001.jpg', uploadedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
      { type: 'ID Document Scan', filename: 'ocr_national_id_804.pdf', uploadedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString() }
    ],
    notes: ['Subject attempted entry using expired contractor pass. Hold order issued to reception.'],
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  }
];

class SecurityInvestigationRepository {
  async getCases(scope) {
    return mockCases.filter(c => c.buildingId === scope.buildingId);
  }

  async createCase(caseData, scope) {
    const newCase = {
      caseId: `case_${Date.now()}`,
      ...caseData,
      buildingId: scope.buildingId,
      assignedOfficer: `Officer ID #${scope.securityUserId}`,
      linkedNotifications: caseData.linkedNotifications || [],
      evidenceList: [],
      notes: [caseData.initialNote || 'Case created'],
      status: 'Active Investigation',
      createdAt: new Date().toISOString()
    };
    mockCases.unshift(newCase);
    return newCase;
  }
}

module.exports = new SecurityInvestigationRepository();
