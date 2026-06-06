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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.register(formData);
      alert('Registration successful! Please sign in with your new credentials.');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 
                  err.response?.data?.errors?.[0]?.message || 
                  'Registration failed. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 font-sans">
      <div className="w-full max-w-2xl bg-white border border-neutral-200/80 rounded-2xl p-8 shadow-premium select-none">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">Create Workspace Account</h2>
          <p className="text-sm text-neutral-500 mt-1">Join the VendorBridge ERP procurement workspace</p>
        </div>

        {apiError && (
          <div className="mb-6 p-3.5 bg-accent-dangerBg border border-accent-danger/20 text-accent-danger text-xs font-medium rounded-xl animate-fade-in">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input 
              label="First Name*" 
              placeholder="First name"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              error={errors.firstName}
              disabled={loading}
              required
            />
            <Input 
              label="Last Name*" 
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              error={errors.lastName}
              disabled={loading}
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
              error={errors.email}
              disabled={loading}
              required
            />
            <Input 
              label="Password*" 
              type="password" 
              placeholder="•••••••• (min 6 chars)"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              error={errors.password}
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input 
              label="Phone Number" 
              placeholder="Mobile/Office phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              disabled={loading}
            />
            <Input 
              label="Country" 
              placeholder="Country base"
              value={formData.country}
              onChange={(e) => setFormData({...formData, country: e.target.value})}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col space-y-1.5 w-full">
              <label className="text-xs font-semibold text-neutral-500">Role Selection*</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                disabled={loading}
                className="input cursor-pointer"
              >
                <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
                <option value="VENDOR">Vendor Profile</option>
                <option value="MANAGER">Manager / Approver</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500">Additional Information</label>
            <textarea 
              placeholder="Provide comments, certifications, or details..."
              value={formData.additionalInfo}
              onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
              disabled={loading}
              className="h-28 input resize-none"
            />
          </div>

          <Button type="submit" className="w-full py-2.5 mt-2" disabled={loading}>
            {loading ? 'Submitting Registration...' : 'Register Account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-neutral-500">
          Already have an account? <Link to="/login" className="text-neutral-950 font-bold hover:underline ml-1">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

