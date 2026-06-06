import React from 'react';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';

export default function ReportsAnalytics() {
  const cards = [
    { title: 'total spend', val: '12.4 L', color: 'text-indigo-400' },
    { title: 'Active vendors', val: '28', color: 'text-emerald-400' },
    { title: 'PO Fulfillment', val: '94%', color: 'text-amber-400' },
    { title: 'overdue invoices', val: '3', color: 'text-rose-400' },
  ];

  const spendByCategory = [
    { label: 'IT Hardware', amount: '4.8L', barWidth: 'w-[80%]', color: 'bg-indigo-500' },
    { label: 'Furniture', amount: '3.2L', barWidth: 'w-[55%]', color: 'bg-emerald-500' },
    { label: 'Stationery', amount: '2.1L', barWidth: 'w-[35%]', color: 'bg-amber-500' },
    { label: 'Logistics', amount: '2.3L', barWidth: 'w-[40%]', color: 'bg-rose-500' },
  ];

  const vendorsSpend = [
    { name: 'TechCore Ltd', spend: '4,20,000', pos: 6 },
    { name: 'Infra Supplies', spend: '2,10,000', pos: 4 },
    { name: 'FastLog', spend: '1,90,000', pos: 3 },
  ];

  return (
    <div className="flex h-screen bg-[#070a0e] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Navbar />

        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Reports & analytics</h1>
              <p className="text-sm text-slate-400 mt-1">Procurement Insights - may 2025</p>
            </div>
            <div className="flex space-x-3">
              <select className="bg-[#0e1318] border border-slate-800 rounded-lg px-4 py-2 text-xs font-semibold text-slate-200">
                <option>May 2025</option>
                <option>April 2025</option>
              </select>
              <Button size="sm" variant="secondary">Export</Button>
            </div>
          </div>

          {/* Cards KPI statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {cards.map((c, idx) => (
              <div key={idx} className="p-6 bg-slate-900 border border-slate-855 rounded-xl shadow-lg">
                <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">{c.title}</span>
                <span className={`text-3xl font-extrabold block mt-2.5 ${c.color}`}>{c.val}</span>
              </div>
            ))}
          </div>

          {/* Charts section mockup */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Spend by category */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <h3 className="font-semibold text-slate-200 text-sm tracking-wide">SPEND BY CATEGORY</h3>
              <div className="space-y-4">
                {spendByCategory.map((c, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-slate-355">
                      <span>{c.label}</span>
                      <span className="font-semibold text-slate-200">₹{c.amount}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${c.barWidth} ${c.color} rounded-full`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendor ranking */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-semibold text-slate-200 text-sm tracking-wide mb-4">VENDORS BY SPEND</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400 font-semibold uppercase">
                    <thead>
                      <tr className="border-b border-slate-800 pb-2 block flex justify-between">
                        <th className="w-1/2">Vendor</th>
                        <th className="w-1/4">Spend (₹)</th>
                        <th className="w-1/4">POs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-855 block mt-2">
                      {vendorsSpend.map((v, i) => (
                        <tr key={i} className="flex justify-between text-sm py-2 hover:bg-slate-800/10 font-normal normal-case">
                          <td className="w-1/2 text-slate-200">{v.name}</td>
                          <td className="w-1/4 text-emerald-400 font-medium">₹{v.spend}</td>
                          <td className="w-1/4 text-slate-355">{v.pos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
