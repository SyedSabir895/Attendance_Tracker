import api from './axios';

export const reportAPI = {
  getAttendance: (params) => api.get('/reports/attendance', { params }),
  getAnalytics: (params) => api.get('/reports/analytics', { params }),
  exportData: (params) => api.get('/reports/export', { params }),
};
