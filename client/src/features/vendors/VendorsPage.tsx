import React, { useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

export default function VendorsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('All');

  const vendors = [
    { name: 'Infra Supplies Pvt Ltd', category: 'Construction', gst: '27AABCS1429Bz0', contact: 'XYZ Number', status: 'Active' },
    { name: 'Tech Core LTD', category: 'IT', gst: '27AABCS1429Bz0', contact: 'XYZ Number', status: 'Active' },
    { name: 'FastLog Transport', category: 'Logistics', gst: '27AABCS1429Bz0', contact: 'XYZ Number', status: 'Blocked' },
  ];

  return (
    <div className="flex h-screen bg-[#070a0e] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Navbar />

        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
              <p className="text-sm text-slate-400 mt-1">Manage supplier profiles and registrations</p>
            </div>
            <Button onClick={() => setIsOpen(true)}>+ Add Vendor</Button>
          </div>

          {/* Search bar */}
          <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
            <Input placeholder="Search by name, GST number, category..." className="max-w-md" />
          </div>

          {/* Filter Categories tabs */}
          <div className="flex space-x-2 border-b border-slate-800 pb-px">
            {['All', 'Active', 'Pending', 'Blocked'].map((tab) => (
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

          {/* Vendor lists table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="bg-[#0e1318]/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-4">Vendor Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">GST No.</th>
                  <th className="px-6 py-4">Contact No.</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {vendors.map((v, i) => (
                  <tr key={i} className="hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-medium">{v.name}</td>
                    <td className="px-6 py-4">{v.category}</td>
                    <td className="px-6 py-4 font-mono text-xs">{v.gst}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{v.contact}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Registration modal */}
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Register Supplier Profile">
            <form onSubmit={(e) => { e.preventDefault(); setIsOpen(false); }} className="space-y-4">
              <Input label="Vendor Name*" required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Category*" placeholder="e.g. IT, Furniture" required />
                <Input label="GST No.*" placeholder="15-digit number" required />
              </div>
              <Input label="Contact Details*" required />
              <Input label="Office Location Address" />
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <Button variant="secondary" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">Submit Registration</Button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}
