import React from 'react';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';

export default function QuotationCompare() {
  const criteria = [
    { label: 'Grand Total', infra: '185000', tech: '200010', office: '214800' },
    { label: 'GST %', infra: '18', tech: '18', office: '18' },
    { label: 'Delivery (days)', infra: '10', tech: '14', office: '7' },
    { label: 'Vendor rating', infra: '4.5/5', tech: '4.2/5', office: '3.8/5' },
    { label: 'Payment terms', infra: '30 days', tech: '30 days', office: '15 days' },
  ];

  return (
    <div className="flex h-screen bg-[#070a0e] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Navbar />

        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quotation Comparison</h1>
            <p className="text-sm text-slate-400 mt-1">RFQ: office furniture procurement q2 - 3 quotations received</p>
          </div>

          {/* Grid display layout comparison */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-4 bg-[#0e1318]/70 border-b border-slate-800 p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <div>Criteria</div>
              <div className="text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 rounded-lg">Infra Supplies (Lowest)</div>
              <div className="px-4 py-2">TechCore LTD</div>
              <div className="px-4 py-2">Office Need Co.</div>
            </div>

            <div className="divide-y divide-slate-850">
              {criteria.map((c, i) => (
                <div key={i} className="grid grid-cols-4 p-4 text-sm items-center hover:bg-slate-800/10">
                  <div className="text-slate-400 font-medium">{c.label}</div>
                  <div className="text-emerald-400 font-bold px-4">{c.infra}</div>
                  <div className="px-4 text-slate-200">{c.tech}</div>
                  <div className="px-4 text-slate-200">{c.office}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 p-4 bg-[#0e1318]/30 items-center border-t border-slate-800">
              <div></div>
              <div className="px-2">
                <Button size="sm" className="w-full">Select & Approve</Button>
              </div>
              <div className="px-2">
                <Button size="sm" variant="secondary" className="w-full">Select</Button>
              </div>
              <div className="px-2">
                <Button size="sm" variant="secondary" className="w-full">Select</Button>
              </div>
            </div>
          </div>

          <div className="text-xs text-rose-400/80 font-medium">
            * Green = lowest price, selecting vendor initiates the approval workflow.
          </div>
        </main>
      </div>
    </div>
  );
}
