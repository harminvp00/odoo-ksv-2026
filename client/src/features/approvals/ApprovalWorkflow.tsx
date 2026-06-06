import React from 'react';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';

export default function ApprovalWorkflow() {
  const steps = [
    { label: 'Submitted', status: 'done' },
    { label: 'L1 Review', status: 'done' },
    { label: 'L2 approval', status: 'active' },
    { label: 'Generate PO', status: 'pending' }
  ];

  return (
    <div className="flex h-screen bg-[#070a0e] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Navbar />

        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Approval Workflow</h1>
            <p className="text-sm text-slate-400 mt-1">RFQ: office furniture Q2 - Vendor: Infra Supplies - 185400</p>
          </div>

          {/* Workflow Steps layout */}
          <div className="bg-[#0e1318] p-6 border border-slate-800 rounded-xl flex items-center justify-around">
            {steps.map((s, idx) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center space-y-1.5">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    s.status === 'done' ? 'bg-emerald-600 text-white' :
                    s.status === 'active' ? 'bg-amber-500 text-slate-900 border border-amber-400 animate-pulse' :
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className={`text-xs ${s.status === 'active' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && <div className="h-0.5 bg-slate-800 w-16 mb-4"></div>}
              </React.Fragment>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Approval chains checklist */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-slate-200 mb-4">APPROVAL CHAIN</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3.5">
                    <span className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">✓</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">Rahul Mehta (Procurement head)</p>
                      <p className="text-xs text-slate-500">Approved on may 20, 10:32 Am</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5">
                    <span className="p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-bold">⏱</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">Priya Shah (finance manager)</p>
                      <p className="text-xs text-slate-500">Awaiting - Assigned may 21</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">Approval Remarks</label>
                <textarea
                  placeholder="Add your comments or conditions...."
                  className="w-full h-24 bg-[#0e1318] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition resize-none"
                />
              </div>
            </div>

            {/* Quotations summary & actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
              <div className="bg-[#0e1318] border border-slate-800 rounded-lg p-6 space-y-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">QUOTATIONS SUMMARY</h4>
                <div className="space-y-2.5 text-sm text-slate-350">
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span>Vendor:</span>
                    <span className="font-semibold text-slate-250">Infra Supplies PVT LTD</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span>Grand Total:</span>
                    <span className="font-bold text-emerald-400">₹1,85,400</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span>Delivery:</span>
                    <span>10 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rating:</span>
                    <span>4.5/5</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button className="flex-1">Approve</Button>
                <Button variant="danger" className="flex-1">Reject</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
