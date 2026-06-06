import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { authService } from '../../services/auth.service';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token || !email) {
      setError('Invalid or expired reset token link. Please request a new one.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        email,
        token,
        password
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const isLinkInvalid = !token || !email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070a0e] p-4">
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Reset Password</h2>
          <p className="text-sm text-slate-500 mt-1.5">Enter your new secure password</p>
        </div>

        {submitted ? (
          <div className="text-center p-6 bg-emerald-950/20 border border-emerald-800/35 rounded-xl text-emerald-400 text-sm">
            Password reset successful! You can now log in with your new password.
            <div className="mt-6">
              <Link to="/login" className="text-xs font-semibold uppercase text-emerald-400 hover:underline">Go to Login</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {isLinkInvalid && (
              <div className="p-3 bg-rose-950/20 border border-rose-800/35 rounded-xl text-rose-400 text-xs text-center">
                Invalid or incomplete reset link. Please request a new link from the forgot password page.
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-rose-950/20 border border-rose-800/35 rounded-xl text-rose-400 text-xs text-center">
                {error}
              </div>
            )}

            <Input 
              label="New Password*" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || isLinkInvalid}
            />

            <Input 
              label="Confirm New Password*" 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading || isLinkInvalid}
            />

            <Button type="submit" className="w-full py-3" disabled={loading || isLinkInvalid}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
            
            <div className="text-center text-xs">
              <Link to="/login" className="text-slate-400 hover:text-slate-200">Return to Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
