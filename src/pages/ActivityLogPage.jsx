// src/pages/ActivityLogPage.jsx
// Displays the activity log for SUPERADMIN (all entries) and ADMIN (own entries).
// USER cannot access this page — route is gated in App.jsx and Sidebar.jsx.

import { useState, useEffect, useMemo } from 'react';
import { useAuth }              from '../hooks/useAuth';
import { getActivityLog }       from '../services/activityLogService';
import LoadingSpinner           from '../components/ui/LoadingSpinner';
import EmptyState               from '../components/ui/EmptyState';
import ErrorBanner              from '../components/ui/ErrorBanner';

// ── Icon ─────────────────────────────────────────────────────────
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

// ── Action badge — matches TypeBadge style from UserManagement ──
function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] ?? { label: action, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ── Actor role badge — identical to TypeBadge in UserManagement ─
function RoleBadge({ role }) {
  if (role === 'SUPERADMIN') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-800 text-white">
        SUPERADMIN
      </span>
    );
  }
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
        ADMIN
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
      USER
    </span>
  );
}

// ── Truncated cell with tooltip on hover ─────────────────────────
function TruncatedCell({ text, className = '' }) {
  if (!text) return <span className="text-gray-300 italic text-xs">—</span>;
  return (
    <span
      className={`block truncate max-w-[220px] ${className}`}
      title={text}
    >
      {text}
    </span>
  );
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── All unique action types for the filter dropdown ──────────────
const ALL_ACTION_KEYS = Object.keys(ACTION_CONFIG);

export default function ActivityLogPage() {
  const { currentUser } = useAuth();
  const isSuperAdmin    = currentUser?.user_type === 'SUPERADMIN';
  const isAdmin         = currentUser?.user_type === 'ADMIN';

  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // ── Filter state ─────────────────────────────────────────────
  const [searchTerm,    setSearchTerm]    = useState('');
  const [actionFilter,  setActionFilter]  = useState('');

  useEffect(() => { fetchLogs(); }, []);

  async function fetchLogs() {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await getActivityLog({ limit: 200 });
    if (fetchError) {
      setError('Failed to load activity log. Please try again.');
      setLoading(false);
      return;
    }
    setLogs(data);
    setLoading(false);
  }

  // ── Derive the action types actually present in loaded logs ───
  const presentActions = useMemo(() => {
    const seen = new Set(logs.map(l => l.action).filter(Boolean));
    return ALL_ACTION_KEYS.filter(k => seen.has(k));
  }, [logs]);

  // ── Filtered logs ─────────────────────────────────────────────
  const displayed = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return logs.filter(log => {
      const matchesSearch =
        !term ||
        (log.actor_email  || '').toLowerCase().includes(term) ||
        (log.actor_role   || '').toLowerCase().includes(term) ||
        (log.detail       || '').toLowerCase().includes(term) ||
        (log.target_table || '').toLowerCase().includes(term);
      const matchesAction = !actionFilter || log.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

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

      {error   && <ErrorBanner message={error} onRetry={fetchLogs} />}
      {loading && <LoadingSpinner />}

      {!loading && !error && logs.length === 0 && (
        <EmptyState
          title="No activity recorded yet"
          description="Actions like adding products, activating users, and signing in will appear here."
        />
      )}

      {!loading && !error && logs.length > 0 && (
        <>
          {/* ── Top controls: Search + Action filter ── */}
          <div className="flex flex-wrap items-center gap-3 mb-5">

            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <IconSearch />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by user, role, or details…"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
              />
            </div>

            {/* Action type filter */}
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
            >
              <option value="">All Actions</option>
              {presentActions.map(k => (
                <option key={k} value={k}>{ACTION_CONFIG[k]?.label ?? k}</option>
              ))}
            </select>
          </div>

          {/* ── Table ── */}
          <div
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.07)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'linear-gradient(to bottom, #fafafa, #f5f5f5)', borderBottom: '1px solid #f0f0f0' }}>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                      Time
                    </th>
                    {(isSuperAdmin || isAdmin) && (
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                        User
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                      Target
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {displayed.map(log => (
                    <tr key={log.log_id} className="hover:bg-pink-50/40 transition-colors">

                      {/* Time */}
                      <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>

                      {/* User: email + role badge, like Username+name in UserManagement */}
                      {(isSuperAdmin || isAdmin) && (
                        <td className="px-4 py-3.5">
                          <span className="block text-sm font-medium text-gray-700 truncate max-w-[200px]" title={log.actor_email ?? log.actor_id}>
                            {log.actor_email ?? log.actor_id ?? '—'}
                          </span>
                          <div className="mt-0.5">
                            <RoleBadge role={log.actor_role} />
                          </div>
                        </td>
                      )}

                      {/* Action */}
                      <td className="px-4 py-3.5">
                        <ActionBadge action={log.action} />
                      </td>

                      {/* Target — truncated with tooltip */}
                      <td className="px-4 py-3.5 text-xs font-mono text-gray-500 max-w-[200px]">
                        {log.target_table && (
                          <span className="text-gray-400">{log.target_table} </span>
                        )}
                        {log.target_id && (
                          <TruncatedCell
                            text={log.target_id}
                            className="text-gray-600 font-semibold"
                          />
                        )}
                        {!log.target_table && !log.target_id && (
                          <span className="text-gray-300 italic">—</span>
                        )}
                      </td>

                      {/* Details — truncated with tooltip */}
                      <td className="px-4 py-3.5 text-xs text-gray-600 max-w-[240px]">
                        <TruncatedCell text={log.detail} />
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer — matches UserManagement footer */}
            <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing{' '}
                <span className="font-semibold text-gray-600">{displayed.length}</span>
                {' '}of{' '}
                <span className="font-semibold text-gray-600">{logs.length}</span>
                {' '}entr{logs.length === 1 ? 'y' : 'ies'}
              </p>
              <p className="text-xs text-gray-400 hidden sm:block">
                Most recent first
              </p>
            </div>
          </div>
        </>
      )}

    </div>
  );
}