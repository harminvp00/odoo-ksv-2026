import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PROCUREMENT_OFFICER');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070a0e] p-4">
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 mx-auto mb-4 flex items-center justify-center text-emerald-400 font-bold text-xl">
            VB
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Login to VendorBridge</h2>
          <p className="text-sm text-slate-500 mt-1.5">Enter details to access procurement workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Email Address*" 
            type="email" 
            placeholder="e.g. officer@organization.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Password*" 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Select Mock Role</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-[#0e1318] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            >
              <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
              <option value="VENDOR">Vendor</option>
              <option value="MANAGER">Manager / Approver</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex justify-between items-center text-xs">
            <Link to="/forgot-password" className="text-emerald-400 hover:text-emerald-300 font-medium">Forgot password?</Link>
          </div>

          <Button type="submit" className="w-full py-3">Login Button</Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
          New to the portal? <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium ml-1">Create an Account</Link>
        </div>
      </div>
    </div>
  );
}
