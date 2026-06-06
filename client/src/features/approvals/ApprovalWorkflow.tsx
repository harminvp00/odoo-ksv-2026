import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import { approvalService } from '../../services/approval.service';
import { dashboardService } from '../../services/dashboard.service';
import { useAuth } from '../../hooks/useAuth';
import { 
  CheckCircle2, Clock, AlertCircle, Loader2, 
  ArrowLeft, MessageSquare, ClipboardCheck, XCircle 
} from 'lucide-react';

export default function ApprovalWorkflow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const approvalId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Detail state
  const [approval, setApproval] = useState<any>(null);

  // List state (for fallback)
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const fetchList = async () => {
    try {
      setLoadingList(true);
      setError('');
      const res = await dashboardService.getDashboardData();
      setPendingApprovals(res.data.pendingApprovals || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load pending approvals list.');
    } finally {
      setLoadingList(false);
    }
  };

  const fetchWorkflowDetails = async (id: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await approvalService.getWorkflow(id);
      setApproval(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load approval workflow details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (approvalId) {
      fetchWorkflowDetails(approvalId);
    } else {
      fetchList();
    }
  }, [approvalId]);

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!approvalId) return;
    if (action === 'REJECT' && !remarks.trim()) {
      alert('Remarks are required when rejecting a bid.');
      return;
    }

    setActionLoading(true);
    try {
      await approvalService.actionApproval(approvalId, { action, remarks });
      alert(`Workflow successfully ${action === 'APPROVE' ? 'approved' : 'rejected'}!`);
      setRemarks('');
      fetchWorkflowDetails(approvalId);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to complete approval action.');
    } finally {
      setActionLoading(false);
    }
  };

  const goBack = () => {
    setSearchParams({});
    setApproval(null);
  };

  // Check if current user is the assigned approver for the active step
  const getActiveStepInfo = () => {
    if (!approval || !approval.chain) return null;
    const activeStep = approval.chain.find((step: any) => step.status === 'PENDING');
    if (!activeStep) return null;
    const isAssigned = activeStep.userId === user?.id || user?.role === 'ADMIN';
    return { activeStep, isAssigned };
  };

  const activeStepInfo = getActiveStepInfo();

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
          <p className="text-xs text-neutral-500 mt-4 font-semibold">Retrieving approval workflow...</p>
        </div>
      </Layout>
    );
  }

  // LIST VIEW: Show all pending approvals if no ID selected
  if (!approvalId) {
    return (
      <Layout>
        <div className="space-y-6 max-w-7xl mx-auto w-full font-sans select-none">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Approval Registry</h1>
            <p className="text-xs text-neutral-500 mt-1">Review and authorize pending procurement requests and supplier bids</p>
          </div>

          {error && (
            <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs font-semibold">
              {error}
            </div>
          )}

          {loadingList ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-200/80 rounded-2xl">
              <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
              <p className="text-xs text-neutral-500 mt-3 font-semibold">Loading pending workflows...</p>
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-16 bg-white border border-neutral-250/20 rounded-2xl border-dashed">
              <ClipboardCheck className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-neutral-900">All Workflows Cleared</h3>
              <p className="text-xs text-neutral-500 mt-1">There are no pending approvals requiring your authorization.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto border border-neutral-200/80 rounded-2xl bg-white shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/80 bg-neutral-50/50">
                    <th className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider">RFQ Reference</th>
                    <th className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider">Supplier Name</th>
                    <th className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider">Total Value</th>
                    <th className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider">Current Stage</th>
                    <th className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pendingApprovals.map((app: any) => (
                    <tr key={app.id} className="hover:bg-neutral-50/50 transition">
                      <td className="px-6 py-4.5 font-bold text-neutral-900">{app.rfq?.title || 'RFQ Reference'}</td>
                      <td className="px-6 py-4.5 text-neutral-500 font-medium">{app.quotation?.vendor?.name || 'Vendor'}</td>
                      <td className="px-6 py-4.5 font-bold text-neutral-900">
                        ${Number(app.quotation?.grandTotal || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4.5 font-mono text-[11px] text-neutral-500">
                        {app.currentStep.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-warningBg text-accent-warning border border-accent-warning/20">
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <Button size="sm" onClick={() => setSearchParams({ id: app.id })}>
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // DETAIL VIEW: Show workflow details if ID is selected
  const rfqTitle = approval?.rfq?.title || 'RFQ Procurement';
  const vendorName = approval?.quotation?.vendor?.name || 'Supplier';
  const grandTotal = Number(approval?.quotation?.grandTotal || 0).toFixed(2);
  const deliveryDays = approval?.quotation?.deliveryDays || 0;
  const rating = approval?.quotation?.vendor?.rating || 0;

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto w-full font-sans select-none">
        
        {/* Detail page header */}
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 hover:bg-neutral-150 rounded-xl transition border border-neutral-200 bg-white" title="Back to List">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Approval Workflow Detailed View</h1>
            <p className="text-xs text-neutral-500 mt-1">
              RFQ: <span className="font-semibold text-neutral-700">{rfqTitle}</span> — Vendor: <span className="font-semibold text-neutral-700">{vendorName}</span> — Total Bid: <span className="font-bold text-neutral-900">${grandTotal}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Workflow Progress Horizontal Bar */}
        {approval && (
          <div className="bg-white border border-neutral-200/80 p-6 rounded-2xl flex items-center justify-around shadow-sm overflow-x-auto gap-4">
            {approval.chain.map((stepItem: any, idx: number) => {
              const isActive = stepItem.status === 'PENDING' && (!approval.chain[idx - 1] || approval.chain[idx - 1].status !== 'PENDING');
              const isDone = stepItem.status === 'APPROVED';
              const isRejected = stepItem.status === 'REJECTED';

              return (
                <React.Fragment key={stepItem.id}>
                  <div className="flex flex-col items-center space-y-1.5 min-w-[90px]">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      isDone ? 'bg-neutral-950 text-white shadow-sm' :
                      isRejected ? 'bg-accent-danger text-white border border-accent-danger' :
                      isActive ? 'bg-accent-warningBg text-accent-warning border border-accent-warning/20 animate-pulse font-semibold' :
                      'bg-neutral-50 text-neutral-400 border border-neutral-100'
                    }`}>
                      {isDone ? '✓' : isRejected ? '✗' : idx + 1}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      isRejected ? 'text-accent-danger' :
                      isActive ? 'text-accent-warning' : 
                      isDone ? 'text-neutral-900' : 'text-neutral-400'
                    }`}>
                      {stepItem.role.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {idx < approval.chain.length - 1 && (
                    <div className="h-[1px] bg-neutral-200 flex-1 min-w-[30px] mb-4"></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Timeline of approvals chain */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 space-y-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-neutral-450 uppercase tracking-wider mb-5">Approval Chain Audit Timeline</h3>
              <div className="space-y-6 relative border-l border-neutral-100 pl-4 ml-2.5">
                {approval?.chain.map((stepItem: any, idx: number) => {
                  const isDone = stepItem.status === 'APPROVED';
                  const isRejected = stepItem.status === 'REJECTED';
                  const isPending = stepItem.status === 'PENDING';

                  return (
                    <div key={stepItem.id} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 ${
                        isDone ? 'bg-neutral-950 border-neutral-950' :
                        isRejected ? 'bg-accent-danger border-accent-danger' :
                        isPending ? 'bg-accent-warning border-accent-warning animate-ping' :
                        'bg-neutral-250 border-neutral-250'
                      }`}></span>
                      <span className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 ${
                        isDone ? 'bg-neutral-950 border-neutral-950' :
                        isRejected ? 'bg-accent-danger border-accent-danger' :
                        isPending ? 'bg-accent-warning border-accent-warning' :
                        'bg-neutral-200 border-neutral-200'
                      }`}></span>

                      <div className="space-y-0.5">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-neutral-900">
                            {stepItem.user?.firstName} {stepItem.user?.lastName} ({stepItem.role.replace(/_/g, ' ')})
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            isDone ? 'bg-accent-successBg text-accent-success border border-accent-success/20' :
                            isRejected ? 'bg-accent-dangerBg text-accent-danger border border-accent-danger/20' :
                            'bg-neutral-100 text-neutral-500 border border-neutral-200'
                          }`}>
                            {stepItem.status}
                          </span>
                        </div>
                        {stepItem.actionDate && (
                          <p className="text-[10px] text-neutral-400 font-medium">
                            Processed: {new Date(stepItem.actionDate).toLocaleString()}
                          </p>
                        )}
                        {stepItem.remarks && (
                          <div className="mt-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 text-[11px] text-neutral-500 flex items-start gap-1.5 font-medium">
                            <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-neutral-400 shrink-0" />
                            <span>"{stepItem.remarks}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action remarks text input (only if active step is assigned to user) */}
            {approval?.status === 'PENDING' && activeStepInfo && (
              <div className="pt-5 border-t border-neutral-100 flex flex-col space-y-3">
                {activeStepInfo.isAssigned ? (
                  <>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-500">Remarks / Review Feedback*</label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add authorization reasons or reject instructions..."
                        className="w-full h-20 input resize-none text-xs"
                        disabled={actionLoading}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 py-2.5" 
                        onClick={() => handleAction('APPROVE')} 
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Processing...' : 'Approve Bid'}
                      </Button>
                      <Button 
                        variant="danger" 
                        className="flex-1 py-2.5" 
                        onClick={() => handleAction('REJECT')} 
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Processing...' : 'Reject Bid'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 text-xs text-neutral-500 text-center font-medium flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <span>Awaiting authorization from {activeStepInfo.activeStep?.user?.firstName} {activeStepInfo.activeStep?.user?.lastName}.</span>
                  </div>
                )}
              </div>
            )}

            {/* Status indicators for completed chains */}
            {approval?.status === 'APPROVED' && (
              <div className="pt-4 border-t border-neutral-100 p-3 bg-accent-successBg border border-accent-success/20 rounded-xl text-accent-success text-xs font-semibold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5" />
                <span>This procurement quotation has been fully approved. Draft PO has been generated.</span>
              </div>
            )}
            {approval?.status === 'REJECTED' && (
              <div className="pt-4 border-t border-neutral-100 p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs font-semibold text-center flex items-center justify-center gap-2">
                <XCircle className="w-4.5 h-4.5" />
                <span>This quotation has been rejected. Bidding workflow terminated.</span>
              </div>
            )}

          </div>

          {/* Quotations summary panel */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-neutral-450 uppercase tracking-wider border-b border-neutral-100 pb-2">
                Quotation Bid Summary
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">Vendor Company</span>
                  <span className="font-bold text-neutral-900 text-sm block mt-0.5">{vendorName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">Vendor Rating</span>
                  <span className="font-bold text-neutral-900 text-sm block mt-0.5">{rating > 0 ? `${rating.toFixed(1)} / 5.0` : '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">Delivery days</span>
                  <span className="font-bold text-neutral-900 text-sm block mt-0.5">{deliveryDays} Days</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">Payment Terms</span>
                  <span className="font-bold text-neutral-900 text-sm block mt-0.5">{approval?.quotation?.paymentTerms || 'Net 30 days'}</span>
                </div>
              </div>

              {/* Line items pricing breakdown */}
              {approval?.quotation?.lineItems && (
                <div className="mt-6 border border-neutral-200/80 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200/80 bg-neutral-50/50 text-neutral-500 font-semibold">
                        <th className="px-4 py-2.5">Quoted Item</th>
                        <th className="px-4 py-2.5 text-center">Qty</th>
                        <th className="px-4 py-2.5 text-right">Unit Price</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {approval.quotation.lineItems.map((li: any) => (
                        <tr key={li.id} className="hover:bg-neutral-55/20">
                          <td className="px-4 py-2.5 font-bold text-neutral-800">{li.item}</td>
                          <td className="px-4 py-2.5 text-center text-neutral-500 font-semibold">{li.qty} {li.unit}</td>
                          <td className="px-4 py-2.5 text-right text-neutral-500 font-semibold">${Number(li.unitPrice).toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-neutral-900">${Number(li.totalVal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Total value summary */}
            <div className="pt-4 border-t border-neutral-100 space-y-2.5 text-xs text-neutral-500 bg-neutral-50/50 p-4 rounded-xl border border-neutral-200/60">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-neutral-800">${Number(approval?.quotation?.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & GST ({Number(approval?.quotation?.gstPercentage || 18).toFixed(1)}%)</span>
                <span className="font-bold text-neutral-800">${Number(approval?.quotation?.gstAmount || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-neutral-200/80 pt-2 flex justify-between font-bold text-sm text-neutral-950">
                <span>Grand Total Bid</span>
                <span className="font-extrabold text-neutral-950">${grandTotal}</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
}
