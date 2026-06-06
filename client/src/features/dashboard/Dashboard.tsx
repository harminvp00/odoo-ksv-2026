import React from 'react';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import { FileText, ClipboardCheck, Banknote, ShieldAlert, FileClock } from 'lucide-react';

export default function Dashboard() {
  const metrics = [
    { label: 'Active RFQs', val: '12', color: 'border-emerald-500/20 text-emerald-400', icon: FileText },
    { label: 'Pending Approvals', val: '5', color: 'border-amber-500/20 text-amber-400', icon: ClipboardCheck },
    { label: "PO's this month", val: '$ 2.3L', color: 'border-indigo-500/20 text-indigo-400', icon: Banknote },
    { label: 'Overdue Invoices', val: '3', color: 'border-rose-500/20 text-rose-400', icon: ShieldAlert },
  ];

  const recentOrders = [
    { po: 'Po1', vendor: 'Infra', amount: '87000', status: 'Approved' },
    { po: 'Po2', vendor: 'Tech core', amount: '140000', status: 'Pending' },
    { po: 'Po3', vendor: 'OfficeNeed Co', amount: '34900', status: 'Draft' },
  ];

  return (
    <div className="flex h-screen bg-[#070a0e] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Navbar />
        
        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Welcome back, Procurement Officer - Today's Overview</p>
          </div>

          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {metrics.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className={`p-6 bg-slate-900 border rounded-xl flex items-center justify-between shadow-lg ${m.color.split(' ')[0]}`}>
                  <div>
                    <span className="text-2xl font-bold block">{m.val}</span>
                    <span className="text-xs text-slate-500 mt-1.5 block">{m.label}</span>
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-lg">
                    <Icon className={`w-6 h-6 ${m.color.split(' ')[1]}`} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Purchase Orders */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="font-semibold text-slate-200 mb-4">Recent Purchase Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-350">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                      <th className="pb-3">PO#</th>
                      <th className="pb-3">Vendor</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {recentOrders.map((o, i) => (
                      <tr key={i} className="hover:bg-slate-800/20">
                        <td className="py-3 font-medium text-emerald-400">{o.po}</td>
                        <td className="py-3">{o.vendor}</td>
                        <td className="py-3">₹{o.amount}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            o.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                            o.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fast Quick Actions Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-slate-200 mb-2">Workspace Actions</h3>
                <p className="text-xs text-slate-500 mb-6">Initiate tasks quickly</p>
              </div>
              <div className="space-y-3">
                <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-500/15">
                  + Create New RFQ
                </button>
                <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition">
                  Register Vendor
                </button>
                <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition">
                  View Invoices
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
