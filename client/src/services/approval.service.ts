import api from './api';

export const approvalService = {
  getWorkflow: (id: string) => api.get(`/approvals/${id}`),
  actionApproval: (id: string, data: { action: 'APPROVE' | 'REJECT'; remarks: string }) => 
    api.post(`/approvals/${id}/action`, data),
  initiateApproval: (data: { rfqId: string; quotationId: string; approverIds?: string[] }) =>
    api.post('/approvals/initiate', data),
};

