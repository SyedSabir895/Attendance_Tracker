import api from './axios';

export const holidayAPI = {
  getAll: (params) => api.get('/holidays', { params }),
  getOne: (id) => api.get(`/holidays/${id}`),
  create: (data) => api.post('/holidays', data),
  update: (id, data) => api.put(`/holidays/${id}`, data),
  delete: (id) => api.delete(`/holidays/${id}`),
};
