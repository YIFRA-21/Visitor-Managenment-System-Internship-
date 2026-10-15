import { apiClient } from '../../../services/apiClient';
export const calendarService = {
    getEvents: (params) => apiClient.get('/calendar', { params }),
    createEvent: (data) => apiClient.post('/calendar', data),
    updateEvent: (id, data) => apiClient.put(`/calendar/${id}`, data),
    deleteEvent: (id) => apiClient.delete(`/calendar/${id}`),
};
export default calendarService;
