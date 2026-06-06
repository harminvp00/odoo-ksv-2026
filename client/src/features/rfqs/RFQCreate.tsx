import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { rfqService } from '../../services/rfq.service';
import { vendorService } from '../../services/vendor.service';
import { Trash2, Plus, ArrowLeft, ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function RFQCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Step 1: Basic Details
  const [details, setDetails] = useState({
    title: '',
    category: '',
    deadline: '',
    description: ''
  });
  const [detailsErrors, setDetailsErrors] = useState<Record<string, string>>({});

  // Step 2: Line Items
  const [lineItems, setLineItems] = useState<any[]>([
    { item: '', qty: 1, unit: 'NOS' }
  ]);
  const [lineItemsError, setLineItemsError] = useState('');

  // Step 3: Vendors Directory & Selection
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState('');

  useEffect(() => {
    const fetchActiveVendors = async () => {
      try {
        setVendorsLoading(true);
        const res = await vendorService.getVendors({ status: 'ACTIVE' });
        setVendors(res.data.vendors || []);
      } catch (err) {
        console.error('Failed to load vendors list:', err);
        setVendorsError('Failed to load active vendors directory.');
      } finally {
        setVendorsLoading(false);
      }
    };
    if (step === 3) {
      fetchActiveVendors();
    }
  }, [step]);

  const handleNextStep1 = () => {
    const errs: Record<string, string> = {};
    if (!details.title.trim()) errs.title = 'Title is required';
    if (!details.category.trim()) errs.category = 'Industry category is required';
    if (!details.deadline) {
      errs.deadline = 'Submission deadline is required';
    } else {
      const selectedDate = new Date(details.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errs.deadline = 'Deadline cannot be in the past';
      }
    }

    setDetailsErrors(errs);
    if (Object.keys(errs).length === 0) {
      setStep(2);
    }
  };

  const handleNextStep2 = () => {
    setLineItemsError('');
    const invalidItems = lineItems.some(
      (li) => !li.item.trim() || !li.unit.trim() || Number(li.qty) <= 0
    );

    if (lineItems.length === 0) {
      setLineItemsError('Please add at least one line item to this RFQ');
      return;
    }

    if (invalidItems) {
      setLineItemsError('All items must have a valid name, quantity (> 0), and unit.');
      return;
    }

    setStep(3);
  };

  const handleAddLine = () => {
    setLineItems([...lineItems, { item: '', qty: 1, unit: 'NOS' }]);
  };

  const handleRemoveLine = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: string, val: any) => {
    const updated = lineItems.map((li, i) => {
      if (i === idx) {
        return { ...li, [field]: val };
      }
      return li;
    });
    setLineItems(updated);
  };

  const handleToggleVendor = (vendorId: string) => {
    if (selectedVendorIds.includes(vendorId)) {
      setSelectedVendorIds(selectedVendorIds.filter((id) => id !== vendorId));
    } else {
      setSelectedVendorIds([...selectedVendorIds, vendorId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedVendorIds.length === 0) {
      setSubmitError('Please assign at least one supplier vendor to receive this RFQ');
      return;
    }

    setLoading(true);
    setSubmitError('');
    try {
      const payload = {
        title: details.title,
        category: details.category,
        deadline: new Date(details.deadline).toISOString(),
        description: details.description,
        attachments: [],
        lineItems: lineItems.map((li) => ({
          item: li.item,
          qty: Number(li.qty),
          unit: li.unit
        })),
        assignedVendorIds: selectedVendorIds
      };

      await rfqService.createRFQ(payload);
      alert('RFQ created successfully and sent to the assigned suppliers!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to create and dispatch RFQ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto w-full select-none font-sans">
        
        {/* Header Title */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Initiate RFQ</h1>
          <p className="text-xs text-neutral-500 mt-1">Create a Request for Quotation (RFQ) and dispatch it to active vendors</p>
        </div>

        {/* Multi-step wizard indicator */}
        <div className="bg-white border border-neutral-200/80 p-5 rounded-2xl flex items-center justify-center space-x-6 shadow-sm select-none">
          <div className="flex items-center gap-2">
            <span className={`w-6.5 h-6.5 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 1 ? 'bg-neutral-900 text-white shadow-sm' : 'bg-neutral-100 text-neutral-450'
            }`}>
              1
            </span>
            <span className={`text-xs font-semibold ${step === 1 ? 'text-neutral-900' : 'text-neutral-400'}`}>Basic Details</span>
          </div>
          <div className="h-[1px] bg-neutral-200 w-12"></div>
          
          <div className="flex items-center gap-2">
            <span className={`w-6.5 h-6.5 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 2 ? 'bg-neutral-900 text-white shadow-sm' : 'bg-neutral-100 text-neutral-450'
            }`}>
              2
            </span>
            <span className={`text-xs font-semibold ${step === 2 ? 'text-neutral-900' : 'text-neutral-400'}`}>Line Items</span>
          </div>
          <div className="h-[1px] bg-neutral-200 w-12"></div>
          
          <div className="flex items-center gap-2">
            <span className={`w-6.5 h-6.5 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 3 ? 'bg-neutral-900 text-white shadow-sm' : 'bg-neutral-100 text-neutral-450'
            }`}>
              3
            </span>
            <span className={`text-xs font-semibold ${step === 3 ? 'text-neutral-900' : 'text-neutral-400'}`}>Assign Vendors</span>
          </div>
        </div>

        {/* Wizard step views */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
          
          {/* STEP 1: Basic details */}
          {step === 1 && (
            <div className="space-y-4">
              <Input
                label="RFQ Title*"
                placeholder="e.g. Office Ergonomic Chairs Procurement"
                value={details.title}
                onChange={(e) => setDetails({ ...details, title: e.target.value })}
                error={detailsErrors.title}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Category*"
                  placeholder="e.g. Furniture, IT, Logistics"
                  value={details.category}
                  onChange={(e) => setDetails({ ...details, category: e.target.value })}
                  error={detailsErrors.category}
                />
                <Input
                  label="Submission Deadline*"
                  type="date"
                  value={details.deadline}
                  onChange={(e) => setDetails({ ...details, deadline: e.target.value })}
                  error={detailsErrors.deadline}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500 font-semibold">Scope of Work / Description</label>
                <textarea
                  placeholder="Provide detailed description, compliance specifications, and requirements..."
                  value={details.description}
                  onChange={(e) => setDetails({ ...details, description: e.target.value })}
                  className="h-28 input resize-none"
                />
              </div>
              
              <div className="flex justify-end pt-4 border-t border-neutral-100">
                <Button onClick={handleNextStep1} className="gap-2">
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Line items table */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-neutral-900">RFQ Line Items</h3>
                <Button variant="secondary" size="sm" onClick={handleAddLine} className="gap-1 px-3.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </Button>
              </div>

              {lineItemsError && (
                <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{lineItemsError}</span>
                </div>
              )}

              <div className="overflow-x-auto border border-neutral-200/80 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200/80 bg-neutral-50/50">
                      <th className="px-4 py-3 font-semibold text-neutral-500 uppercase tracking-wider">Item Name / Description*</th>
                      <th className="px-4 py-3 font-semibold text-neutral-500 uppercase tracking-wider w-[120px]">Quantity*</th>
                      <th className="px-4 py-3 font-semibold text-neutral-500 uppercase tracking-wider w-[120px]">Unit*</th>
                      <th className="px-4 py-3 w-[60px] text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {lineItems.map((li, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/30">
                        <td className="px-3 py-3">
                          <input
                            type="text"
                            placeholder="e.g. Ergonomic Office Chair (Mesh Back)"
                            value={li.item}
                            onChange={(e) => handleLineChange(idx, 'item', e.target.value)}
                            className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 transition bg-neutral-50/20 focus:bg-white"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="1"
                            value={li.qty}
                            onChange={(e) => handleLineChange(idx, 'qty', e.target.value)}
                            className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 transition bg-neutral-50/20 focus:bg-white"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={li.unit}
                            onChange={(e) => handleLineChange(idx, 'unit', e.target.value)}
                            className="w-full px-2 py-1.5 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 transition bg-neutral-50/20 focus:bg-white cursor-pointer"
                          >
                            <option value="NOS">NOS (Numbers)</option>
                            <option value="KG">KG (Kilograms)</option>
                            <option value="LTRS">LTRS (Litres)</option>
                            <option value="BOX">BOX (Boxes)</option>
                            <option value="MTR">MTR (Metres)</option>
                            <option value="CONTRACT">CONTRACT (Service)</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {lineItems.length > 1 && (
                            <button
                              onClick={() => handleRemoveLine(idx)}
                              className="p-1.5 hover:bg-rose-50 text-neutral-400 hover:text-accent-danger rounded-lg transition"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between pt-4 border-t border-neutral-100">
                <Button variant="secondary" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <Button onClick={handleNextStep2} className="gap-2">
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Assign vendors */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900">Assign Suppliers</h3>
              <p className="text-xs text-neutral-500 mb-2">Select which active vendors in the workspace will receive invitation alerts to quote.</p>

              {submitError && (
                <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs font-semibold animate-fade-in">
                  {submitError}
                </div>
              )}

              {vendorsLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="w-6 h-6 text-neutral-900 animate-spin" />
                </div>
              ) : vendorsError ? (
                <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs text-center font-medium">
                  {vendorsError}
                </div>
              ) : vendors.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-neutral-200 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500 font-semibold">No active vendors registered in the directory.</p>
                  <p className="text-[10px] text-neutral-400 mt-1">Please register suppliers on the Vendors Directory screen first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {vendors.map((vendor) => {
                    const isSelected = selectedVendorIds.includes(vendor.id);
                    return (
                      <div
                        key={vendor.id}
                        onClick={() => handleToggleVendor(vendor.id)}
                        className={`p-3.5 border rounded-xl flex items-center justify-between cursor-pointer transition select-none ${
                          isSelected
                            ? 'border-neutral-950 bg-neutral-50/50'
                            : 'border-neutral-200 hover:border-neutral-450 hover:bg-neutral-50/20'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-neutral-900">{vendor.name}</p>
                          <p className="text-[10px] text-neutral-400 font-medium capitalize mt-0.5">
                            {vendor.category} — rating: {vendor.rating > 0 ? `${vendor.rating.toFixed(1)}/5` : 'N/A'}
                          </p>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isSelected ? 'bg-neutral-950 border-neutral-950 text-white' : 'border-neutral-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-neutral-100">
                <Button variant="secondary" onClick={() => setStep(2)} className="gap-2" disabled={loading}>
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <Button onClick={handleSubmit} className="gap-2" disabled={loading || vendors.length === 0}>
                  {loading ? 'Dispatched RFQ...' : 'Dispatch RFQ'}
                </Button>
              </div>
            </div>
          )}

        </div>

      </div>
    </Layout>
  );
}

