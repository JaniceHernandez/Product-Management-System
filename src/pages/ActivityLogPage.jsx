// src/pages/ActivityLogPage.jsx
// Displays the activity log for SUPERADMIN (all entries) and ADMIN (own entries).
// USER cannot access this page — route is gated in App.jsx and Sidebar.jsx.

import { useState, useEffect }  from 'react';
import { useAuth }              from '../hooks/useAuth';
import { getActivityLog }       from '../services/activityLogService';
import LoadingSpinner           from '../components/ui/LoadingSpinner';
import EmptyState               from '../components/ui/EmptyState';
import ErrorBanner              from '../components/ui/ErrorBanner';

// ── Colour config for each action type ──────────────────────────
const ACTION_CONFIG = {
  PRODUCT_ADDED:     { label: 'Product Added',     color: 'bg-green-100 text-green-700' },
  PRODUCT_EDITED:    { label: 'Product Edited',    color: 'bg-blue-100 text-blue-700' },
  PRODUCT_DELETED:   { label: 'Product Deleted',   color: 'bg-red-100 text-red-600' },
  PRODUCT_RECOVERED: { label: 'Product Recovered', color: 'bg-yellow-100 text-yellow-700' },
  PRICE_ADDED:       { label: 'Price Added',       color: 'bg-indigo-100 text-indigo-700' },
  USER_ACTIVATED:    { label: 'User Activated',    color: 'bg-green-100 text-green-700' },
  USER_DEACTIVATED:  { label: 'User Deactivated',  color: 'bg-red-100 text-red-600' },
  ROLE_CHANGED:      { label: 'Role Changed',      color: 'bg-purple-100 text-purple-700' },
  USER_SIGNED_IN:    { label: 'Signed In',         color: 'bg-gray-100 text-gray-600' },
  USER_SIGNED_OUT:   { label: 'Signed Out',        color: 'bg-gray-100 text-gray-500' },
};

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] ?? { label: action, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
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

export default function ActivityLogPage() {
  const { currentUser } = useAuth();
  const isSuperAdmin    = currentUser?.user_type === 'SUPERADMIN';
  const isAdmin         = currentUser?.user_type === 'ADMIN';
  const isUser          = currentUser?.user_type === 'USER';

  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

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

  return (
    <div className="p-6">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Activity Log</h2>
        <p className="text-sm text-gray-500 mt-0.5">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                  {/* User column — SUPERADMIN and ADMIN */}
                  {(isSuperAdmin || isAdmin) && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => (
                  <tr key={log.log_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    {(isSuperAdmin || isAdmin) && (
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700">{log.actor_email ?? log.actor_id}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            log.actor_role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-600'
                              : log.actor_role === 'ADMIN'  ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {log.actor_role}
                          </span>
                        </td>
                      )}
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">
                      {log.target_table && <span>{log.target_table}</span>}
                      {log.target_id   && <span className="text-gray-700 ml-1 font-semibold">{log.target_id}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{log.detail ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-400">
            {logs.length} entr{logs.length === 1 ? 'y' : 'ies'} shown (most recent first)
          </div>
        </div>
      )}

    </div>
  );
}