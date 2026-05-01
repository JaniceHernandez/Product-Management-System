import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRights } from '../hooks/useRights';
import { getAllUsers, activateUser, deactivateUser, changeUserRole } from '../services/userService';
import { useSuperAdminGuard } from '../hooks/useSuperAdminGuard';
import { useStampVisibility } from '../hooks/useStampVisibility';
import ChangeRoleModal from '../components/admin/ChangeRoleModal';
import FeaturePermissionsPanel from '../components/admin/FeaturePermissionsPanel';

function StatusBadge({ status }) {
  const isActive = status === 'ACTIVE';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
    }`}>
      {isActive ? '● Active' : '● Inactive'}
    </span>
  );
}

function TypeBadge({ user }) {
  const isSuperAdmin = user.user_type === 'SUPERADMIN';
  if (isSuperAdmin && user.is_seeded) {
    return <span className="bg-purple-800 text-white px-2 py-0.5 rounded-full text-xs font-medium">SUPERADMIN</span>;
  }
  if (isSuperAdmin && !user.is_seeded) {
    return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">AUTHORIZED SUPERADMIN</span>;
  }
  if (user.user_type === 'ADMIN') {
    return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">ADMIN</span>;
  }
  return <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">USER</span>;
}

export default function UserManagementPage() {
  const { currentUser } = useAuth();
  const { showUserStamp } = useStampVisibility();
  const { getRowClass, isProtectedRow, getTooltip } = useSuperAdminGuard();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [permissionsUser, setPermissionsUser] = useState(null);

  // Helper: Authorized SA cannot modify another Authorized SA
  const isSameLevelRestricted = (targetUser) => {
    if (!currentUser) return false;
    const isAuthorizedSA = currentUser.user_type === 'SUPERADMIN' && currentUser.is_seeded === false;
    const targetIsAuthorizedSA = targetUser.user_type === 'SUPERADMIN' && targetUser.is_seeded === false;
    return isAuthorizedSA && targetIsAuthorizedSA;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error: fetchError } = await getAllUsers(currentUser?.user_type);
    if (fetchError) {
      setError('Failed to load users. Please try again.');
    } else {
      setUsers(data);
    }
    setLoading(false);
  }

  async function handleActivate(user) {
    if (isProtectedRow(user) || isSameLevelRestricted(user)) return;
    if (currentUser?.user_type === 'ADMIN' && user.user_type !== 'USER') return;
    setActionId(user.userid);
    const { error: err } = await activateUser(user.userid, currentUser);
    setActionId(null);
    if (err) {
      setActionError(err.message || 'Activation failed.');
    } else {
      setUsers(prev => prev.map(u => u.userid === user.userid ? { ...u, record_status: 'ACTIVE' } : u));
      setSuccessMsg(`"${user.username}" activated.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  }

  async function handleDeactivate(user) {
    if (isProtectedRow(user) || isSameLevelRestricted(user)) return;
    if (currentUser?.user_type === 'ADMIN' && user.user_type !== 'USER') return;
    setActionId(user.userid);
    const { error: err } = await deactivateUser(user.userid, currentUser);
    setActionId(null);
    if (err) {
      setActionError(err.message || 'Deactivation failed.');
    } else {
      setUsers(prev => prev.map(u => u.userid === user.userid ? { ...u, record_status: 'INACTIVE' } : u));
      setSuccessMsg(`"${user.username}" deactivated.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  }

  async function handleRoleChange(newRole) {
    if (!roleModalUser) return;
    setActionId(roleModalUser.userid);
    const { error: err } = await changeUserRole(roleModalUser.userid, newRole, currentUser);
    setActionId(null);
    setRoleModalUser(null);
    if (err) {
      setActionError(err.message || 'Role change failed.');
    } else {
      await fetchUsers();
      setSuccessMsg(`Role changed to ${newRole}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  }

  // Sort users
  const sorted = [...users].sort((a, b) => {
    if (currentUser?.user_type === 'SUPERADMIN') {
      const order = { SUPERADMIN: 0, ADMIN: 1, USER: 2 };
      return (order[a.user_type] || 3) - (order[b.user_type] || 3) ||
             (a.username || '').localeCompare(b.username || '');
    }
    return (a.username || '').localeCompare(b.username || '');
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          {currentUser?.user_type === 'SUPERADMIN'
            ? 'Oversee system access levels and permissions. SUPERADMIN accounts cannot be modified.'
            : 'Manage registered user accounts. Activate or deactivate USER accounts.'}
        </p>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
          {successMsg}
        </div>
      )}
      {actionError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {actionError}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
          <span>{error}</span>
          <button onClick={fetchUsers} className="underline">Retry</button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className="text-center py-20 text-gray-400">No users found</div>
      )}

      {!loading && !error && sorted.length > 0 && (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  {showUserStamp && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stamp</th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map(user => {
                  const superadminRow = isProtectedRow(user);
                  const isCurrentUser = user.userid === currentUser?.userid;
                  const isUpdating = actionId === user.userid;
                  const isActive = user.record_status === 'ACTIVE';
                  // ✅ DEFINE disabled HERE
                  const disabled = isSameLevelRestricted(user) || superadminRow;

                  return (
                    <tr key={user.userid} className={getRowClass(user)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{user.username || '—'}</span>
                          {isCurrentUser && <span className="text-xs text-blue-500 font-medium">(you)</span>}
                        </div>
                        {(user.firstname || user.lastname) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {[user.firstname, user.lastname].filter(Boolean).join(' ')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {user.email || <span className="text-gray-300 italic">No email</span>}
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge user={user} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.record_status} />
                      </td>
                      {showUserStamp && (
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono max-w-[200px]">
                          <span className="block truncate" title={user.stamp ?? ''}>
                            {user.stamp || '—'}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Activate */}
                          <button
                            onClick={() => handleActivate(user)}
                            disabled={disabled || isUpdating || isActive}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                              disabled || isActive
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-green-600 hover:bg-green-50 hover:text-green-800'
                            }`}
                          >
                            Activate
                          </button>
                          {/* Deactivate */}
                          <button
                            onClick={() => handleDeactivate(user)}
                            disabled={disabled || isUpdating || !isActive}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                              disabled || !isActive
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-red-500 hover:bg-red-50 hover:text-red-700'
                            }`}
                          >
                            Deactivate
                          </button>
                          {/* Change Role – only for SUPERADMIN users (never for ADMIN) */}
                          {currentUser?.user_type !== 'ADMIN' && !user.is_seeded && (
                            <button
                              onClick={() => setRoleModalUser(user)}
                              disabled={isUpdating || disabled}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg text-purple-600 hover:bg-purple-50 hover:text-purple-800 disabled:text-gray-300"
                            >
                              Change Role
                            </button>
                          )}
                          {/* Permissions – ADMIN sees only for USER rows; SUPERADMIN sees for eligible rows */}
                          {((currentUser?.user_type === 'ADMIN' && user.user_type === 'USER') ||
                            currentUser?.user_type !== 'ADMIN') && !user.is_seeded && (
                            <button
                              onClick={() => setPermissionsUser(user)}
                              disabled={isUpdating || disabled}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 disabled:text-gray-300"
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
          <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-400">
            {sorted.length} user{sorted.length !== 1 ? 's' : ''} —{' '}
            {sorted.filter(u => u.record_status === 'ACTIVE').length} active,{' '}
            {sorted.filter(u => u.record_status === 'INACTIVE').length} inactive
          </div>
        </div>
      )}

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