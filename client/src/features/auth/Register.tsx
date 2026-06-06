import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { authService } from '../../services/auth.service';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'PROCUREMENT_OFFICER',
    country: '',
    additionalInfo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.register(formData);
      alert('Registration Complete. Please Login.');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 
                  err.response?.data?.errors?.[0]?.message || 
                  'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070a0e] p-6">
      <div className="w-full max-w-2xl bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Create User Account</h2>
          <p className="text-sm text-slate-500 mt-1.5">Join VendorBridge ERP Workspace</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input 
              label="First Name*" 
              placeholder="First name"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              required
            />
            <Input 
              label="Last Name*" 
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input 
              label="Email Address*" 
              type="email" 
              placeholder="e.g. user@organization.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            <Input 
              label="Password*" 
              type="password" 
              placeholder="•••••••• (min 6 chars)"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input 
              label="Phone number" 
              placeholder="Mobile/Office phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <Input 
              label="Country" 
              placeholder="Country base"
              value={formData.country}
              onChange={(e) => setFormData({...formData, country: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Role Selection*</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="bg-[#0e1318] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              >
                <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
                <option value="VENDOR">Vendor Profile</option>
                <option value="MANAGER">Manager / Approver</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Additional Information</label>
            <textarea 
              placeholder="Provide comments, certifications, or details..."
              value={formData.additionalInfo}
              onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
              className="h-28 bg-[#0e1318] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition resize-none"
            />
          </div>

          <Button type="submit" className="w-full py-3" disabled={loading}>
            {loading ? 'Submitting Registration...' : 'Submit Registration'}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account? <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium ml-1">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
