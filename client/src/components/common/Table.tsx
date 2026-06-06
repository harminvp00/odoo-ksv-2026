import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export default function Table({ headers, children }: TableProps) {
  return (
    <div className="w-full overflow-x-auto border border-slate-850 rounded-xl bg-slate-900/40">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-[#0e1318]/50">
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {children}
        </tbody>
      </table>
    </div>
  );
}
