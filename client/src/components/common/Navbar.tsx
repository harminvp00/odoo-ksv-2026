import React from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0e1318] px-8 flex items-center justify-between">
      <div>
        <h2 className="text-slate-400 text-sm font-medium">Workspace Overview</h2>
      </div>
      <div className="flex items-center space-x-6">
        <button className="relative p-2 text-slate-400 hover:text-slate-100 transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-semibold text-sm">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 transition" title="Log Out">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
