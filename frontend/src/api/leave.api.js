import api from './axios';

export const leaveAPI = {
  getAll: (params) => api.get('/leaves', { params }),
  getMy: () => api.get('/leaves/my'),
  getOne: (id) => api.get(`/leaves/${id}`),
  create: (data) => api.post('/leaves', data),
  adminCreate: (data) => api.post('/leaves/admin', data),
  updateStatus: (id, data) => api.put(`/leaves/${id}/status`, data),
  cancel: (id) => api.put(`/leaves/${id}/cancel`),
  delete: (id) => api.delete(`/leaves/${id}`),
};
