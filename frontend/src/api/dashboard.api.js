import api from './axios';

export const dashboardAPI = {
  getAdmin: () => api.get('/dashboard'),
  getEmployee: () => api.get('/dashboard/employee'),
};
