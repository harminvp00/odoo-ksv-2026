import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { dashboardService } from '../../services/dashboard.service';
import { 
  FileText, ClipboardCheck, Banknote, ShieldAlert, 
  TrendingUp, Loader2, ArrowRight, FileCheck, CheckCircle2, 
  Clock, FileSpreadsheet 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await dashboardService.getDashboardData();
        setData(res.data);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getMetricIcon = (title: string) => {
    const term = title.toLowerCase();
    if (term.includes('rfq')) return FileText;
    if (term.includes('approval')) return ClipboardCheck;
    if (term.includes('revenue') || term.includes('spend')) return Banknote;
    return FileCheck;
  };

  const handleActionClick = (action: string) => {
    if (action === 'create_rfq') navigate('/rfqs/create');
    else if (action === 'manage_vendors') navigate('/vendors');
    else if (action === 'review_approvals') navigate('/approvals');
    else if (action === 'view_rfqs') navigate('/dashboard'); // Keep on dashboard or list
    else if (action === 'submit_quotation') navigate('/quotations/submit');
    else if (action === 'view_reports') navigate('/reports');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
          <p className="text-sm text-neutral-500 mt-4 font-medium">Loading workspace metrics...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    const isUnlinkedVendor = user?.role === 'VENDOR' && error.includes('Vendor profile not found');
    return (
      <Layout>
        {isUnlinkedVendor ? (
          <div className="max-w-xl mx-auto py-12 px-6 bg-white border border-neutral-250/20 rounded-2xl shadow-sm text-center space-y-5">
            <ShieldAlert className="w-12 h-12 text-accent-warning mx-auto" />
            <div className="space-y-2">
              <h3 className="text-base font-bold text-neutral-900">Pending Profile Association</h3>
              <p className="text-xs text-nral-500 leading-relaxed max-w-sm mx-auto font-medium">
                Your user account is registered as a <span className="font-semibold text-neutral-700">Vendor</span>, but is not yet associated with a registered Vendor Company Profile.
              </p>
            </div>
            <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-left text-[11px] text-neutral-500 leading-relaxed font-medium">
              <p className="font-bold text-neutral-700 mb-1">Next Steps:</p>
              <ul className="list-disc pl-4 space-y-1.5">
                <li>Contact the organization's Procurement Officers to add your company in their Vendors Directory.</li>
                <li>Ensure they select your email address (<strong>{user?.email}</strong>) in the "Associated User Account" field.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <ShieldAlert className="w-10 h-10 text-accent-danger mb-4" />
            <h3 className="text-sm font-bold text-neutral-900">Unable to load dashboard</h3>
            <p className="text-xs text-neutral-500 mt-1.5">{error}</p>
          </div>
        )}
      </Layout>
    );
  }

  const isVendor = user?.role === 'VENDOR';
  const analytics = data?.analytics || [];
  const activeRFQs = data?.activeRFQs || [];
  const recentPOs = data?.recentPOs || [];
  const recentInvoices = data?.recentInvoices || [];
  const pendingApprovals = data?.pendingApprovals || [];
  const quickActions = data?.quickActions || [];

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto w-full select-none font-sans">
        
        {/* Page title info */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Workspace Dashboard</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Welcome back, {user?.firstName} {user?.lastName} — here is today's overview.
          </p>
        </div>

        {/* KPI Analytics metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {analytics.map((m: any, idx: number) => {
            const Icon = getMetricIcon(m.title);
            return (
              <div key={idx} className="card p-5 bg-white border border-neutral-250/20 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 block tracking-wide uppercase">{m.title}</span>
                  <span className="text-2xl font-bold text-neutral-900 block mt-1.5">{m.value}</span>
                  <span className="text-[10px] text-neutral-450 mt-1 block font-medium">{m.description}</span>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <Icon className="w-5 h-5 text-neutral-900" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main workspace activities */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Pending Approvals Table (Staff Only) */}
            {!isVendor && pendingApprovals.length > 0 && (
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950">Awaiting Your Approval</h3>
                    <p className="text-[11px] text-neutral-450 mt-0.5">Quotations in workflow waiting for authorization</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto border border-neutral-100 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-500 font-semibold">
                        <th className="px-4 py-2.5">RFQ Title</th>
                        <th className="px-4 py-2.5">Vendor</th>
                        <th className="px-4 py-2.5">Amount</th>
                        <th className="px-4 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {pendingApprovals.map((app: any) => (
                        <tr key={app.id} className="hover:bg-neutral-50/50">
                          <td className="px-4 py-3 font-semibold text-neutral-900">{app.rfq?.title}</td>
                          <td className="px-4 py-3 text-neutral-500 font-medium">{app.quotation?.vendor?.name}</td>
                          <td className="px-4 py-3 font-bold text-neutral-900">
                            ${Number(app.quotation?.grandTotal || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" onClick={() => navigate(`/approvals?id=${app.id}`)}>
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Active RFQs Table */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-950">
                    {isVendor ? 'Your Assigned Requests for Quotation (RFQs)' : 'Active Requests for Quotation (RFQs)'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">RFQs open for supplier bidding</p>
                </div>
              </div>
              
              {activeRFQs.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-neutral-200 rounded-xl">
                  <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500 font-semibold">No active RFQs at this moment.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-neutral-100 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-500 font-semibold">
                        <th className="px-4 py-2.5">Title</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5">Deadline</th>
                        <th className="px-4 py-2.5">Status</th>
                        {isVendor && <th className="px-4 py-2.5 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {activeRFQs.map((rfq: any, i: number) => (
                        <tr key={i} className="hover:bg-neutral-50/50">
                          <td className="px-4 py-3.5 font-bold text-neutral-900">{rfq.title}</td>
                          <td className="px-4 py-3.5 text-neutral-500 font-medium">{rfq.category}</td>
                          <td className="px-4 py-3.5 text-neutral-500">{new Date(rfq.deadline).toLocaleDateString()}</td>
                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-0.5 bg-accent-successBg text-accent-success border border-accent-success/20 rounded-full font-bold uppercase text-[9px] tracking-wider">
                              {rfq.status}
                            </span>
                          </td>
                          {isVendor && (
                            <td className="px-4 py-3.5 text-right">
                              <Button size="sm" onClick={() => navigate(`/quotations/submit?rfqId=${rfq.id}`)}>
                                Quote Bid
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Purchase Orders received/issued */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-950 mb-1">Recent Purchase Orders</h3>
              <p className="text-[11px] text-neutral-400 mb-4">POs processed in the workspace</p>

              {recentPOs.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-neutral-200 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500 font-semibold">No recent purchase orders found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-neutral-100 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-500 font-semibold">
                        <th className="px-4 py-2.5">PO Number</th>
                        {!isVendor && <th className="px-4 py-2.5">Vendor</th>}
                        <th className="px-4 py-2.5">RFQ Reference</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {recentPOs.map((po: any, i: number) => (
                        <tr key={i} className="hover:bg-neutral-50/50">
                          <td className="px-4 py-3.5 font-bold text-neutral-900">{po.poNumber}</td>
                          {!isVendor && <td className="px-4 py-3.5 text-neutral-500 font-medium">{po.vendor?.name}</td>}
                          <td className="px-4 py-3.5 text-neutral-500">{po.rfq?.title || 'RFQ Reference'}</td>
                          <td className="px-4 py-3.5 text-neutral-500">{new Date(po.poDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-neutral-100 text-neutral-600 border border-neutral-200">
                              {po.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Button size="sm" onClick={() => navigate(`/invoices?poId=${po.id}`)}>
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Invoices received/submitted */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-950 mb-1">Recent Linked Invoices</h3>
              <p className="text-[11px] text-neutral-400 mb-4">Invoices generated for purchase order fulfillments</p>

              {recentInvoices.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-neutral-200 rounded-xl">
                  <FileSpreadsheet className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500 font-semibold">No invoices generated yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-neutral-100 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-500 font-semibold">
                        <th className="px-4 py-2.5">Invoice Number</th>
                        <th className="px-4 py-2.5">PO Ref</th>
                        <th className="px-4 py-2.5">Total Value</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {recentInvoices.map((inv: any, i: number) => (
                        <tr key={i} className="hover:bg-neutral-50/50">
                          <td className="px-4 py-3.5 font-bold text-neutral-900">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3.5 text-neutral-500 font-mono font-semibold">{inv.purchaseOrder?.poNumber}</td>
                          <td className="px-4 py-3.5 font-bold text-neutral-900">${Number(inv.grandTotal).toFixed(2)}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              inv.status === 'PAID' ? 'bg-accent-successBg text-accent-success border border-accent-success/20' :
                              inv.status === 'OVERDUE' ? 'bg-accent-dangerBg text-accent-danger border border-accent-danger/20' :
                              'bg-accent-warningBg text-accent-warning border border-accent-warning/20'
                            }`}>
                              {inv.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Button size="sm" onClick={() => navigate(`/invoices?poId=${inv.purchaseOrderId}`)}>
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-5">
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm flex flex-col h-full justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-950 mb-1">Quick Workspace Actions</h3>
                <p className="text-[11px] text-neutral-400 mb-6">Common operations for your profile role</p>
                
                <div className="space-y-2.5">
                  {quickActions.map((act: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleActionClick(act.action)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 ${
                        act.primary
                          ? 'bg-neutral-950 text-white hover:bg-neutral-900 border border-neutral-950'
                          : 'bg-white text-neutral-900 hover:bg-neutral-50 border border-neutral-200/80'
                      }`}
                    >
                      <span>{act.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-neutral-100 text-[10px] text-neutral-400 font-medium">
                Connected to Secure ERP Server: <span className="text-neutral-500 font-semibold">Online</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}
