// src/pages/UserManagementPage.jsx
// Admin Module: view and manage all registered users.
// Accessible via /admin (sidebar gated by ADM_USER=1 in S2-T13).
// SUPERADMIN rows: all action buttons disabled with tooltip.
// DB-level protection from RLS (S3-T07) — UI protection is a second layer.
import { useState, useEffect } from 'react';
import { useAuth }       from '../hooks/useAuth';
import { useRights }     from '../hooks/useRights';
import { getAllUsers, activateUser, deactivateUser } from '../services/userService';
import { useSuperAdminGuard } from '../hooks/useSuperAdminGuard';

// Badge component for record_status
function StatusBadge({ status }) {
  const isActive = status === 'ACTIVE';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      isActive
        ? 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-600'
    }`}>
      {isActive ? '● Active' : '● Inactive'}
    </span>
  );
}

// Badge for user_type
function TypeBadge({ userType }) {
  const styles = {
    SUPERADMIN: 'bg-purple-100 text-purple-700',
    ADMIN:      'bg-blue-100 text-blue-700',
    USER:       'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      styles[userType] ?? 'bg-gray-100 text-gray-500'
    }`}>
      {userType}
    </span>
  );
}

export default function UserManagementPage() {
  const { currentUser }     = useAuth();
  const { canManageUsers }  = useRights();

  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [actionId,   setActionId]   = useState(null);   // userid currently being updated
  const [actionError, setActionError] = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await getAllUsers();

    if (fetchError) {
      setError('Failed to load users. Please try again.');
      setLoading(false);
      return;
    }

    setUsers(data);
    setLoading(false);
  }

  // SUPERADMIN protection check — project guide Section 7.2
  // All buttons on SUPERADMIN rows are disabled regardless of actor.
  const { isProtectedRow, getTooltip, getRowClass } = useSuperAdminGuard();

  async function handleActivate(user) {
    if (isProtectedRow(user)) return;

    setActionError('');
    setSuccessMsg('');
    setActionId(user.userid);

    const { error: activateErr } = await activateUser(user.userid, currentUser.userid);

    setActionId(null);

    if (activateErr) {
      setActionError(
        activateErr.message?.includes('row-level security')
          ? `Cannot activate "${user.username}": permission denied. SUPERADMIN accounts cannot be modified.`
          : `Failed to activate "${user.username}". ${activateErr.message ?? ''}`
      );
      return;
    }

    // Optimistic update
    setUsers(prev =>
      prev.map(u => u.userid === user.userid ? { ...u, record_status: 'ACTIVE' } : u)
    );
    setSuccessMsg(`"${user.username}" has been activated and can now sign in.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  async function handleDeactivate(user) {
    if (isProtectedRow(user)) return;

    setActionError('');
    setSuccessMsg('');
    setActionId(user.userid);

    const { error: deactivateErr } = await deactivateUser(user.userid, currentUser.userid);

    setActionId(null);

    if (deactivateErr) {
      setActionError(
        deactivateErr.message?.includes('row-level security')
          ? `Cannot deactivate "${user.username}": permission denied. SUPERADMIN accounts cannot be modified.`
          : `Failed to deactivate "${user.username}". ${deactivateErr.message ?? ''}`
      );
      return;
    }

    setUsers(prev =>
      prev.map(u => u.userid === user.userid ? { ...u, record_status: 'INACTIVE' } : u)
    );
    setSuccessMsg(`"${user.username}" has been deactivated and cannot sign in until reactivated.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  // Sort: SUPERADMIN first, then ADMIN, then USER; within each type by username
  const sorted = [...users].sort((a, b) => {
    const typeOrder = { SUPERADMIN: 0, ADMIN: 1, USER: 2 };
    const ta = typeOrder[a.user_type] ?? 3;
    const tb = typeOrder[b.user_type] ?? 3;
    if (ta !== tb) return ta - tb;
    return (a.username ?? '').localeCompare(b.username ?? '');
  });

  return (
    <div className="p-6">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">User Management</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage user access. Activate new registrations or deactivate accounts.
          SUPERADMIN accounts cannot be modified.
        </p>
      </div>

      {/* Success flash */}
      {successMsg && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-start gap-2">
          <span className="mt-0.5">✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Fetch error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-3">
          <span>{error}</span>
          <button onClick={fetchUsers} className="underline hover:no-underline shrink-0">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && sorted.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="font-medium">No users found</p>
        </div>
      )}

      {/* User table */}
      {!loading && !error && sorted.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email / ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {sorted.map(user => {
                  const superadminRow = isProtectedRow(user);
                  const isCurrentUser = user.userid === currentUser?.userid;
                  const isUpdating    = actionId === user.userid;
                  const isActive      = user.record_status === 'ACTIVE';

                  return (
                    <tr
                      key={user.userid}
                      className={getRowClass(user)}
                    >
                      {/* Username */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{user.username ?? '—'}</span>
                          {isCurrentUser && (
                            <span className="text-xs text-blue-500 font-medium">(you)</span>
                          )}
                        </div>
                        {(user.firstname || user.lastname) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {[user.firstname, user.lastname].filter(Boolean).join(' ')}
                          </p>
                        )}
                      </td>

                      {/* Email / userid */}
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                        {user.userid}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <TypeBadge userType={user.user_type} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={user.record_status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">

                          {/* Activate button */}
                          {/* Disabled for SUPERADMIN rows (project guide Section 7.2) */}
                          <div
                            title={getTooltip(user)}
                            className="inline-block"
                          >
                            <button
                              onClick={() => handleActivate(user)}
                              disabled={superadminRow || isUpdating || isActive}
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                superadminRow || isActive
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-green-600 hover:bg-green-50 hover:text-green-800'
                              }`}
                            >
                              {isUpdating ? '…' : 'Activate'}
                            </button>
                          </div>

                          {/* Deactivate button */}
                          <div
                            title={getTooltip(user)}
                            className="inline-block"
                          >
                            <button
                              onClick={() => handleDeactivate(user)}
                              disabled={superadminRow || isUpdating || !isActive}
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                superadminRow || !isActive
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-red-500 hover:bg-red-50 hover:text-red-700'
                              }`}
                            >
                              {isUpdating ? '…' : 'Deactivate'}
                            </button>
                          </div>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            {sorted.length} user{sorted.length !== 1 ? 's' : ''} —{' '}
            {sorted.filter(u => u.record_status === 'ACTIVE').length} active,{' '}
            {sorted.filter(u => u.record_status === 'INACTIVE').length} inactive
          </div>
        </div>
      )}

    </div>
  );
}