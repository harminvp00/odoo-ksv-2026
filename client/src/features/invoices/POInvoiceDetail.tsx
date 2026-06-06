import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import { invoiceService } from '../../services/invoice.service';
import { dashboardService } from '../../services/dashboard.service';
import { useAuth } from '../../hooks/useAuth';
import { 
  FileText, ClipboardCheck, AlertCircle, Loader2, 
  ArrowLeft, Download, Mail, CheckCircle2, RefreshCw 
} from 'lucide-react';

export default function POInvoiceDetail() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const poId = searchParams.get('poId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Details state
  const [po, setPo] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // List view state
  const [recentPOs, setRecentPOs] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const fetchDashboardDataForLists = async () => {
    try {
      setLoadingList(true);
      setError('');
      const res = await dashboardService.getDashboardData();
      setRecentPOs(res.data.recentPOs || []);
      setRecentInvoices(res.data.recentInvoices || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retrieve purchase orders and invoices.');
    } finally {
      setLoadingList(false);
    }
  };

  const fetchPODetails = async (id: string) => {
    try {
      setLoading(true);
      setError('');
      // 1. Fetch PO details
      const poRes = await invoiceService.getPO(id);
      setPo(poRes.data);
      
      // 2. Fetch associated invoice details (might return 404 if not generated yet)
      setLoadingInvoice(true);
      setInvoice(null);
      try {
        const invRes = await invoiceService.getPOInvoice(id);
        setInvoice(invRes.data);
      } catch (invErr: any) {
        if (invErr.response?.status !== 404) {
          console.error('Failed to load PO invoice:', invErr);
        }
      } finally {
        setLoadingInvoice(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retrieve PO details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (poId) {
      fetchPODetails(poId);
    } else {
      fetchDashboardDataForLists();
    }
  }, [poId]);

  const handleGenerateInvoice = async () => {
    if (!poId) return;
    setActionLoading(true);
    try {
      const res = await invoiceService.generateInvoice(poId);
      alert('Invoice generated successfully!');
      setInvoice(res.data);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to generate invoice for this Purchase Order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePOStatus = async (status: any) => {
    if (!poId) return;
    try {
      const res = await invoiceService.updatePOStatus(poId, status);
      setPo(res.data);
      alert(`PO status updated to: ${status}`);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update PO status.');
    }
  };

  const handleUpdateInvoiceStatus = async (status: any) => {
    if (!invoice?.id) return;
    try {
      const res = await invoiceService.updateInvoiceStatus(invoice.id, status);
      setInvoice(res.data);
      alert(`Invoice status updated to: ${status}`);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update Invoice status.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice?.id) return;
    try {
      setActionLoading(true);
      const res = await invoiceService.downloadPDF(invoice.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download invoice PDF.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmailInvoice = async () => {
    if (!invoice?.id) return;
    try {
      setActionLoading(true);
      await invoiceService.emailInvoice(invoice.id);
      alert('Invoice PDF has been successfully dispatched to supplier email!');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to dispatch email.');
    } finally {
      setActionLoading(false);
    }
  };

  const isStaff = user?.role === 'ADMIN' || user?.role === 'PROCUREMENT_OFFICER' || user?.role === 'MANAGER';
  const isPOAuthorizer = user?.role === 'ADMIN' || user?.role === 'PROCUREMENT_OFFICER';

  // LIST VIEW: Show directory if no PO is selected
  if (!poId) {
    return (
      <Layout>
        <div className="space-y-6 max-w-7xl mx-auto w-full font-sans select-none">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Purchase Orders & Invoices</h1>
            <p className="text-xs text-neutral-500 mt-1">Review active and historical purchase orders and linked customer invoices</p>
          </div>

          {error && (
            <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs font-semibold">
              {error}
            </div>
          )}

          {loadingList ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-200/80 rounded-2xl">
              <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
              <p className="text-xs text-neutral-500 mt-3 font-semibold">Retrieving purchase order directory...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Purchase Orders panel */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-neutral-950">Purchase Orders</h3>
                
                {recentPOs.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-neutral-200 rounded-xl">
                    <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-500 font-semibold">No Purchase Orders Issued.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-neutral-200/80 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-250 bg-neutral-50/50">
                          <th className="px-4 py-3 font-semibold text-neutral-500">PO Number</th>
                          {user?.role !== 'VENDOR' && <th className="px-4 py-3 font-semibold text-neutral-500">Vendor</th>}
                          <th className="px-4 py-3 font-semibold text-neutral-500">Status</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {recentPOs.map((p) => (
                          <tr key={p.id} className="hover:bg-neutral-50/50">
                            <td className="px-4 py-3.5 font-bold text-neutral-900">{p.poNumber}</td>
                            {user?.role !== 'VENDOR' && <td className="px-4 py-3.5 text-neutral-500 font-medium">{p.vendor?.name}</td>}
                            <td className="px-4 py-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-neutral-100 text-neutral-600 border border-neutral-200">
                                {p.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <Button size="sm" onClick={() => setSearchParams({ poId: p.id })}>
                                Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Invoices panel */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-neutral-950">Linked Invoices</h3>
                
                {recentInvoices.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-neutral-200 rounded-xl">
                    <ClipboardCheck className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-500 font-semibold">No invoices generated yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-neutral-200/80 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-250 bg-neutral-50/50">
                          <th className="px-4 py-3 font-semibold text-neutral-500">Invoice Number</th>
                          <th className="px-4 py-3 font-semibold text-neutral-500">PO Ref</th>
                          <th className="px-4 py-3 font-semibold text-neutral-500">Status</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {recentInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-neutral-50/50">
                            <td className="px-4 py-3.5 font-bold text-neutral-900">{inv.invoiceNumber}</td>
                            <td className="px-4 py-3.5 text-neutral-500 font-mono font-semibold">{inv.purchaseOrder?.poNumber}</td>
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
                              <Button size="sm" onClick={() => setSearchParams({ poId: inv.purchaseOrderId })}>
                                Details
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
          )}
        </div>
      </Layout>
    );
  }

  // DETAIL VIEW: Load specific PO Details
  if (!po) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
        </div>
      </Layout>
    );
  }

  // Calculations from PO items (which are quotation line items)
  const lineItems = po.quotation?.lineItems || [];
  const subtotal = Number(po.quotation?.subtotal || 0);
  const gstAmount = Number(po.quotation?.gstAmount || 0);
  const grandTotal = Number(po.quotation?.grandTotal || 0);
  const gstPercentage = Number(po.quotation?.gstPercentage || 18.0);

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto w-full font-sans select-none">
        
        {/* Back and Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSearchParams({})} className="p-2 hover:bg-neutral-150 rounded-xl transition border border-neutral-200 bg-white" title="Back to Directory">
              <ArrowLeft className="w-4 h-4 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">Purchase Order & Invoice Details</h1>
              <p className="text-xs text-neutral-500 mt-1">
                PO: <span className="font-semibold text-neutral-700">{po.poNumber}</span> — Created: {new Date(po.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {invoice && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleDownloadPDF} disabled={actionLoading} className="gap-1.5">
                <Download className="w-3.5 h-3.5" />
                <span>PDF Invoice</span>
              </Button>
              <Button size="sm" onClick={handleEmailInvoice} disabled={actionLoading} className="gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Email Vendor</span>
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Document Details (PO / Bill to) */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
              
              {/* Addresses section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-neutral-100 pb-6 text-xs">
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Bill To:</h4>
                  <p className="font-bold text-neutral-900 text-sm">VendorBridge procurement Workspace</p>
                  <p className="text-neutral-500">123 Corporate Park, Ahmedabad, India</p>
                  <p className="font-mono text-neutral-400">GSTIN: 24AABCV3415Z1Z9</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Vendor Details:</h4>
                  <p className="font-bold text-neutral-900 text-sm">{po.vendor?.name}</p>
                  <p className="text-neutral-500">{po.vendor?.address || 'Registered Address'}</p>
                  <p className="font-mono text-neutral-400">GSTIN: {po.vendor?.gstNo}</p>
                  <p className="text-neutral-500">Contact: {po.vendor?.contactNo}</p>
                </div>
              </div>

              {/* Purchase Order Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-neutral-500">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">PO Reference</span>
                  <span className="font-bold text-neutral-900 text-sm block mt-1">{po.poNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">RFQ Reference</span>
                  <span className="font-bold text-neutral-900 text-sm block mt-1">{po.rfq?.title || 'RFQ Reference'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">PO Status</span>
                  {isPOAuthorizer ? (
                    <select
                      value={po.status}
                      onChange={(e) => handleUpdatePOStatus(e.target.value)}
                      className="input py-0.5 px-2 mt-1 w-36 text-xs cursor-pointer border-neutral-200"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="SENT">SENT</option>
                      <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  ) : (
                    <span className="font-bold text-neutral-900 text-sm block mt-1 uppercase">{po.status}</span>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-neutral-200/80 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200/80 bg-neutral-50/50">
                      <th className="px-6 py-3.5 font-semibold text-neutral-500 uppercase tracking-wider">Item / Scope</th>
                      <th className="px-6 py-3.5 font-semibold text-neutral-500 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-3.5 font-semibold text-neutral-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-3.5 font-semibold text-neutral-500 uppercase tracking-wider text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {lineItems.map((li: any, idx: number) => (
                      <tr key={li.id} className="hover:bg-neutral-50/20">
                        <td className="px-6 py-4 font-bold text-neutral-900">{li.item}</td>
                        <td className="px-6 py-4 text-neutral-500 font-semibold">{li.qty} {li.unit}</td>
                        <td className="px-6 py-4 text-neutral-500 font-semibold">${Number(li.unitPrice).toFixed(2)}</td>
                        <td className="px-6 py-4 font-bold text-neutral-900 text-right">${Number(li.totalVal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tax totals */}
              <div className="flex justify-end pt-4 border-t border-neutral-100">
                <div className="w-72 space-y-2.5 text-xs text-neutral-500">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-neutral-900 font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({gstPercentage.toFixed(1)}%)</span>
                    <span className="text-neutral-900 font-bold">${gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-neutral-200 pt-3 flex justify-between font-bold text-sm text-neutral-950">
                    <span>Grand Total</span>
                    <span className="text-neutral-950 font-extrabold">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Right Sidebar - Invoice Information panel */}
          <div className="space-y-6">
            
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm space-y-5">
              <h3 className="text-sm font-semibold text-neutral-950">Invoice Workspace</h3>
              
              {loadingInvoice ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="w-5 h-5 text-neutral-900 animate-spin" />
                </div>
              ) : invoice ? (
                // Invoice Details Panel
                <div className="space-y-4.5">
                  <div className="text-xs space-y-2 border-b border-neutral-100 pb-4">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Invoice No.</span>
                      <span className="font-bold text-neutral-900">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Issued On</span>
                      <span className="font-semibold text-neutral-800">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Payment Due</span>
                      <span className="font-semibold text-neutral-800">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Payment Status</span>
                    {isStaff ? (
                      <select
                        value={invoice.status}
                        onChange={(e) => handleUpdateInvoiceStatus(e.target.value)}
                        className="input cursor-pointer"
                      >
                        <option value="PENDING_PAYMENT">Pending Payment</option>
                        <option value="PAID">Paid</option>
                        <option value="OVERDUE">Overdue</option>
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1 text-center text-xs font-bold uppercase rounded-xl tracking-wider ${
                        invoice.status === 'PAID' ? 'bg-accent-successBg text-accent-success border border-accent-success/20' :
                        invoice.status === 'OVERDUE' ? 'bg-accent-dangerBg text-accent-danger border border-accent-danger/20' :
                        'bg-accent-warningBg text-accent-warning border border-accent-warning/20'
                      }`}>
                        {invoice.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {invoice.status === 'PAID' && (
                    <div className="p-3 bg-accent-successBg border border-accent-success/20 rounded-xl text-accent-success text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Payment Processed and Settled</span>
                    </div>
                  )}

                </div>
              ) : (
                // Empty state or Generate Invoice panel
                <div className="space-y-4">
                  <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                    No customer invoice has been generated for this approved purchase order yet.
                  </p>
                  
                  {isStaff ? (
                    <Button 
                      onClick={handleGenerateInvoice} 
                      disabled={actionLoading}
                      className="w-full py-2.5 gap-2"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Invoice...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                          <span>Generate Invoice</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl text-xs text-neutral-400 text-center font-medium">
                      Awaiting invoice dispatch from the procurement officer.
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
}
