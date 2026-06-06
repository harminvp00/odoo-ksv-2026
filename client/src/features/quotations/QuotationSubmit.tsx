import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { rfqService } from '../../services/rfq.service';
import { quotationService } from '../../services/quotation.service';
import { Loader2, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function QuotationSubmit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rfqIdFromUrl = searchParams.get('rfqId');
  
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [selectedRfqId, setSelectedRfqId] = useState('');
  const [rfqDetails, setRfqDetails] = useState<any>(null);
  
  const [loadingRFQs, setLoadingRFQs] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [rfqsError, setRfqsError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form states
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [deliveryDays, setDeliveryDays] = useState<number>(7);
  const [paymentTerms, setPaymentTerms] = useState('Net 30 days');
  
  // Validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchAssignedRFQs = async () => {
      try {
        setLoadingRFQs(true);
        const res = await rfqService.getRFQs();
        const list = res.data || [];
        setRfqs(list);
        
        if (rfqIdFromUrl && list.some((r: any) => r.id === rfqIdFromUrl)) {
          handleRfqSelect(rfqIdFromUrl);
        }
      } catch (err) {
        console.error('Failed to load RFQs:', err);
        setRfqsError('Failed to load your assigned RFQs.');
      } finally {
        setLoadingRFQs(false);
      }
    };
    if (user?.role === 'VENDOR') {
      fetchAssignedRFQs();
    }
  }, [user, rfqIdFromUrl]);

  const handleRfqSelect = async (rfqId: string) => {
    setSelectedRfqId(rfqId);
    setRfqDetails(null);
    setLineItems([]);
    setSubmitError('');
    setFormErrors({});

    if (!rfqId) return;

    try {
      setLoadingDetails(true);
      const res = await rfqService.getRFQDetails(rfqId);
      setRfqDetails(res.data);
      // Map RFQ line items to quotation format with default unit price of 0
      const items = (res.data.lineItems || []).map((li: any) => ({
        item: li.item,
        qty: li.qty,
        unit: li.unit,
        unitPrice: ''
      }));
      setLineItems(items);
    } catch (err) {
      console.error('Failed to load RFQ details:', err);
      setSubmitError('Failed to retrieve details for the selected RFQ.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePriceChange = (idx: number, priceStr: string) => {
    const updated = lineItems.map((li, i) => {
      if (i === idx) {
        return { ...li, unitPrice: priceStr };
      }
      return li;
    });
    setLineItems(updated);
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => {
    const price = Number(item.unitPrice) || 0;
    return sum + (price * item.qty);
  }, 0);
  const gstPercentage = 18.0;
  const gstAmount = subtotal * (gstPercentage / 100);
  const grandTotal = subtotal + gstAmount;

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!selectedRfqId) errors.rfq = 'Please select an RFQ';
    if (!deliveryDays || Number(deliveryDays) <= 0) errors.deliveryDays = 'Delivery days must be greater than 0';
    if (!paymentTerms.trim()) errors.paymentTerms = 'Payment terms are required';

    const hasInvalidPrices = lineItems.some(item => !item.unitPrice || Number(item.unitPrice) <= 0);
    if (hasInvalidPrices) {
      errors.lineItems = 'Please enter a valid price (> 0) for all line items';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitQuotation = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        rfqId: selectedRfqId,
        deliveryDays: Number(deliveryDays),
        paymentTerms,
        status,
        lineItems: lineItems.map(item => ({
          item: item.item,
          qty: item.qty,
          unit: item.unit,
          unitPrice: Number(item.unitPrice)
        }))
      };

      await quotationService.submitQuotation(payload);
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to submit quotation details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== 'VENDOR') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center font-sans">
          <AlertCircle className="w-10 h-10 text-neutral-400 mb-4" />
          <h3 className="text-sm font-bold text-neutral-900">Access Restricted</h3>
          <p className="text-xs text-neutral-500 mt-1">Only registered suppliers with a VENDOR profile can submit quotations.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto w-full select-none font-sans">
        
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Submit Bid Quotation</h1>
          <p className="text-xs text-neutral-500 mt-1">Respond to an active RFQ with pricing and delivery terms</p>
        </div>

        {submitSuccess ? (
          <div className="p-8 bg-white border border-neutral-200/80 rounded-2xl text-center space-y-4 shadow-sm animate-fade-in">
            <CheckCircle className="w-10 h-10 text-accent-success mx-auto" />
            <h3 className="text-sm font-bold text-neutral-900">Quotation Submitted Successfully</h3>
            <p className="text-xs text-neutral-500">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form details input */}
            <div className="lg:col-span-2 space-y-5">
              
              {/* RFQ Select container */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col space-y-1.5 w-full">
                  <label className="text-xs font-semibold text-neutral-500">Choose assigned RFQ*</label>
                  {loadingRFQs ? (
                    <div className="flex items-center gap-2 text-xs text-neutral-400 p-2">
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
                      <span>Loading assigned RFQs...</span>
                    </div>
                  ) : rfqsError ? (
                    <div className="text-xs text-accent-danger font-medium">{rfqsError}</div>
                  ) : rfqs.length === 0 ? (
                    <p className="text-xs text-neutral-500 font-semibold p-2">No active RFQs assigned to your company profile.</p>
                  ) : (
                    <select
                      value={selectedRfqId}
                      onChange={(e) => handleRfqSelect(e.target.value)}
                      className="input cursor-pointer"
                    >
                      <option value="">-- Select RFQ --</option>
                      {rfqs.map(rfq => (
                        <option key={rfq.id} value={rfq.id}>{rfq.title} ({rfq.category})</option>
                      ))}
                    </select>
                  )}
                  {formErrors.rfq && <span className="text-xs text-accent-danger">{formErrors.rfq}</span>}
                </div>

                {/* Selected RFQ details preview */}
                {rfqDetails && (
                  <div className="mt-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200/60 text-xs text-neutral-600 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-neutral-900 text-sm">{rfqDetails.title}</span>
                      <span className="badge-neutral lowercase first-letter:uppercase">{rfqDetails.category}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-neutral-500">{rfqDetails.description || 'No description provided.'}</p>
                    <div className="pt-2 border-t border-neutral-200 flex justify-between font-semibold">
                      <span>Deadline: {new Date(rfqDetails.deadline).toLocaleDateString()}</span>
                      <span className="text-neutral-500">Requested by: {rfqDetails.createdBy?.firstName || 'Procurement Agent'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Items prices form */}
              {selectedRfqId && rfqDetails && (
                <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-900">Unit Price Bidding</h3>
                  
                  {formErrors.lineItems && (
                    <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs font-semibold">
                      {formErrors.lineItems}
                    </div>
                  )}

                  <div className="overflow-x-auto border border-neutral-200/80 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-200/80 bg-neutral-50/50">
                          <th className="px-4 py-3 font-semibold text-neutral-500">Requested Item</th>
                          <th className="px-4 py-3 font-semibold text-neutral-500 w-[100px]">Qty</th>
                          <th className="px-4 py-3 font-semibold text-neutral-500 w-[140px]">Unit Bid Price ($)*</th>
                          <th className="px-4 py-3 font-semibold text-neutral-500 w-[120px] text-right">Total Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {lineItems.map((li, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/20">
                            <td className="px-4 py-3 font-medium text-neutral-900">{li.item}</td>
                            <td className="px-4 py-3 text-neutral-500 font-semibold">{li.qty} {li.unit}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={li.unitPrice}
                                onChange={(e) => handlePriceChange(idx, e.target.value)}
                                className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-950 transition bg-neutral-50/20 focus:bg-white"
                              />
                            </td>
                            <td className="px-4 py-3 font-bold text-neutral-800 text-right">
                              ${((Number(li.unitPrice) || 0) * li.qty).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Total pricing terms sidebar */}
            {selectedRfqId && rfqDetails && (
              <div className="space-y-5">
                <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-950">Terms & Total Value</h3>

                  {submitError && (
                    <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs font-semibold">
                      {submitError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <Input
                      label="Delivery Days*"
                      type="number"
                      min="1"
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(Number(e.target.value))}
                      error={formErrors.deliveryDays}
                    />
                    <Input
                      label="Payment Terms (e.g. Net 30)*"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      error={formErrors.paymentTerms}
                    />
                  </div>

                  <div className="pt-4 border-t border-neutral-100 space-y-2.5 text-xs text-neutral-500">
                    <div className="flex justify-between items-center">
                      <span>Bid Subtotal</span>
                      <span className="text-neutral-900 font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>GST amount (18.0%)</span>
                      <span className="text-neutral-900 font-semibold">${gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="pt-2.5 border-t border-neutral-150 flex justify-between items-center text-sm font-bold text-neutral-950">
                      <span>Grand Total</span>
                      <span className="text-neutral-950 font-bold">${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-neutral-100">
                    <Button
                      onClick={() => handleSubmitQuotation('SUBMITTED')}
                      disabled={submitting}
                      className="w-full py-2.5"
                    >
                      {submitting ? 'Submitting...' : 'Submit Quotation'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleSubmitQuotation('DRAFT')}
                      disabled={submitting}
                      className="w-full py-2.5"
                    >
                      {submitting ? 'Saving...' : 'Save as Draft'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </Layout>
  );
}

