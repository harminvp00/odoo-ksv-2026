import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { authService } from '../../services/auth.service';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setResetLink(res.data?.resetLink || '');
      setSubmitted(true);
    } catch (err: any) {
      console.error('Forgot password request failed:', err);
      setError(err.response?.data?.message || 'Failed to send recovery link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-neutral-200/80 rounded-2xl p-8 shadow-premium select-none">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">Forgot Password?</h2>
          <p className="text-sm text-neutral-500 mt-1">Enter your registered email to recover access</p>
        </div>

        {submitted ? (
          <div className="p-6 bg-accent-successBg border border-accent-success/20 rounded-xl text-neutral-900 text-sm">
            <p className="font-medium mb-3">Recovery link has been generated.</p>
            {resetLink && (
              <div className="mt-4 p-3 bg-white border border-neutral-200 rounded-lg text-xs break-all text-left">
                <span className="text-neutral-500 font-semibold block mb-1">Development Link:</span>
                <a href={resetLink} id="dev-reset-link" className="underline text-[#171717] hover:text-neutral-600 font-medium">
                  {resetLink}
                </a>
              </div>
            )}
            <div className="mt-6 text-center">
              <Link to="/login" className="text-xs font-bold uppercase text-neutral-900 hover:underline">Back to Login</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs text-center font-medium">
                {error}
              </div>
            )}
            <Input 
              label="Email Address*" 
              type="email" 
              placeholder="e.g. officer@organization.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Button type="submit" className="w-full py-2.5 mt-2" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <div className="text-center text-xs pt-1">
              <Link to="/login" className="text-neutral-500 hover:text-neutral-950 font-medium">Cancel & Return</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

