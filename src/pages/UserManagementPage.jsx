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
import { changeUserRole }  from '../services/userService';
import { useStampVisibility } from '../hooks/useStampVisibility';
import ChangeRoleModal     from '../components/admin/ChangeRoleModal';
import FeaturePermissionsPanel from '../components/admin/FeaturePermissionsPanel';

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
function TypeBadge({ user }) {
  const isSuperAdmin = user.user_type === 'SUPERADMIN';
  const isSeeded = user.is_seeded === true;

  let displayRole = user.user_type;
  let bgColor = 'bg-gray-100 text-gray-600';

  if (isSuperAdmin) {
    if (isSeeded) {
      displayRole = 'SUPERADMIN';
      bgColor = 'bg-purple-800 text-white'; // special dark purple for seeded
    } else {
      displayRole = 'AUTHORIZED SUPERADMIN';
      bgColor = 'bg-purple-100 text-purple-700';
    }
  } else if (user.user_type === 'ADMIN') {
    displayRole = 'ADMIN';
    bgColor = 'bg-blue-100 text-blue-700';
  } else {
    displayRole = 'USER';
    bgColor = 'bg-gray-100 text-gray-600';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
      {displayRole}
    </span>
  );
}

export default function UserManagementPage() {
  const { currentUser }     = useAuth();
  const { canManageUsers }  = useRights();
  const { showUserStamp } = useStampVisibility();
  const { refetchRights } = useRights();

  const isSameLevelRestricted = (targetUser) => {
    if (!currentUser) return false;
    const isAuthorizedSA = currentUser.user_type === 'SUPERADMIN' && currentUser.is_seeded === false;
    const targetIsAuthorizedSA = targetUser.user_type === 'SUPERADMIN' && targetUser.is_seeded === false;
    return isAuthorizedSA && targetIsAuthorizedSA;
  };

  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [actionId,   setActionId]   = useState(null);   // userid currently being updated
  const [actionError, setActionError] = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');
  const [roleModalUser, setRoleModalUser] = useState(null); // user row being edited
  const [promoteConfirm, setPromoteConfirm] = useState(null);
  const [demoteConfirm,  setDemoteConfirm]  = useState(null);
  const [permissionsUser, setPermissionsUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await getAllUsers(currentUser?.user_type);

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
    if (currentUser?.user_type === 'ADMIN' && user.user_type !== 'USER') return;

    setActionError('');
    setSuccessMsg('');
    setActionId(user.userid);

    const { error: activateErr } = await activateUser(user.userid, currentUser);

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
    if (currentUser?.user_type === 'ADMIN' && user.user_type !== 'USER') return;

    setActionError('');
    setSuccessMsg('');
    setActionId(user.userid);

    const { error: deactivateErr } = await deactivateUser(user.userid, currentUser);

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

    async function handleRoleChange(newRole) {
    if (!roleModalUser) return;

    if (roleModalUser.is_seeded === true) {
      setActionError('Cannot change the role of the Seeded Superadmin.');
      setRoleModalUser(null);
      return;
    }
    
    setActionError('');
    setSuccessMsg('');
    setActionId(roleModalUser.userid);

    const { error: roleErr } = await changeUserRole(
      roleModalUser.userid,
      newRole,
      currentUser
    );

    setActionId(null);
    setRoleModalUser(null);

    if (roleErr) {
      setActionError(roleErr.message ?? 'Failed to change role. Please try again.');
      return;
    }

    // Refetch users to get updated user_type and is_seeded
    await fetchUsers();
    setSuccessMsg(`"${roleModalUser.username ?? roleModalUser.userid}" role changed to ${newRole}.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  // Sort: SUPERADMIN first, then ADMIN, then USER; within each type by username
  const sorted = [...users].sort((a, b) => {
    // For SUPERADMIN: sort by type order then username
    // For ADMIN: all rows are USER type, sort by username only
    if (currentUser?.user_type === 'SUPERADMIN') {
      const typeOrder = { SUPERADMIN: 0, ADMIN: 1, USER: 2 };
      const ta = typeOrder[a.user_type] ?? 3;
      const tb = typeOrder[b.user_type] ?? 3;
      if (ta !== tb) return ta - tb;
    }
    return (a.username ?? '').localeCompare(b.username ?? '');
  });

  return (
    <div className="p-6">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              {currentUser?.user_type === 'SUPERADMIN'
                ? 'Oversee system access levels and operational status. SUPERADMIN accounts cannot be modified.'
                : 'Manage registered user accounts. Activate or deactivate USER accounts.'}
            </p>
          </div>
        </div>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  {showUserStamp && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Stamp</th>
                  )}
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
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {user.email ?? <span className="text-gray-300 italic">No email</span>}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <TypeBadge user={user} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={user.record_status} />
                      </td>
                      {showUserStamp && (
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono max-w-[200px]">
                          <span className="block truncate" title={user.stamp ?? ''}>
                            {user.stamp ?? '—'}
                          </span>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">

                          {/* Activate button */}
                          <div title={getTooltip(user)} className="inline-block">
                            <button
                              onClick={() => handleActivate(user)}
                              disabled={isSameLevelRestricted(user) || superadminRow || isUpdating || isActive}
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
                          <div title={getTooltip(user)} className="inline-block">
                            <button
                              onClick={() => handleDeactivate(user)}
                              disabled={isSameLevelRestricted(user) || superadminRow || isUpdating || !isActive}
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                superadminRow || !isActive
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-red-500 hover:bg-red-50 hover:text-red-700'
                              }`}
                            >
                              {isUpdating ? '…' : 'Deactivate'}
                            </button>
                          </div>

                          {/* Change Role button (only if not seeded) */}
                          {!user.is_seeded && (
                            <button
                              onClick={() => setRoleModalUser(user)}
                              disabled={actionId === user.userid || isSameLevelRestricted(user)}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg text-purple-600 hover:bg-purple-50 hover:text-purple-800 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed"
                            >
                              Change Role
                            </button>
                          )}

                          {/* Permissions button – shown for all rows except Seeded Superadmin */}
                          {!user.is_seeded && (
                            <button
                              onClick={() => setPermissionsUser(user)}
                              disabled={isUpdating || isSameLevelRestricted(user)}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:text-gray-300"
                            >
                              Permissions
                            </button>
                          )}

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

      {/* Change Role Modal */}
      {roleModalUser && (
        <ChangeRoleModal
          user={roleModalUser}
          currentUser={currentUser}
          onClose={() => setRoleModalUser(null)}
          onSuccess={handleRoleChange}
        />
      )}

      {permissionsUser && (
      <FeaturePermissionsPanel
        targetUser={permissionsUser}
        currentUser={currentUser}
        onClose={() => setPermissionsUser(null)}
      />
    )}

    </div>
  );
}