// src/components/admin/FeaturePermissionsPanel.jsx
import { useState, useEffect } from 'react';
import { getUserPermissions, updateUserPermission } from '../../services/userService';

const ALL_RIGHTS_CONFIG = [
  { id: 'PRD_ADD',  label: 'Add Products',    icon: '📦', elevated: false },
  { id: 'PRD_EDIT', label: 'Edit Products',   icon: '✏️', elevated: false },
  { id: 'PRD_DEL',  label: 'Delete Products', icon: '🗑', elevated: true },
  { id: 'REP_001',  label: 'Product Report',  icon: '📊', elevated: false },
  { id: 'REP_002',  label: 'Top Selling',     icon: '🏆', elevated: true },
  { id: 'ADM_USER', label: 'Manage Users',    icon: '👥', elevated: false },
];

// Allowed rights for different actor & target combinations
function getAllowedRights(actor, targetUser) {
  const isAdmin = actor?.user_type === 'ADMIN';
  const isSuperAdmin = actor?.user_type === 'SUPERADMIN';
  const targetIsUser = targetUser?.user_type === 'USER';

  if (isAdmin && targetIsUser) {
    // Admin can only manage Add, Edit, Product Report for USER accounts
    return ['PRD_ADD', 'PRD_EDIT', 'REP_001'];
  }
  if (isSuperAdmin) {
    // Superadmin (Seeded or Authorized) sees all rights for any target
    return ALL_RIGHTS_CONFIG.map(r => r.id);
  }
  return []; // No permissions for others
}

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
      } ${enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

export default function FeaturePermissionsPanel({ targetUser, currentUser, onClose }) {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const allowedRightIds = getAllowedRights(currentUser, targetUser);
  const allowedRights = ALL_RIGHTS_CONFIG.filter(r => allowedRightIds.includes(r.id));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: err } = await getUserPermissions(targetUser.userid);
      if (cancelled) return;
      if (err) setError('Failed to load permissions.');
      else setPermissions(data);
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

  // If the actor is not allowed to manage any rights, close panel
  if (allowedRights.length === 0) {
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold">Feature Permissions</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Override for {targetUser.username ?? targetUser.userid}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded text-xs text-blue-700">
            ℹ Toggles override the user's role defaults. Changes are immediate – user must re‑login to see effect.
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {error && <div className="bg-red-50 p-3 text-red-700 text-sm rounded">{error}</div>}
          {success && <div className="bg-green-50 p-3 text-green-700 text-sm rounded">{success}</div>}
          {loading && <div className="flex justify-center py-10"><div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"/></div>}
          {!loading && permissions && allowedRights.map(right => {
            const enabled = permissions[right.id] === 1;
            const isSaving = saving === right.id;
            return (
              <div key={right.id} className={`flex justify-between items-center p-4 rounded-xl border ${enabled ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="flex gap-3">
                  <span className="text-xl">{right.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{right.label}</p>
                      {right.elevated && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Elevated</span>}
                    </div>
                    <p className="text-xs text-gray-500">Toggle to override role default.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isSaving && <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"/>}
                  <span className={`text-xs font-semibold w-12 text-right ${enabled ? 'text-blue-600' : 'text-gray-400'}`}>
                    {enabled ? 'Allowed' : 'Blocked'}
                  </span>
                  <Toggle enabled={enabled} disabled={isSaving} onChange={() => handleToggle(right.id, permissions[right.id] ?? 0)} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t flex justify-between">
          <p className="text-xs text-gray-400">User must re‑login for changes to apply.</p>
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Done</button>
        </div>
      </div>
    </div>
  );
}