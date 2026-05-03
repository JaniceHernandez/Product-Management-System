// src/components/admin/FeaturePermissionsPanel.jsx
import { useState, useEffect } from 'react';
import { getUserPermissions, updateUserPermission } from '../../services/userService';
import { ROLE_RIGHTS_DEFAULTS } from '../../utils/roleDefaults';

// SVG icon components — consistent 18×18, stroke-based, pink-neutral
const Icons = {
  AddProducts: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      <path d="M12 12v4m-2-2h4" />
    </svg>
  ),
  EditProducts: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      <path d="M19.5 7.125L16.875 4.5" />
    </svg>
  ),
  DeleteProducts: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  ProductReport: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  TopSelling: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  ManageUsers: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
};

const ALL_RIGHTS_CONFIG = [
  { id: 'PRD_ADD',  label: 'Add Products',    Icon: Icons.AddProducts,    elevated: false },
  { id: 'PRD_EDIT', label: 'Edit Products',   Icon: Icons.EditProducts,   elevated: false },
  { id: 'PRD_DEL',  label: 'Delete Products', Icon: Icons.DeleteProducts, elevated: true  },
  { id: 'REP_001',  label: 'Product Report',  Icon: Icons.ProductReport,  elevated: false },
  { id: 'REP_002',  label: 'Top Selling',     Icon: Icons.TopSelling,     elevated: true  },
  { id: 'ADM_USER', label: 'Manage Users',    Icon: Icons.ManageUsers,    elevated: false },
];

function getAllowedRights(actor, targetUser) {
  const isAdmin      = actor?.user_type === 'ADMIN';
  const isSuperAdmin = actor?.user_type === 'SUPERADMIN';
  const targetIsUser = targetUser?.user_type === 'USER';

  if (isAdmin && targetIsUser) return ['PRD_ADD', 'PRD_EDIT', 'REP_001'];
  if (isSuperAdmin)            return ALL_RIGHTS_CONFIG.map(r => r.id);
  return [];
}

// Pink-themed toggle — replaces bg-blue-600
function Toggle({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
      }`}
      style={
        enabled
          ? { background: 'linear-gradient(135deg,#f43f5e,#ec4899)' }
          : { background: '#e5e7eb' }
      }
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function FeaturePermissionsPanel({ targetUser, currentUser, onClose }) {
  const [permissions, setPermissions] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(null);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  const allowedRightIds = getAllowedRights(currentUser, targetUser);
  const defaultRights   = ROLE_RIGHTS_DEFAULTS[targetUser.user_type] || {};
  const allowedRights   = ALL_RIGHTS_CONFIG.filter(
    r => allowedRightIds.includes(r.id) && defaultRights[r.id] === 1
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: err } = await getUserPermissions(targetUser.userid);
      if (cancelled) return;
      if (err) setError('Failed to load permissions.');
      else     setPermissions(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [targetUser.userid]);

  async function handleToggle(rightId, currentValue) {
    const newValue = currentValue === 1 ? 0 : 1;
    setPermissions(prev => ({ ...prev, [rightId]: newValue }));
    setSaving(rightId);
    setError('');
    setSuccess('');

    const { error: err } = await updateUserPermission(
      targetUser.userid, rightId, newValue, currentUser
    );
    setSaving(null);

    if (err) {
      setPermissions(prev => ({ ...prev, [rightId]: currentValue }));
      setError(err.message || 'Update failed.');
    } else {
      const label = allowedRights.find(r => r.id === rightId)?.label ?? rightId;
      setSuccess(`${label} ${newValue === 1 ? 'allowed' : 'blocked'}.`);
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  if (allowedRights.length === 0) {
    onClose();
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        style={{ border: '1px solid rgba(244,63,94,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#fce7f3,#fdf2f8)' }}
              >
                {/* Shield / permissions icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ec4899" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Feature Permissions</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Override for{' '}
                  <span className="font-semibold text-gray-700">{targetUser.username ?? targetUser.userid}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-xl leading-none transition-colors"
            >
              ×
            </button>
          </div>

          {/* Info banner — pink-tinted instead of blue */}
          <div
            className="mt-3 p-3 rounded-xl text-xs"
            style={{
              background: 'linear-gradient(135deg,#fff5f7,#fdf2f8)',
              border: '1px solid rgba(244,63,94,0.15)',
              color: '#be185d',
            }}
          >
            ℹ Toggles override the user's role defaults. Changes are immediate — user must re‑login to see effect.
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">{success}</div>
          )}

          {loading && (
            <div className="flex justify-center py-10">
              <div
                className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full"
                style={{ borderColor: '#ec4899', borderTopColor: 'transparent' }}
              />
            </div>
          )}

          {!loading && permissions && allowedRights.map(right => {
            const enabled  = permissions[right.id] === 1;
            const isSaving = saving === right.id;

            return (
              <div
                key={right.id}
                className={`flex justify-between items-center p-4 rounded-xl border transition-colors ${
                  enabled
                    ? 'bg-white border-gray-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex gap-3 items-center">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg,#fce7f3,#fdf2f8)',
                      color: '#ec4899',
                    }}
                  >
                    <right.Icon />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{right.label}</p>
                      {right.elevated && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                          Elevated
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Toggle to override role default.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isSaving && (
                    <div
                      className="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full"
                      style={{ borderColor: '#ec4899', borderTopColor: 'transparent' }}
                    />
                  )}
                  <span
                    className="text-xs font-semibold w-12 text-right"
                    style={{ color: enabled ? '#ec4899' : '#9ca3af' }}
                  >
                    {enabled ? 'Allowed' : 'Blocked'}
                  </span>
                  <Toggle
                    enabled={enabled}
                    disabled={isSaving}
                    onChange={() => handleToggle(right.id, permissions[right.id] ?? 0)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center sticky bottom-0 bg-white">
          <p className="text-xs text-gray-400">User must re‑login for changes to apply.</p>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}