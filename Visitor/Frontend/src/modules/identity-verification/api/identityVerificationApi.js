import api from '../../../services/api';

/**
 * identityVerificationApi
 * Frontend API client communicating with /api/v1/identity-verification
 */
export const identityVerificationApi = {
  // Visitor Self-Service
  getStatus: async () => {
    const res = await api.get('/v1/identity-verification/status');
    return res.data?.data;
  },

  createCase: async (payload) => {
    const res = await api.post('/v1/identity-verification/cases', payload);
    return res.data?.data;
  },

  submitEvidence: async (caseId, formData) => {
    const res = await api.post(`/v1/identity-verification/cases/${caseId}/evidence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.data;
  },

  // Reviewer Operations
  getReviewerQueue: async (params = {}) => {
    const res = await api.get('/v1/identity-verification/reviewer/queue', { params });
    return res.data?.data;
  },

  getCaseDetail: async (caseId) => {
    const res = await api.get(`/v1/identity-verification/reviewer/cases/${caseId}`);
    return res.data?.data;
  },

  recordDecision: async (caseId, decisionData) => {
    const res = await api.post(`/v1/identity-verification/reviewer/cases/${caseId}/decision`, decisionData);
    return res.data?.data;
  },

  // Policy Settings
  getPolicy: async (organizationId) => {
    const res = await api.get('/v1/identity-verification/policies', {
      params: { organizationId },
    });
    return res.data?.data;
  },

  updatePolicy: async (policyData) => {
    const res = await api.put('/v1/identity-verification/policies', policyData);
    return res.data?.data;
  },
};

export default identityVerificationApi;
