import React, { useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function RFQCreate() {
  const [step, setStep] = useState(1);
  const [lineItems, setLineItems] = useState([
    { item: 'Ergonomic chair', qty: 25, unit: 'NOS' },
    { item: 'Standing desks', qty: 10, unit: 'NOS' }
  ]);
  const [assignedVendors, setAssignedVendors] = useState(['Infra Supplies Pvt Ltd', 'Techcore LTD']);

  return (
    <div className="flex h-screen bg-[#070a0e] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Navbar />

        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create RFQ's</h1>
            <p className="text-sm text-slate-400 mt-1">Initiate a new request for quotation</p>
          </div>

          {/* Wizard step progress */}
          <div className="bg-[#0e1318] p-6 border border-slate-800 rounded-xl flex items-center justify-center space-x-8">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-800'}`}>1</span>
            <div className="h-0.5 bg-slate-850 w-24"></div>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-800'}`}>2</span>
            <div className="h-0.5 bg-slate-850 w-24"></div>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800'}`}>3</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form elements details */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <Input label="RFQ's title*" defaultValue="Office Furniture procurement Q2" required />
              <Input label="Category" defaultValue="Furniture" />
              <Input label="Deadline*" type="date" defaultValue="2025-06-15" required />
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-medium text-slate-400 font-semibold">Description</label>
                <textarea
                  defaultValue="Ergonomic chairs and standing desks for 3rd floor"
                  className="h-28 bg-[#0e1318] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition resize-none"
                />
              </div>
            </div>

            {/* Line items and vendor assignments */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="font-semibold text-slate-200 mb-4">Line Items</h3>
                <div className="overflow-hidden border border-slate-800 rounded-lg mb-4">
                  <table className="w-full text-left text-sm text-slate-350">
                    <thead className="bg-[#0e1318] border-b border-slate-800 text-xs text-slate-400">
                      <tr>
                        <th className="px-4 py-2">Item</th>
                        <th className="px-4 py-2">Qty</th>
                        <th className="px-4 py-2">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {lineItems.map((li, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5">{li.item}</td>
                          <td className="px-4 py-2.5">{li.qty}</td>
                          <td className="px-4 py-2.5 font-mono text-xs">{li.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button variant="ghost" size="sm">+ add line item</Button>
              </div>

              <div>
                <h3 className="font-semibold text-slate-200 mb-4">ASSIGN VENDORS</h3>
                <div className="bg-[#0e1318] border border-slate-800 rounded-lg p-4 space-y-2">
                  {assignedVendors.map((vendor, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-850 pb-2 last:border-b-0 last:pb-0">
                      <span>{vendor}</span>
                      <button className="text-slate-500 hover:text-red-400 text-xs">×</button>
                    </div>
                  ))}
                  <button className="text-emerald-400 hover:text-emerald-300 text-xs mt-2 font-medium">+ add vendor</button>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments and actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            <div className="flex flex-col space-y-3">
              <Button>Save & Send to Vendors</Button>
              <Button variant="secondary">Save as Draft</Button>
            </div>

            <div className="bg-slate-900 border border-slate-855 rounded-xl p-6 flex flex-col justify-center items-center h-36 border-dashed">
              <span className="text-sm text-slate-400">Attachments</span>
              <p className="text-xs text-slate-650 mt-2">Drag & drop files or click to upload</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
