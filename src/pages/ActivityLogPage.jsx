// src/pages/ActivityLogPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getActivityLog } from '../services/activityLogService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorBanner from '../components/ui/ErrorBanner';

// ── Icons ─────────────────────────────────────────────────────────
function IconSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 15, height: 15 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 14, height: 14 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 12, height: 12 }}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Colour config for each action type ──────────────────────────
const ACTION_CONFIG = {
  PRODUCT_ADDED:     { label: 'Product Added',     color: 'bg-green-50 text-green-700' },
  PRODUCT_EDITED:    { label: 'Product Edited',    color: 'bg-blue-50 text-blue-700' },
  PRODUCT_DELETED:   { label: 'Product Deleted',   color: 'bg-red-50 text-red-600' },
  PRODUCT_RECOVERED: { label: 'Product Recovered', color: 'bg-yellow-50 text-yellow-700' },
  PRICE_ADDED:       { label: 'Price Added',       color: 'bg-indigo-50 text-indigo-700' },
  USER_ACTIVATED:    { label: 'User Activated',    color: 'bg-green-50 text-green-700' },
  USER_DEACTIVATED:  { label: 'User Deactivated',  color: 'bg-red-50 text-red-600' },
  ROLE_CHANGED:      { label: 'Role Changed',      color: 'bg-purple-50 text-purple-700' },
  USER_SIGNED_IN:    { label: 'Signed In',         color: 'bg-gray-100 text-gray-600' },
  USER_SIGNED_OUT:   { label: 'Signed Out',        color: 'bg-gray-100 text-gray-500' },
};

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] ?? { label: action, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function RoleBadge({ role }) {
  if (role === 'SUPERADMIN') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-800 text-white">SUPERADMIN</span>;
  }
  if (role === 'ADMIN') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">ADMIN</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">USER</span>;
}

function TruncatedCell({ text, className = '' }) {
  if (!text) return <span className="text-gray-300 italic text-xs">—</span>;
  return <span className={`block truncate max-w-[220px] ${className}`} title={text}>{text}</span>;
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const ALL_ACTION_KEYS = Object.keys(ACTION_CONFIG);

export default function ActivityLogPage() {
  const { currentUser } = useAuth();
  const isSuperAdmin    = currentUser?.user_type === 'SUPERADMIN';
  const isAdmin         = currentUser?.user_type === 'ADMIN';

  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const [searchTerm,   setSearchTerm]   = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate,    setStartDate]    = useState('');
  const [endDate,      setEndDate]      = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => { fetchLogs(); }, []);

  async function fetchLogs() {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await getActivityLog({ limit: 500 });
    if (fetchError) {
      setError('Failed to load activity log. Please try again.');
      setLoading(false);
      return;
    }
    setLogs(data);
    setLoading(false);
  }

  const presentActions = useMemo(() => {
    const seen = new Set(logs.map(l => l.action).filter(Boolean));
    return ALL_ACTION_KEYS.filter(k => seen.has(k));
  }, [logs]);

  const setDatePreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const hasDateFilter = startDate || endDate;

  const displayed = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return logs.filter(log => {
      const matchesSearch = !term ||
        (log.actor_email || '').toLowerCase().includes(term) ||
        (log.actor_role || '').toLowerCase().includes(term) ||
        (log.detail || '').toLowerCase().includes(term) ||
        (log.target_table || '').toLowerCase().includes(term);
      
      const matchesAction = !actionFilter || log.action === actionFilter;
      
      let matchesDate = true;
      if (startDate || endDate) {
        const logDate = log.created_at ? new Date(log.created_at) : null;
        if (!logDate) matchesDate = false;
        if (startDate && logDate < new Date(startDate)) matchesDate = false;
        if (endDate && logDate > new Date(endDate + 'T23:59:59')) matchesDate = false;
      }
      
      return matchesSearch && matchesAction && matchesDate;
    });
  }, [logs, searchTerm, actionFilter, startDate, endDate]);

  const hasActiveFilters = searchTerm || actionFilter || startDate || endDate;

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-sm text-gray-400 mt-1">
          {isSuperAdmin
            ? 'All system activity across all users.'
            : isAdmin
            ? 'Your activity and all product updates across the system.'
            : 'Product activity across the system.'}
        </p>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchLogs} />}
      {loading && <LoadingSpinner />}

      {!loading && !error && logs.length === 0 && (
        <EmptyState title="No activity recorded yet" description="Actions like adding products, activating users, and signing in will appear here." />
      )}

      {!loading && !error && logs.length > 0 && (
        <>
          {/* Controls Row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch /></span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search user, role, or details…"
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
            >
              <option value="">All Actions</option>
              {presentActions.map(k => <option key={k} value={k}>{ACTION_CONFIG[k]?.label ?? k}</option>)}
            </select>

            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                showDatePicker || hasDateFilter
                  ? 'bg-pink-100 text-pink-700 border border-pink-200'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <IconCalendar />
              <span>Date</span>
              {hasDateFilter && <span className="w-2 h-2 rounded-full bg-pink-500" />}
            </button>

            {hasActiveFilters && (
              <button
                onClick={() => { setSearchTerm(''); setActionFilter(''); clearDateFilter(); }}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600"
              >
                <IconX /> Clear all
              </button>
            )}
          </div>

          {/* Date Picker Panel */}
          {showDatePicker && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">From</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">To</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
                  />
                </div>
                <div className="w-px h-6 bg-gray-200" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Quick:</span>
                  <button onClick={() => setDatePreset(1)} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-pink-50">Today</button>
                  <button onClick={() => setDatePreset(7)} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-pink-50">Last 7 days</button>
                  <button onClick={() => setDatePreset(30)} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-pink-50">Last 30 days</button>
                </div>
                {hasDateFilter && (
                  <button onClick={clearDateFilter} className="text-xs text-pink-600 hover:text-pink-700">Clear</button>
                )}
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-400">Filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-600 text-[10px]">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')}><IconX /></button>
                </span>
              )}
              {actionFilter && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-600 text-[10px]">
                  {ACTION_CONFIG[actionFilter]?.label}
                  <button onClick={() => setActionFilter('')}><IconX /></button>
                </span>
              )}
              {hasDateFilter && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-600 text-[10px]">
                  {startDate || 'any'} → {endDate || 'any'}
                  <button onClick={clearDateFilter}><IconX /></button>
                </span>
              )}
            </div>
          )}

          {/* Count */}
          <p className="text-xs text-gray-400 mb-3">
            Showing <span className="font-semibold text-gray-600">{displayed.length}</span> of{' '}
            <span className="font-semibold text-gray-600">{logs.length}</span> entries
            {hasActiveFilters && <span className="ml-1 text-pink-500">(filtered)</span>}
          </p>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'linear-gradient(to bottom, #fafafa, #f5f5f5)', borderBottom: '1px solid #f0f0f0' }}>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">Time</th>
                    {(isSuperAdmin || isAdmin) && <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">User</th>}
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Action</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Target</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayed.map(log => (
                    <tr key={log.log_id} className="hover:bg-pink-50/40 transition-colors">
                      <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(log.created_at)}</td>
                      {(isSuperAdmin || isAdmin) && (
                        <td className="px-4 py-3.5">
                          <span className="block text-sm font-medium text-gray-700 truncate max-w-[200px]" title={log.actor_email ?? log.actor_id}>
                            {log.actor_email ?? log.actor_id ?? '—'}
                          </span>
                          <div className="mt-0.5"><RoleBadge role={log.actor_role} /></div>
                        </td>
                      )}
                      <td className="px-4 py-3.5"><ActionBadge action={log.action} /></td>
                      <td className="px-4 py-3.5 text-xs font-mono text-gray-500 max-w-[200px]">
                        {log.target_table && <span className="text-gray-400">{log.target_table} </span>}
                        {log.target_id && <TruncatedCell text={log.target_id} className="text-gray-600 font-semibold" />}
                        {!log.target_table && !log.target_id && <span className="text-gray-300 italic">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600 max-w-[240px]"><TruncatedCell text={log.detail} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-400">Showing <span className="font-semibold text-gray-600">{displayed.length}</span> of <span className="font-semibold text-gray-600">{logs.length}</span> entries</p>
              <p className="text-xs text-gray-400 hidden sm:block">Most recent first</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}