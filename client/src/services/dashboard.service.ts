import api from './api';

export const dashboardService = {
  getDashboardData: () => api.get('/dashboard'),
};
