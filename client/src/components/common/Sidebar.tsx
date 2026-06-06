import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, BadgePercent, CheckSquare, FileSpreadsheet, FileClock, BarChart3 } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Vendors', path: '/vendors', icon: Users },
    { name: "RFQ's", path: '/rfqs/create', icon: FileText },
    { name: 'Quotations', path: '/quotations/compare', icon: BadgePercent },
    { name: 'Approvals', path: '/approvals', icon: CheckSquare },
    { name: 'Invoices', path: '/invoices', icon: FileSpreadsheet },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Activity', path: '/activity', icon: FileClock },
  ];

  return (
    <div className="w-64 bg-[#0e1318] border-r border-slate-800 flex flex-col h-screen select-none">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-wider text-emerald-400">VendorBridge</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-150 ${
                isActive 
                  ? 'sidebar-active text-emerald-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
