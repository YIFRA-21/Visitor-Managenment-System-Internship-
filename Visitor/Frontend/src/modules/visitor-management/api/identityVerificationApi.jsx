import api from '../../../services/api';
export const identityVerificationApi = {
    // Step 1: Start session with country & document type
    startSession: async (visitorId, docType, country = 'Ethiopia') => {
        const response = await api.post('/identity-verification/start', { visitorId, docType, country });
        return response.data;
    },
    // Step 2: Create Mobile QR Session
    createMobileSession: async (sessionId) => {
        const response = await api.post(`/identity-verification/${sessionId}/mobile-session`);
        return response.data;
    },
    // Check Mobile Session Status
    getMobileStatus: async (token) => {
        const response = await api.get(`/identity-verification/mobile-status/${token}`);
        return response.data;
    },
    // Step 3: Upload Front Document
    uploadFront: async (sessionId, imagePayload) => {
        const response = await api.post(`/identity-verification/${sessionId}/upload-front`, { imagePayload });
        return response.data;
    },
    // Step 4: Upload Back Document
    uploadBack: async (sessionId, imagePayload) => {
        const response = await api.post(`/identity-verification/${sessionId}/upload-back`, { imagePayload });
        return response.data;
    },
    // Step 5: Analyze Document
    analyzeDocument: async (sessionId) => {
        const response = await api.post(`/identity-verification/${sessionId}/analyze-document`);
        return response.data;
    },
    // Step 6: Upload Live Selfie
    uploadSelfie: async (sessionId, imagePayload) => {
        const response = await api.post(`/identity-verification/${sessionId}/upload-selfie`, { imagePayload });
        return response.data;
    },
    // Step 7: Run Visual Liveness
    runLiveness: async (sessionId, completedChallenges) => {
        const response = await api.post(`/identity-verification/${sessionId}/run-liveness`, { completedChallenges });
        return response.data;
    },
    // Step 8: Run Face Match (ONLY Selfie vs Front Doc Portrait)
    runFaceMatch: async (sessionId) => {
        const response = await api.post(`/identity-verification/${sessionId}/run-facematch`);
        return response.data;
    },
    // Step 9: Run Security Validation
    validateSecurity: async (sessionId) => {
        const response = await api.post(`/identity-verification/${sessionId}/validate-security`);
        return response.data;
    },
    // Step 10: Complete Verification
    completeVerification: async (sessionId) => {
        const response = await api.post(`/identity-verification/${sessionId}/complete`);
        return response.data;
    },
    // Get Verification Report
    getReport: async (sessionId) => {
        const response = await api.get(`/identity-verification/${sessionId}/report`);
        return response.data;
    },
    // View Verification History
    getHistory: async (visitorId) => {
        const response = await api.get(`/identity-verification/history/${visitorId}`);
        return response.data;
    },
};
export default identityVerificationApi;
