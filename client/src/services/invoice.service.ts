import api from './api';

export const invoiceService = {
  getPOInvoice: (poId: string) => api.get(`/invoices/po/${poId}`),
  emailInvoice: (invoiceId: string) => api.post(`/invoices/${invoiceId}/email`),
  downloadPDF: (invoiceId: string) => api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' }),
};
