import React from 'react';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function QuotationSubmit() {
  const lineItems = [
    { item: 'Ergonomic chair', qty: 25, price: 3500 },
    { item: 'Tech Core LTD', qty: 10, price: 8200 }
  ];

  return (
    <div className="flex h-screen bg-[#070a0e] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Navbar />

        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Submit Quotations</h1>
            <p className="text-sm text-slate-400 mt-1">RFQ: office furniture procurement q2 - deadline 15 june 2025</p>
          </div>

          {/* RFQ Summary */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">RFQ Summary</h4>
            <p className="text-sm text-slate-200">Ergonomic chair × 25, standing desk × 10 - category furniture</p>
          </div>

          {/* Pricing Submission table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h3 className="font-semibold text-slate-200 mb-4">Your Quotation</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-350">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                    <th className="pb-3">Item</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Unit Price (₹)</th>
                    <th className="pb-3">Total (₹)</th>
                    <th className="pb-3">Delivery (days)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-855">
                  {lineItems.map((li, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/10">
                      <td className="py-4">{li.item}</td>
                      <td className="py-4">{li.qty}</td>
                      <td className="py-4">
                        <Input type="number" defaultValue={li.price} className="max-w-[120px] py-1.5" />
                      </td>
                      <td className="py-4 font-medium">₹{li.qty * li.price}</td>
                      <td className="py-4">
                        <Input type="number" placeholder="Days" className="max-w-[90px] py-1.5" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary totals and tax entry */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <Input label="Tax / GST %" defaultValue="18" className="max-w-[200px]" />
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Note / terms</label>
                <textarea
                  placeholder="Payment terms: 20 days net..."
                  className="h-28 bg-[#0e1318] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition resize-none"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-200">₹1,69,599</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span className="text-slate-200">₹30,510</span>
                </div>
                <div className="border-t border-slate-855 pt-3 flex justify-between font-bold text-base">
                  <span className="text-slate-200">Grand Total</span>
                  <span className="text-emerald-400">₹2,00,010</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-6 border-t border-slate-855">
                <Button className="flex-1">Submit Quotation</Button>
                <Button variant="secondary" className="flex-1">Save Draft</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
