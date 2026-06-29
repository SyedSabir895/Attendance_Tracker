import api from './axios';

export const designationAPI = {
  getAll: (params) => api.get('/designations', { params }),
  getOne: (id) => api.get(`/designations/${id}`),
  create: (data) => api.post('/designations', data),
  update: (id, data) => api.put(`/designations/${id}`, data),
  delete: (id) => api.delete(`/designations/${id}`),
};
