import api from './api';

export const invoiceService = {
  getPO: (poId: string) => api.get(`/pos/${poId}`),
  updatePOStatus: (poId: string, status: 'DRAFT' | 'SENT' | 'ACKNOWLEDGED' | 'CLOSED') =>
    api.put(`/pos/${poId}/status`, { status }),
  getPOInvoice: (poId: string) => api.get(`/invoices/po/${poId}`),
  generateInvoice: (purchaseOrderId: string) => api.post('/invoices/generate', { purchaseOrderId }),
  updateInvoiceStatus: (invoiceId: string, status: 'PENDING_PAYMENT' | 'PAID' | 'OVERDUE') =>
    api.put(`/invoices/${invoiceId}/status`, { status }),
  emailInvoice: (invoiceId: string) => api.post(`/invoices/${invoiceId}/email`),
  downloadPDF: (invoiceId: string) => api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' }),
};

