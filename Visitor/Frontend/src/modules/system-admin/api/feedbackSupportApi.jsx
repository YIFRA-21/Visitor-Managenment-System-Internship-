import api from '../../../services/api';
export const feedbackSupportApi = {
    // ── Feedback ───────────────────────────────────────────
    submitFeedback: (data) => api.post('/feedback-support/feedback', data),
    listFeedbacks: (params) => api.get('/feedback-support/feedback', { params }),
    getFeedbackStats: () => api.get('/feedback-support/feedback/stats'),
    acceptFeedback: (id, data) => api.post(`/feedback-support/feedback/${id}/accept`, data),
    updateFeedbackStatus: (id, data) => api.patch(`/feedback-support/feedback/${id}/status`, data),
    // ── Support Tickets ────────────────────────────────────
    createTicket: (data) => api.post('/feedback-support/tickets', data),
    listTickets: (params) => api.get('/feedback-support/tickets', { params }),
    getTicket: (id) => api.get(`/feedback-support/tickets/${id}`),
    getTicketStats: () => api.get('/feedback-support/tickets/stats'),
    addTicketMessage: (ticketId, data) => api.post(`/feedback-support/tickets/${ticketId}/messages`, data),
    updateTicketStatus: (id, data) => api.patch(`/feedback-support/tickets/${id}/status`, data),
};
