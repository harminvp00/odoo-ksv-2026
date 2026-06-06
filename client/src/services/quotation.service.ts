import api from './api';

export const quotationService = {
  submitQuotation: (data: any) => api.post('/quotations', data),
  getQuotationsByRFQ: (rfqId: string) => api.get(`/quotations/rfq/${rfqId}`),
  compareQuotations: (rfqId: string) => api.get(`/quotations/compare/${rfqId}`),
};
