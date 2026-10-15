import { apiClient } from '../../../services/apiClient';
export const departmentService = {
    list: () => apiClient.get('/departments'),
    publicList: () => apiClient.get('/departments/public'),
    create: (data) => apiClient.post('/departments', data),
    employees: (id) => apiClient.get(`/departments/${id}/employees`),
};
export default departmentService;
