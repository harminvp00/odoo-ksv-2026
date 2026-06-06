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
      setError('Invalid or expired reset link. Please request a new link.');
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
    <div className="min-h-screen flex items-center justify-center bg-white p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-neutral-200/80 rounded-2xl p-8 shadow-premium select-none">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">Reset Password</h2>
          <p className="text-sm text-neutral-500 mt-1">Enter your new secure password</p>
        </div>

        {submitted ? (
          <div className="p-6 bg-accent-successBg border border-accent-success/20 rounded-xl text-neutral-900 text-sm">
            <p className="font-medium mb-3">Password reset successful!</p>
            <p className="text-xs text-neutral-550 mb-4">You can now sign in with your new credentials.</p>
            <div className="text-center">
              <Link to="/login" className="text-xs font-bold uppercase text-neutral-900 hover:underline">Go to Login</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isLinkInvalid && (
              <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs text-center font-medium">
                Invalid or incomplete link. Please request a new password reset link.
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs text-center font-medium">
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

            <Button type="submit" className="w-full py-2.5 mt-2" disabled={loading || isLinkInvalid}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
            
            <div className="text-center text-xs pt-1">
              <Link to="/login" className="text-neutral-500 hover:text-neutral-950 font-medium">Return to Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

