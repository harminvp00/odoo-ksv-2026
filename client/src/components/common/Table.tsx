import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export default function Table({ headers, children }: TableProps) {
  return (
    <div className="w-full overflow-x-auto border border-neutral-200/80 rounded-xl bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-neutral-200/80 bg-neutral-50/50">
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 select-none">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {children}
        </tbody>
      </table>
    </div>
  );
}

