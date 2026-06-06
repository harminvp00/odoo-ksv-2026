import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import { activityService } from '../../services/activity.service';
import { useAuth } from '../../hooks/useAuth';
import { 
  CheckCircle2, Clock, FileText, UserPlus, 
  Settings, Loader2, AlertCircle, RefreshCw 
} from 'lucide-react';

export default function ActivityLogs() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const typeParam = filter === 'All' ? undefined : filter.toUpperCase().replace(/S$/, ''); 
      // Mapping 'Approvals' -> 'APPROVAL', 'Invoices' -> 'INVOICE', 'Vendors' -> 'VENDOR'
      let finalType: string | undefined = typeParam;
      if (typeParam === 'APPROVAL') finalType = 'APPROVAL';
      else if (typeParam === 'INVOICE') finalType = 'INVOICE';
      else if (typeParam === 'VENDOR') finalType = 'VENDOR';
      
      const res = await activityService.getActivityLogs(finalType);
      setLogs(res.data.logs || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retrieve activity log history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'VENDOR') {
      fetchLogs();
    }
  }, [filter, user]);

  const getLogIcon = (type: string) => {
    const term = type.toUpperCase();
    if (term === 'RFQ') return FileText;
    if (term === 'APPROVAL') return CheckCircle2;
    if (term === 'INVOICE') return Clock;
    if (term === 'VENDOR') return UserPlus;
    return Settings;
  };

  const getLogStyle = (type: string) => {
    const term = type.toUpperCase();
    if (term === 'RFQ') return 'bg-neutral-50 border-neutral-200 text-neutral-600';
    if (term === 'APPROVAL') return 'bg-accent-successBg border-accent-success/20 text-accent-success';
    if (term === 'INVOICE') return 'bg-accent-warningBg border-accent-warning/20 text-accent-warning';
    if (term === 'VENDOR') return 'bg-neutral-100 border-neutral-200 text-neutral-700';
    return 'bg-neutral-50 border-neutral-250 text-neutral-450';
  };

  if (user?.role === 'VENDOR') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center font-sans">
          <AlertCircle className="w-10 h-10 text-neutral-400 mb-4" />
          <h3 className="text-sm font-bold text-neutral-900">Access Restricted</h3>
          <p className="text-xs text-neutral-500 mt-1">Audit logs are restricted to internal procurement staff roles.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto w-full font-sans select-none">
        
        {/* Title area */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Workspace Activity Logs</h1>
            <p className="text-xs text-neutral-500 mt-1">Audit trail tracking all procurement transactions and system events</p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchLogs} disabled={loading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload Logs</span>
          </Button>
        </div>

        {/* Audit categories tabs */}
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {['All', 'RFQ', 'Approvals', 'Invoices', 'Vendors'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                filter === tab
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-50 text-neutral-500 border border-neutral-100 hover:text-neutral-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-accent-dangerBg border border-accent-danger/20 rounded-xl text-accent-danger text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Audit list container */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-200/80 rounded-2xl">
            <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
            <p className="text-xs text-neutral-500 mt-3 font-semibold">Querying audit logs registry...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 bg-white border border-neutral-250/20 rounded-2xl border-dashed">
            <Clock className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-900">No logs found</h3>
            <p className="text-xs text-neutral-500 mt-1">There are no matching activities recorded under the "{filter}" category.</p>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm divide-y divide-neutral-100">
            {logs.map((log) => {
              const Icon = getLogIcon(log.type);
              const cardStyle = getLogStyle(log.type);
              const userLabel = log.user 
                ? `${log.user.firstName} ${log.user.lastName} (${log.user.role.replace(/_/g, ' ').toLowerCase()})` 
                : 'System Process';
              
              return (
                <div key={log.id} className="flex items-start space-x-4 py-5 first:pt-0 last:pb-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${cardStyle}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-neutral-900 leading-snug">{log.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-medium">
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                      <span>•</span>
                      <span className="text-neutral-500 font-bold">{userLabel}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
