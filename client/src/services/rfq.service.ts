import api from './api';

export const rfqService = {
  createRFQ: (data: any) => api.post('/rfqs', data),
  getRFQs: () => api.get('/rfqs'),
  getRFQDetails: (id: string) => api.get(`/rfqs/${id}`),
};
