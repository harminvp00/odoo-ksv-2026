import React from 'react';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';

export default function POInvoiceDetail() {
  const lineItems = [
    { name: 'Ergonomic chair', qty: 25, unitPrice: 3500 },
    { name: 'Tech Core LTD', qty: 10, unitPrice: 8200 },
  ];

  return (
    <div className="flex h-screen bg-[#070a0e] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Navbar />

        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Purchase Order & Invoice</h1>
              <p className="text-sm text-slate-400 mt-1">PO-2024-auto-generated after approval</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary">Download PDF</Button>
              <Button variant="secondary">Print</Button>
              <Button>Email invoice</Button>
            </div>
          </div>

          {/* Doc details layout */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl space-y-8">
            <div className="grid grid-cols-2 gap-8 border-b border-slate-855 pb-8 text-sm">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase">Bill to:</h4>
                <p className="font-bold text-slate-200">your Organization Name</p>
                <p className="text-slate-400">123 business park, ahmedabad</p>
                <p className="font-mono text-xs text-slate-400">GSTIN: 25383438AFB</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase">Vendor:</h4>
                <p className="font-bold text-slate-200">Infra supplies pvt ltd</p>
                <p className="text-slate-400">456, industrial estate, surat</p>
                <p className="font-mono text-xs text-slate-400">GSTIN: 343434DB4523</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6 text-sm">
              <div>
                <span className="text-slate-500 text-xs block">PO Number:</span>
                <span className="font-semibold text-slate-300">PO-2025-0068</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">PO date:</span>
                <span className="font-semibold text-slate-300">21 may, 2025</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">invoice date:</span>
                <span className="font-semibold text-slate-300">22 may 2025</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Due date:</span>
                <span className="font-semibold text-slate-300">21 june 2025</span>
              </div>
            </div>

            {/* Line items details */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-355">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                    <th className="pb-3">Item</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Unit Price (₹)</th>
                    <th className="pb-3">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-855">
                  {lineItems.map((li, idx) => (
                    <tr key={idx}>
                      <td className="py-4 font-medium">{li.name}</td>
                      <td className="py-4">{li.qty}</td>
                      <td className="py-4">₹{li.unitPrice}</td>
                      <td className="py-4">₹{li.qty * li.unitPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tax calculations */}
            <div className="flex justify-end pt-4 border-t border-slate-855">
              <div className="w-80 space-y-3 text-sm text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-200">₹1,69,500</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST (9%)</span>
                  <span className="text-slate-200">₹15,255</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST (9%)</span>
                  <span className="text-slate-200">₹15,255</span>
                </div>
                <div className="border-t border-slate-800 pt-3 flex justify-between font-bold text-base">
                  <span className="text-slate-200">Grand total</span>
                  <span className="text-emerald-400">₹2,00,010</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500">Status:</span>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded font-semibold uppercase tracking-wider">Pending Payment</span>
          </div>
        </main>
      </div>
    </div>
  );
}
