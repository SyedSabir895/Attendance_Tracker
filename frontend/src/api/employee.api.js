import api from './axios';

export const employeeAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getOne: (id) => api.get(`/employees/${id}`),
  getMe: () => api.get('/employees/me'),
  getDropdown: () => api.get('/employees/dropdown'),
  create: (data) => api.post('/employees', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/employees/${id}`, data, {
    headers: { 'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json' },
  }),
  delete: (id) => api.delete(`/employees/${id}`),
  toggleStatus: (id, status) => api.patch(`/employees/${id}/status`, { status }),
};
