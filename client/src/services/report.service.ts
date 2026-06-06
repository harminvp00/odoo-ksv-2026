import api from './api';

export const reportService = {
  getInsights: () => api.get('/reports/insights'),
  exportReport: (type: 'vendor-performance' | 'spending-summary' | 'monthly-trends', format: 'csv' | 'json') =>
    api.get('/reports/export', {
      params: { type, format },
      responseType: format === 'csv' ? 'blob' : 'json',
    }),
};
