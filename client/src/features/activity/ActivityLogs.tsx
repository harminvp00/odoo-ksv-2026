import React, { useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import { CheckCircle2, Clock, FileText, UserPlus } from 'lucide-react';

export default function ActivityLogs() {
  const [filter, setFilter] = useState('All');

  const logs = [
    { desc: 'Quotation selected - Infra supplies pvt ltd selected for office furniture Q2', date: '23 may 2025, 9:15 PM', type: 'success', icon: CheckCircle2 },
    { desc: 'Approval pending - PO-2024 awaiting L2 approval by priya shah', date: '22 may 2025, 09:15 AM', type: 'pending', icon: Clock },
    { desc: 'RFQ published - office furniture Q2 sent to 3 vendors', date: '19 may 2025', type: 'info', icon: FileText },
    { desc: 'Vendor added - FastLog transport registered and pending verifications', date: '18 may, 2025 , 3:20 PM', type: 'vendor', icon: UserPlus },
  ];

  return (
    <div className="flex h-screen bg-[#070a0e] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Navbar />

        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Activity & Logs</h1>
            <p className="text-sm text-slate-400 mt-1">Procurement audit trail</p>
          </div>

          {/* Audit categories tabs */}
          <div className="flex space-x-2 border-b border-slate-800 pb-px">
            {['All', 'RFQ', 'Approvals', 'Invoices', 'Vendors'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 text-sm transition ${
                  filter === tab ? 'border-b-2 border-emerald-500 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Audit lists layout */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            {logs.map((log, i) => {
              const Icon = log.icon;
              return (
                <div key={i} className="flex items-start space-x-4 border-b border-slate-855 pb-5 last:border-b-0 last:pb-0">
                  <div className={`p-2 rounded-lg border ${
                    log.type === 'success' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
                    log.type === 'pending' ? 'bg-amber-950/20 border-amber-500/20 text-amber-400' :
                    log.type === 'vendor' ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-400' :
                    'bg-slate-800 border-slate-700 text-slate-350'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-200 font-medium">{log.desc}</p>
                    <p className="text-xs text-slate-500">{log.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
