import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070a0e] p-4">
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Forgot Password?</h2>
          <p className="text-sm text-slate-500 mt-1.5">Enter email to recover access</p>
        </div>

        {submitted ? (
          <div className="text-center p-6 bg-emerald-950/20 border border-emerald-800/35 rounded-xl text-emerald-400 text-sm">
            Recovery link sent to your registered email ID. Check inbox.
            <div className="mt-6">
              <Link to="/login" className="text-xs font-semibold uppercase text-emerald-400 hover:underline">Back to Login</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input 
              label="Email Address*" 
              type="email" 
              placeholder="e.g. officer@organization.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full py-3">Send Reset Code</Button>
            <div className="text-center text-xs">
              <Link to="/login" className="text-slate-400 hover:text-slate-200">Cancel & Return</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
