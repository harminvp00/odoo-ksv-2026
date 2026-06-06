import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import { reportService } from '../../services/report.service';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, AlertCircle, TrendingUp, BarChart3, Download, RefreshCw } from 'lucide-react';

export default function ReportsAnalytics() {
  const { user } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [exportType, setExportType] = useState<'vendor-performance' | 'spending-summary' | 'monthly-trends'>('vendor-performance');
  const [exportLoading, setExportLoading] = useState(false);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await reportService.getInsights();
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load procurement analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'VENDOR') {
      fetchInsights();
    }
  }, [user]);

  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      const res = await reportService.exportReport(exportType, 'csv');
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exportType}-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export CSV report.');
    } finally {
      setExportLoading(false);
    }
  };

  if (user?.role === 'VENDOR') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center font-sans">
          <AlertCircle className="w-10 h-10 text-neutral-400 mb-4" />
          <h3 className="text-sm font-bold text-neutral-900">Access Restricted</h3>
          <p className="text-xs text-neutral-500 mt-1">Insights and analytics reports are restricted to staff roles.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
          <p className="text-xs text-neutral-500 mt-4 font-semibold">Generating procurement insights...</p>
        </div>
      </Layout>
    );
  }

  const stats = data?.statistics || {};
  const spending = data?.spendingSummary || {};
  const monthlyTrends = data?.monthlyTrends || [];
  const vendorPerformance = data?.vendorPerformance || [];

  // Find max monthly spend to calculate relative progress bar width
  const maxSpend = monthlyTrends.reduce((max: number, item: any) => Math.max(max, item.totalSpend), 1);

  const cards = [
    { title: 'Total Committed Spend', val: `$${(spending.committedSpend || 0).toLocaleString()}`, desc: 'Selected quotation totals' },
    { title: 'Total Settled Spend', val: `$${(spending.paidSpend || 0).toLocaleString()}`, desc: 'Paid invoice totals' },
    { title: 'Awaiting Settlement', val: `$${(spending.pendingSpend || 0).toLocaleString()}`, desc: 'Unpaid invoice values' },
    { title: 'Purchase Orders Issued', val: stats.totalPOs || 0, desc: 'Total PO count issued' },
  ];

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto w-full font-sans select-none">
        
        {/* Title and actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Procurement Insights</h1>
            <p className="text-xs text-neutral-500 mt-1">Workspace analytics outlining organizational spend and supplier performance logs</p>
          </div>
          <div className="flex gap-2.5 items-center w-full sm:w-auto">
            <select 
              value={exportType}
              onChange={(e: any) => setExportType(e.target.value)}
              className="input py-1.5 px-3 text-xs w-full sm:w-44 cursor-pointer"
            >
              <option value="vendor-performance">Supplier Performance</option>
              <option value="spending-summary">Spend Summary</option>
              <option value="monthly-trends">Monthly PO Trends</option>
            </select>
            <Button size="sm" onClick={handleExportCSV} disabled={exportLoading} className="gap-1.5 whitespace-nowrap">
              <Download className="w-3.5 h-3.5" />
              <span>{exportLoading ? 'Exporting...' : 'Export CSV'}</span>
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs font-semibold">
            {error}
          </div>
        )}

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {cards.map((c, idx) => (
            <div key={idx} className="card p-5 bg-white border border-neutral-250/20 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">{c.title}</span>
              <span className="text-2xl font-extrabold text-neutral-900 block mt-1.5">{c.val}</span>
              <span className="text-[9px] text-neutral-400 font-medium block">{c.desc}</span>
            </div>
          ))}
        </div>

        {/* Dynamic trends and tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Monthly PO Spend trends */}
          <div className="bg-white border border-neutral-250/20 rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-neutral-450 uppercase tracking-wider">Monthly Spend Trends</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">Expenditure from PO selection totals this calendar year</p>
            </div>
            
            {monthlyTrends.length === 0 ? (
              <div className="text-center py-10">
                <BarChart3 className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs text-neutral-500 font-medium">No trend data available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {monthlyTrends.map((t: any, idx: number) => {
                  const widthPercent = Math.max(5, Math.round((t.totalSpend / maxSpend) * 100));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-neutral-800">
                        <span className="font-semibold">{t.month}</span>
                        <div className="flex gap-2 text-neutral-450 text-[11px]">
                          <span>{t.poCount} POs</span>
                          <span>•</span>
                          <span className="text-neutral-950 font-bold">${t.totalSpend.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-neutral-50 border border-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-neutral-950 rounded-full transition-all duration-300"
                          style={{ width: `${widthPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Supplier conversions and rating ranking */}
          <div className="bg-white border border-neutral-250/20 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-neutral-450 uppercase tracking-wider">Supplier Performance Rankings</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">Overview of bid conversion rates and rating averages</p>
            </div>
            
            {vendorPerformance.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-neutral-200 rounded-xl">
                <TrendingUp className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs text-neutral-500 font-medium">No vendor transactions recorded.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-neutral-200/80 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200/85 bg-neutral-50/50">
                      <th className="px-4 py-2.5 font-semibold text-neutral-500 uppercase">Supplier</th>
                      <th className="px-4 py-2.5 font-semibold text-neutral-500 uppercase">Conversion</th>
                      <th className="px-4 py-2.5 font-semibold text-neutral-500 uppercase text-center">Rating</th>
                      <th className="px-4 py-2.5 font-semibold text-neutral-500 uppercase text-right">Paid Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {vendorPerformance.map((v: any) => (
                      <tr key={v.vendorId} className="hover:bg-neutral-50/30">
                        <td className="px-4 py-3 font-bold text-neutral-900">{v.vendorName}</td>
                        <td className="px-4 py-3 text-neutral-500 font-medium">
                          {v.selectedQuotes} / {v.submittedQuotes} ({v.conversionRate}%)
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-neutral-800">
                          {v.rating > 0 ? `${v.rating.toFixed(1)}/5.0` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-neutral-950">
                          ${Number(v.totalPaidVolume || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </Layout>
  );
}
