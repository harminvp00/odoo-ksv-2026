import api from './api';

export const vendorService = {
  getVendors: (filters?: any) => api.get('/vendors', { params: filters }),
  registerVendor: (data: any) => api.post('/vendors', data),
  getVendorDetails: (id: string) => api.get(`/vendors/${id}`),
};
