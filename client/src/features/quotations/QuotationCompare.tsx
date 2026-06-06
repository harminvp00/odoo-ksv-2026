import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import { rfqService } from '../../services/rfq.service';
import { quotationService } from '../../services/quotation.service';
import { approvalService } from '../../services/approval.service';
import { Loader2, TrendingDown, Star, Calendar, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function QuotationCompare() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [selectedRfqId, setSelectedRfqId] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loadingRFQs, setLoadingRFQs] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [rfqsError, setRfqsError] = useState('');
  const [reportError, setReportError] = useState('');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRFQs = async () => {
      try {
        setLoadingRFQs(true);
        const res = await rfqService.getRFQs();
        setRfqs(res.data || []);
      } catch (err) {
        console.error('Failed to load RFQs:', err);
        setRfqsError('Failed to retrieve active RFQs.');
      } finally {
        setLoadingRFQs(false);
      }
    };
    fetchRFQs();
  }, []);

  const handleRfqSelect = async (rfqId: string) => {
    setSelectedRfqId(rfqId);
    setReport(null);
    setReportError('');
    setSelectedQuoteId(null);
    if (!rfqId) return;

    try {
      setLoadingReport(true);
      const res = await quotationService.compareQuotations(rfqId);
      setReport(res.data);
    } catch (err: any) {
      console.error('Failed to compare quotations:', err);
      setReportError(err.response?.data?.message || 'Failed to compare quotations for this RFQ.');
    } finally {
      setLoadingReport(false);
    }
  };

  const handleSelectQuote = async (quoteId: string) => {
    try {
      setLoadingReport(true);
      await approvalService.initiateApproval({ rfqId: selectedRfqId, quotationId: quoteId });
      setSelectedQuoteId(quoteId);
      alert('Supplier quotation selected successfully! An approval workflow has been automatically initiated.');
      navigate('/approvals');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to select quotation and initiate approval.');
    } finally {
      setLoadingReport(false);
    }
  };

  const isStaff = user?.role === 'ADMIN' || user?.role === 'PROCUREMENT_OFFICER' || user?.role === 'MANAGER';

  if (!isStaff) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center font-sans">
          <AlertCircle className="w-10 h-10 text-neutral-400 mb-4" />
          <h3 className="text-sm font-bold text-neutral-900">Access Restricted</h3>
          <p className="text-xs text-neutral-500 mt-1">Only procurement officers, admins, or managers can view quotation comparisons.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto w-full select-none font-sans">
        
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Quotation Comparison Matrix</h1>
          <p className="text-xs text-neutral-500 mt-1">Analyze and compare supplier bids side-by-side to select the optimal quote</p>
        </div>

        {/* RFQ Select panel */}
        <div className="bg-white border border-neutral-200/80 p-5 rounded-2xl shadow-sm">
          <div className="flex flex-col space-y-1.5 w-full sm:max-w-md">
            <label className="text-xs font-semibold text-neutral-500">Select RFQ to Compare Bids*</label>
            {loadingRFQs ? (
              <div className="flex items-center gap-2 text-xs text-neutral-400 p-2">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
                <span>Loading active RFQs...</span>
              </div>
            ) : rfqsError ? (
              <div className="text-xs text-accent-danger font-medium">{rfqsError}</div>
            ) : rfqs.length === 0 ? (
              <p className="text-xs text-neutral-500 font-semibold p-2">No active RFQs in workspace.</p>
            ) : (
              <select
                value={selectedRfqId}
                onChange={(e) => handleRfqSelect(e.target.value)}
                className="input cursor-pointer"
              >
                <option value="">-- Select RFQ to Compare --</option>
                {rfqs.map(rfq => (
                  <option key={rfq.id} value={rfq.id}>{rfq.title} ({rfq.category})</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Matrix display */}
        {loadingReport ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-200/80 rounded-2xl">
            <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
            <p className="text-xs text-neutral-500 mt-3 font-semibold">Generating comparison report...</p>
          </div>
        ) : reportError ? (
          <div className="text-center py-12 bg-white border border-neutral-200/80 rounded-2xl text-accent-danger text-sm font-medium">
            {reportError}
          </div>
        ) : report && report.quotations.length === 0 ? (
          <div className="text-center py-16 bg-white border border-neutral-200/80 rounded-2xl border-dashed">
            <TrendingDown className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-900">No Bids Submitted Yet</h3>
            <p className="text-xs text-neutral-500 mt-1">This RFQ does not have any quotation submissions from assigned vendors.</p>
          </div>
        ) : report ? (
          <div className="space-y-6">
            
            {/* Grid layout matrix */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200/80 bg-neutral-50/50">
                      <th className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider min-w-[200px]">Criteria / Parameter</th>
                      {report.quotations.map((q: any) => (
                        <th key={q.quotationId} className="px-6 py-4 font-bold text-neutral-900 border-l border-neutral-100 min-w-[220px]">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-neutral-900">{q.vendor?.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5 text-neutral-450 font-semibold text-[10px]">
                              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                              <span>{q.vendor?.rating > 0 ? `${q.vendor.rating.toFixed(1)}/5.0` : '—'}</span>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium">
                    
                    {/* Grand Total Row */}
                    <tr className="hover:bg-neutral-50/20">
                      <td className="px-6 py-4 text-neutral-450 font-bold uppercase tracking-wider">Grand Total (Incl. GST)</td>
                      {report.quotations.map((q: any) => (
                        <td key={q.quotationId} className={`px-6 py-4 border-l border-neutral-100 text-sm font-bold ${
                          q.isLowestPrice ? 'text-accent-success bg-accent-successBg/40' : 'text-neutral-900'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <span>${Number(q.grandTotal).toFixed(2)}</span>
                            {q.isLowestPrice && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent-success text-white uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                <Sparkles className="w-2.5 h-2.5" />
                                Lowest
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Delivery Days Row */}
                    <tr className="hover:bg-neutral-50/20">
                      <td className="px-6 py-4 text-neutral-450 uppercase font-semibold">Delivery Timeframe</td>
                      {report.quotations.map((q: any) => (
                        <td key={q.quotationId} className={`px-6 py-4 border-l border-neutral-100 ${
                          q.isFastestDelivery ? 'text-neutral-900 bg-neutral-50/50' : 'text-neutral-500'
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>{q.deliveryDays} Days</span>
                            {q.isFastestDelivery && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-neutral-900 text-white uppercase tracking-wider">
                                Fastest
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Payment Terms Row */}
                    <tr className="hover:bg-neutral-50/20">
                      <td className="px-6 py-4 text-neutral-450 uppercase font-semibold">Payment Terms</td>
                      {report.quotations.map((q: any) => (
                        <td key={q.quotationId} className="px-6 py-4 border-l border-neutral-100 text-neutral-500">
                          {q.paymentTerms || 'Not specified'}
                        </td>
                      ))}
                    </tr>

                    {/* GST Breakdown Row */}
                    <tr className="hover:bg-neutral-50/20">
                      <td className="px-6 py-4 text-neutral-450 uppercase font-semibold">Subtotal & Taxes</td>
                      {report.quotations.map((q: any) => (
                        <td key={q.quotationId} className="px-6 py-4 border-l border-neutral-100 text-[11px] text-neutral-400 space-y-1">
                          <div>Subtotal: ${Number(q.subtotal).toFixed(2)}</div>
                          <div>GST (18.0%): ${Number(q.gstAmount).toFixed(2)}</div>
                        </td>
                      ))}
                    </tr>

                    {/* Detailed line items unit prices */}
                    <tr className="bg-neutral-50/30">
                      <td colSpan={1 + report.quotations.length} className="px-6 py-2.5 font-bold text-neutral-450 uppercase text-[10px] tracking-wider border-y border-neutral-100">
                        Line Items Unit Pricing Breakdown
                      </td>
                    </tr>

                    {report.rfq.lineItems.map((item: any, itemIdx: number) => (
                      <tr key={item.id} className="hover:bg-neutral-50/20">
                        <td className="px-6 py-3.5">
                          <div className="font-bold text-neutral-900">{item.item}</div>
                          <div className="text-[10px] text-neutral-400 mt-0.5 font-semibold">Quantity: {item.qty} {item.unit}</div>
                        </td>
                        {report.quotations.map((q: any) => {
                          const quoteItem = q.lineItems.find((li: any) => li.item === item.item);
                          return (
                            <td key={q.quotationId} className={`px-6 py-3.5 border-l border-neutral-100 ${
                              quoteItem?.isLowestUnitPrice ? 'text-accent-success bg-accent-successBg/20 font-bold' : 'text-neutral-500'
                            }`}>
                              {quoteItem ? (
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-xs text-neutral-900">${Number(quoteItem.unitPrice).toFixed(2)} / {item.unit}</div>
                                  <div className="text-[10px] text-neutral-450">Total: ${Number(quoteItem.totalVal).toFixed(2)}</div>
                                </div>
                              ) : (
                                <span className="text-neutral-400 italic">No quote</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Action buttons */}
                    <tr>
                      <td className="px-6 py-5"></td>
                      {report.quotations.map((q: any) => (
                        <td key={q.quotationId} className="px-6 py-5 border-l border-neutral-100">
                          <Button
                            size="sm"
                            className="w-full py-2 rounded-xl text-xs"
                            onClick={() => handleSelectQuote(q.quotationId)}
                          >
                            Approve Bid
                          </Button>
                        </td>
                      ))}
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-xs text-neutral-400 font-medium select-none flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent-success" />
              <span>Soft green accents indicate the cheapest available pricing. Approving a quotation automatically triggers validation logs.</span>
            </div>

          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-neutral-200/80 rounded-2xl text-neutral-400 text-xs font-medium">
            Please choose a specific RFQ from the dropdown list to initiate comparison analytics.
          </div>
        )}

      </div>
    </Layout>
  );
}

