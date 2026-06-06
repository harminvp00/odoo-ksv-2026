import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { vendorService } from '../../services/vendor.service';
import { Loader2, Search, SlidersHorizontal, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function VendorsPage() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Registration modal form states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '',
    category: '',
    gstNo: '',
    contactNo: '',
    address: '',
    userId: ''
  });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regLoading, setRegLoading] = useState(false);
  const [regApiError, setRegApiError] = useState('');
  const [unlinkedUsers, setUnlinkedUsers] = useState<any[]>([]);

  const fetchUnlinkedUsers = async () => {
    try {
      const res = await vendorService.getUnlinkedUsers();
      setUnlinkedUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch unlinked users:', err);
    }
  };

  useEffect(() => {
    if (isRegisterOpen) {
      fetchUnlinkedUsers();
    }
  }, [isRegisterOpen]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (search.trim()) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter.toUpperCase();

      const res = await vendorService.getVendors(params);
      setVendors(res.data.vendors || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch vendor directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVendors();
    }, 300); // Debounce search queries
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleToggleStatus = async (vendorId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      await vendorService.updateVendorStatus(vendorId, nextStatus);
      setVendors((prev) => 
        prev.map((v) => (v.id === vendorId ? { ...v, status: nextStatus } : v))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update vendor status.');
    }
  };

  const validateRegForm = () => {
    const errs: Record<string, string> = {};
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!regForm.name.trim()) errs.name = 'Vendor name is required';
    if (!regForm.category.trim()) errs.category = 'Industry category is required';
    
    if (!regForm.gstNo) {
      errs.gstNo = 'GST number is required';
    } else if (!gstRegex.test(regForm.gstNo.toUpperCase())) {
      errs.gstNo = 'Please enter a valid 15-digit GSTIN format';
    }

    if (!regForm.contactNo.trim()) errs.contactNo = 'Contact phone/number is required';

    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegApiError('');
    if (!validateRegForm()) return;

    setRegLoading(true);
    try {
      const payload = {
        ...regForm,
        gstNo: regForm.gstNo.toUpperCase(),
        userId: regForm.userId || null
      };
      await vendorService.registerVendor(payload);
      setIsRegisterOpen(false);
      setRegForm({ name: '', category: '', gstNo: '', contactNo: '', address: '', userId: '' });
      fetchVendors();
    } catch (err: any) {
      setRegApiError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const isStaff = user?.role === 'ADMIN' || user?.role === 'PROCUREMENT_OFFICER';

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto w-full select-none font-sans">
        
        {/* Title area */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Vendors Directory</h1>
            <p className="text-xs text-neutral-500 mt-1">Manage corporate supplier profiles and compliance records</p>
          </div>
          {isStaff && (
            <Button onClick={() => setIsRegisterOpen(true)}>
              + Add Supplier
            </Button>
          )}
        </div>

        {/* Filters and Search toolbar */}
        <div className="flex flex-col sm:flex-row gap-3.5 bg-white border border-neutral-250/20 p-4 rounded-2xl shadow-sm items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name, category, or GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-950/5 focus:border-neutral-950 transition"
            />
          </div>

          <div className="flex gap-2.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Active', 'Pending', 'Blocked'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                  statusFilter === tab
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-neutral-50 text-neutral-500 border border-neutral-100 hover:text-neutral-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table/Cards container */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-200/80 rounded-2xl">
            <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
            <p className="text-xs text-neutral-500 mt-3 font-semibold">Retrieving supplier records...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white border border-neutral-200/80 rounded-2xl text-accent-danger text-sm font-medium">
            {error}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-16 bg-white border border-neutral-200/85 rounded-2xl border-dashed">
            <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-900">No Supplier Records Found</h3>
            <p className="text-xs text-neutral-500 mt-1">Try modifying your filter categories or keyword search.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto border border-neutral-200/80 rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200/80 bg-neutral-50/50">
                  <th className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider">Vendor Name</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider">Industry</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider">GSTIN</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider">Contact No.</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider text-center">Rating</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  {isStaff && <th className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-neutral-50/50 transition">
                    <td className="px-6 py-4.5 font-bold text-neutral-900">{v.name}</td>
                    <td className="px-6 py-4.5 text-neutral-500 font-medium">{v.category}</td>
                    <td className="px-6 py-4.5 font-mono text-neutral-500 tracking-wider">{v.gstNo}</td>
                    <td className="px-6 py-4.5 text-neutral-500">{v.contactNo}</td>
                    <td className="px-6 py-4.5 text-center font-bold text-neutral-800">
                      {v.rating > 0 ? `${v.rating.toFixed(1)} / 5.0` : '—'}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        v.status === 'ACTIVE' ? 'bg-accent-successBg text-accent-success border border-accent-success/20' :
                        v.status === 'BLOCKED' ? 'bg-accent-dangerBg text-accent-danger border border-accent-danger/20' :
                        'bg-neutral-100 text-neutral-600 border border-neutral-200'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    {isStaff && (
                      <td className="px-6 py-4.5 text-right">
                        <Button
                          variant={v.status === 'ACTIVE' ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleStatus(v.id, v.status)}
                        >
                          {v.status === 'ACTIVE' ? 'Block' : 'Activate'}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal form dialog to Register Supplier */}
        <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Register Supplier Profile">
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {regApiError && (
              <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs text-center font-medium">
                {regApiError}
              </div>
            )}
            
            <Input 
              label="Vendor Company Name*" 
              value={regForm.name}
              onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              error={regErrors.name}
              disabled={regLoading}
              required 
            />

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Industry Category*" 
                placeholder="e.g. IT, Furniture, Logistics" 
                value={regForm.category}
                onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
                error={regErrors.category}
                disabled={regLoading}
                required 
              />
              <Input 
                label="GSTIN Number*" 
                placeholder="15-digit GST No." 
                value={regForm.gstNo}
                onChange={(e) => setRegForm({ ...regForm, gstNo: e.target.value })}
                error={regErrors.gstNo}
                disabled={regLoading}
                required 
              />
            </div>

            <Input 
              label="Contact Details / Number*" 
              value={regForm.contactNo}
              onChange={(e) => setRegForm({ ...regForm, contactNo: e.target.value })}
              error={regErrors.contactNo}
              disabled={regLoading}
              required 
            />

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Corporate Address</label>
              <textarea 
                placeholder="Street address, city, ZIP code..." 
                value={regForm.address}
                onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                disabled={regLoading}
                className="h-20 input resize-none"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Associated User Account</label>
              <select
                value={regForm.userId || ''}
                onChange={(e) => setRegForm({ ...regForm, userId: e.target.value })}
                disabled={regLoading}
                className="input cursor-pointer"
              >
                <option value="">None (Unassociated)</option>
                {unlinkedUsers.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2.5 pt-4 border-t border-neutral-100">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsRegisterOpen(false)} disabled={regLoading}>
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={regLoading}>
                {regLoading ? 'Registering...' : 'Register Profile'}
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </Layout>
  );
}

