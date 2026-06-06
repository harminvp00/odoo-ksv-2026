import api from './api';

export const activityService = {
  getActivityLogs: (type?: string) => api.get('/activity', { params: { type } }),
};

