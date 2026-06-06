import api from './api';

export const activityService = {
  getActivityLogs: (category?: string) => api.get('/activity', { params: { category } }),
};
