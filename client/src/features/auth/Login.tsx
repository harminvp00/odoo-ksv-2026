import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const validate = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setApiError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email address is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      const msg = err.response?.data?.message || 
                  err.response?.data?.errors?.[0]?.message || 
                  'Authentication failed. Please check credentials.';
      setApiError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-neutral-200/80 rounded-2xl p-8 shadow-premium select-none">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-neutral-950 text-white mx-auto mb-4 flex items-center justify-center font-bold text-lg shadow-sm">
            VB
          </div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">Sign in to VendorBridge</h2>
          <p className="text-sm text-neutral-500 mt-1">Enter your details to access the procurement portal</p>
        </div>

        {apiError && (
          <div className="mb-5 p-3.5 bg-accent-dangerBg border border-accent-danger/20 text-accent-danger text-xs font-medium rounded-xl animate-fade-in">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="e.g. officer@organization.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            disabled={loading}
            required
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            disabled={loading}
            required
          />

          <div className="flex justify-end text-xs pt-1">
            <Link to="/forgot-password" className="text-neutral-500 hover:text-neutral-900 transition font-medium">Forgot password?</Link>
          </div>

          <Button type="submit" className="w-full py-2.5 mt-2" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-100 text-center text-xs text-neutral-500">
          New to the portal? <Link to="/register" className="text-neutral-950 hover:underline font-semibold ml-1">Create an Account</Link>
        </div>
      </div>
    </div>
  );
}

