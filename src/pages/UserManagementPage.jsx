// src/pages/UserManagementPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRights } from '../hooks/useRights';
import { getAllUsers, activateUser, deactivateUser, changeUserRole } from '../services/userService';
import { useSuperAdminGuard } from '../hooks/useSuperAdminGuard';
import { useStampVisibility } from '../hooks/useStampVisibility';
import ChangeRoleModal from '../components/admin/ChangeRoleModal';
import FeaturePermissionsPanel from '../components/admin/FeaturePermissionsPanel';

// ── Icon components ──────────────────────────────────────────────────────────
function IconActivate() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 14, height: 14 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconDeactivate() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 14, height: 14 }}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconRole() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 14, height: 14 }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconPermissions() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 14, height: 14 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

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

function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 24, height: 24 }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// ── TypeBadge ────────────────────────────────────────────────────────────────
function TypeBadge({ user }) {
  const isSuperAdmin = user.user_type === 'SUPERADMIN';
  if (isSuperAdmin && user.is_seeded) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-800 text-white">
        SUPERADMIN
      </span>
    );
  }
  if (isSuperAdmin && !user.is_seeded) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
        AUTHORIZED SUPERADMIN
      </span>
    );
  }
  if (user.user_type === 'ADMIN') {
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

// ── Tooltip icon button ──────────────────────────────────────────────────────
function ActionButton({ onClick, disabled, tooltip, colorClass, disabledClass, children }) {
  return (
    <div className="relative group/btn">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
          disabled ? `cursor-not-allowed ${disabledClass || 'text-gray-300'}` : colorClass
        }`}
      >
        {children}
      </button>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 pointer-events-none
          opacity-0 group-hover/btn:opacity-100 transition-opacity duration-150">
          <div className="bg-gray-800 text-white text-[11px] font-medium rounded-md px-2 py-1 whitespace-nowrap shadow-lg">
            {tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ activeTab, searchTerm, roleFilter }) {
  const hasFilters = searchTerm || roleFilter;
  return (
    <div className="text-center py-20 text-gray-400">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-300">
        <IconUsers />
      </div>
      <p className="font-semibold text-gray-500 text-sm">
        {hasFilters ? 'No users match your filters' : `No ${activeTab === 'Active' ? 'active' : 'inactive'} users`}
      </p>
      <p className="text-xs mt-1 text-gray-400">
        {hasFilters
          ? 'Try adjusting your search or role filter.'
          : activeTab === 'Active'
            ? 'All users are currently inactive.'
            : 'No users have been deactivated.'}
      </p>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function UserManagementPage() {
  const { currentUser } = useAuth();
  const { showUserStamp } = useStampVisibility();
  const { getRowClass, isProtectedRow, getTooltip } = useSuperAdminGuard();

  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [actionId, setActionId]         = useState(null);
  const [actionError, setActionError]   = useState('');
  const [successMsg, setSuccessMsg]     = useState('');
  const [roleModalUser, setRoleModalUser]   = useState(null);
  const [permissionsUser, setPermissionsUser] = useState(null);

  // Tab & filter state
  const [activeTab, setActiveTab]   = useState('Active');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isSameLevelRestricted = (targetUser) => {
    if (!currentUser) return false;
    const isAuthorizedSA = currentUser.user_type === 'SUPERADMIN' && currentUser.is_seeded === false;
    const targetIsAuthorizedSA = targetUser.user_type === 'SUPERADMIN' && targetUser.is_seeded === false;
    return isAuthorizedSA && targetIsAuthorizedSA;
  };

  // ── Data fetch ─────────────────────────────────────────────────────────────
  useEffect(() => { fetchUsers(); }, []);

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

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleActivate(user) {
    if (isProtectedRow(user) || isSameLevelRestricted(user)) return;
    if (currentUser?.user_type === 'ADMIN' && user.user_type !== 'USER') return;
    setActionId(user.userid);
    const { error: err } = await activateUser(user.userid, currentUser);
    setActionId(null);
    if (err) {
      setActionError(err.message || 'Activation failed.');
    } else {
      setUsers(prev => prev.map(u =>
        u.userid === user.userid ? { ...u, record_status: 'ACTIVE' } : u
      ));
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
      setUsers(prev => prev.map(u =>
        u.userid === user.userid ? { ...u, record_status: 'INACTIVE' } : u
      ));
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

  // ── Derived data ───────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    return [...users].sort((a, b) => {
      if (currentUser?.user_type === 'SUPERADMIN') {
        const order = { SUPERADMIN: 0, ADMIN: 1, USER: 2 };
        return (
          (order[a.user_type] || 3) - (order[b.user_type] || 3) ||
          (a.username || '').localeCompare(b.username || '')
        );
      }
      return (a.username || '').localeCompare(b.username || '');
    });
  }, [users, currentUser]);

  const activeUsers   = useMemo(() => sorted.filter(u => u.record_status === 'ACTIVE'),   [sorted]);
  const inactiveUsers = useMemo(() => sorted.filter(u => u.record_status === 'INACTIVE'), [sorted]);

  const allRoles = useMemo(() => {
    const roles = [...new Set(sorted.map(u => u.user_type).filter(Boolean))];
    return roles.sort();
  }, [sorted]);

  const tabUsers = activeTab === 'Active' ? activeUsers : inactiveUsers;

  const displayed = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tabUsers.filter(u => {
      const matchesSearch =
        !term ||
        (u.username || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        `${u.firstname || ''} ${u.lastname || ''}`.toLowerCase().includes(term);
      const matchesRole = !roleFilter || u.user_type === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [tabUsers, searchTerm, roleFilter]);

  const tabCounts = {
    Active:   activeUsers.length,
    Inactive: inactiveUsers.length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-full">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-400 mt-1">
          {currentUser?.user_type === 'SUPERADMIN'
            ? 'Oversee system access levels and permissions. SUPERADMIN accounts cannot be modified.'
            : 'Manage registered user accounts. Activate or deactivate USER accounts.'}
        </p>
      </div>

      {/* Flash messages */}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
          <span>✓</span> {successMsg}
        </div>
      )}
      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {actionError}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-3">
          <span>{error}</span>
          <button onClick={fetchUsers} className="underline ml-auto shrink-0">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-pink-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Tabs + Search + Role filter row */}
          <div className="flex flex-wrap items-center gap-3 mb-5">

            {/* Tabs */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {['Active', 'Inactive'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab
                      ? 'bg-pink-100 text-pink-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {tabCounts[tab]}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <IconSearch />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
              />
            </div>

            {/* Role filter */}
            {allRoles.length > 0 && (
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
              >
                <option value="">All Roles</option>
                {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
          </div>

          {/* Table or empty state */}
          {displayed.length === 0 ? (
            <EmptyState activeTab={activeTab} searchTerm={searchTerm} roleFilter={roleFilter} />
          ) : (
            <div
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
              style={{ border: '1px solid rgba(0,0,0,0.07)' }}
            >
              <div className="overflow-x-auto lg:overflow-x-visible">
                <table className="w-full text-sm lg:table-fixed">
                  <colgroup className="hidden lg:table-column-group">
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '32%' }} />
                    <col style={{ width: '20%' }} />
                    {showUserStamp && <col style={{ width: '12%' }} />}
                    <col style={{ width: showUserStamp ? '8%' : '20%' }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: 'linear-gradient(to bottom, #fafafa, #f5f5f5)', borderBottom: '1px solid #f0f0f0' }}>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                        Username
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                        Role
                      </th>
                      {showUserStamp && (
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest w-52">
                          Stamp
                        </th>
                      )}
                      <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-widest w-32">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-50">
                    {displayed.map(user => {
                      const superadminRow = isProtectedRow(user);
                      const isCurrentUser = user.userid === currentUser?.userid;
                      const isUpdating    = actionId === user.userid;
                      const isActive      = user.record_status === 'ACTIVE';
                      const disabled      = isSameLevelRestricted(user) || superadminRow;

                      // Tooltip text for locked rows
                      const lockTooltip = disabled
                        ? 'Superadmin accounts cannot be modified'
                        : undefined;

                      return (
                        <tr
                          key={user.userid}
                          className={`transition-colors ${
                            disabled
                              ? 'opacity-60 bg-gray-50/60'
                              : 'hover:bg-pink-50/40'
                          }`}
                        >
                          {/* Username */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800 text-sm">
                                {user.username || '—'}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] text-blue-500 font-semibold bg-blue-50 px-1.5 py-0.5 rounded-full">
                                  you
                                </span>
                              )}
                              {disabled && (
                                <span className="text-[10px] text-gray-400 font-medium" title="Superadmin accounts cannot be modified">
                                  🔒
                                </span>
                              )}
                            </div>
                            {(user.firstname || user.lastname) && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {[user.firstname, user.lastname].filter(Boolean).join(' ')}
                              </p>
                            )}
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3.5 text-sm text-gray-500 lg:max-w-0">
                            <span className="lg:block lg:truncate" title={user.email || ''}>
                              {user.email || <span className="text-gray-300 italic text-xs">No email</span>}
                            </span>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-3.5">
                            <TypeBadge user={user} />
                          </td>

                          {/* Stamp */}
                          {showUserStamp && (
                            <td className="px-4 py-3.5 text-xs text-gray-400 font-mono max-w-[200px]">
                              <span className="block truncate" title={user.stamp ?? ''}>
                                {user.stamp || '—'}
                              </span>
                            </td>
                          )}

                          {/* Actions */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-1">

                              {/* Active tab → show Deactivate */}
                              {activeTab === 'Active' && (
                                <ActionButton
                                  onClick={() => handleDeactivate(user)}
                                  disabled={disabled || isUpdating}
                                  tooltip={lockTooltip || 'Deactivate user'}
                                  colorClass="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                  disabledClass="text-gray-200"
                                >
                                  {isUpdating
                                    ? <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                                    : <IconDeactivate />}
                                </ActionButton>
                              )}

                              {/* Inactive tab → show Activate */}
                              {activeTab === 'Inactive' && (
                                <ActionButton
                                  onClick={() => handleActivate(user)}
                                  disabled={disabled || isUpdating}
                                  tooltip={lockTooltip || 'Activate user'}
                                  colorClass="text-gray-400 hover:text-green-600 hover:bg-green-50"
                                  disabledClass="text-gray-200"
                                >
                                  {isUpdating
                                    ? <span className="w-3.5 h-3.5 border-2 border-green-300 border-t-transparent rounded-full animate-spin" />
                                    : <IconActivate />}
                                </ActionButton>
                              )}

                              {/* Change Role — SUPERADMIN only, not seeded rows */}
                              {currentUser?.user_type !== 'ADMIN' && !user.is_seeded && (
                                <ActionButton
                                  onClick={() => setRoleModalUser(user)}
                                  disabled={disabled || isUpdating}
                                  tooltip={lockTooltip || 'Change role'}
                                  colorClass="text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                                  disabledClass="text-gray-200"
                                >
                                  <IconRole />
                                </ActionButton>
                              )}

                              {/* Permissions — visible to ADMIN (USER rows only) and SUPERADMIN */}
                              {((currentUser?.user_type === 'ADMIN' && user.user_type === 'USER') ||
                                currentUser?.user_type !== 'ADMIN') &&
                                !user.is_seeded && (
                                  <ActionButton
                                    onClick={() => setPermissionsUser(user)}
                                    disabled={disabled || isUpdating}
                                    tooltip={lockTooltip || 'Edit permissions'}
                                    colorClass="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    disabledClass="text-gray-200"
                                  >
                                    <IconPermissions />
                                  </ActionButton>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Showing{' '}
                  <span className="font-semibold text-gray-600">{displayed.length}</span>
                  {' '}of{' '}
                  <span className="font-semibold text-gray-600">{tabUsers.length}</span>
                  {' '}{activeTab.toLowerCase()} user{tabUsers.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-400 hidden sm:block">
                  {sorted.length} total · {activeUsers.length} active · {inactiveUsers.length} inactive
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
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