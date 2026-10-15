import { apiClient } from '../../../services/apiClient';
export const roomService = {
    list: () => apiClient.get('/rooms'),
    availability: (id, date) => apiClient.get(`/rooms/${id}/availability?date=${date}`),
};
export default roomService;
