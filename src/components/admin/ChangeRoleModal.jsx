// src/components/admin/ChangeRoleModal.jsx
import { useState } from 'react';
import { ROLE_RIGHTS_DEFAULTS, RIGHT_LABELS } from '../../utils/roleDefaults';

export default function ChangeRoleModal({ user, currentUser, onClose, onSuccess }) {
  const [selectedRole, setSelectedRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isSeededSA = currentUser?.isSeededSuperAdmin === true;

  // Determine allowed roles
  let allowedRoles = [];
  if (isSeededSA) {
    // Seeded Superadmin cannot change its own row (button already hidden)
    if (user.user_type === 'SUPERADMIN' && user.is_seeded === true) {
      allowedRoles = []; // should never happen because button hidden
    } else if (user.user_type === 'SUPERADMIN' && user.is_seeded === false) {
      allowedRoles = ['ADMIN']; // demote Authorized SA -> ADMIN
    } else if (user.user_type === 'ADMIN') {
      allowedRoles = ['SUPERADMIN', 'USER'];
    } else if (user.user_type === 'USER') {
      allowedRoles = ['ADMIN', 'SUPERADMIN'];
    }
  } else if (currentUser?.user_type === 'SUPERADMIN') {
    // Authorized SA can only toggle between ADMIN and USER
    if (user.user_type === 'ADMIN') allowedRoles = ['USER'];
    else if (user.user_type === 'USER') allowedRoles = ['ADMIN'];
  } else if (currentUser?.user_type === 'ADMIN' && user.user_type === 'USER') {
    allowedRoles = ['ADMIN'];
  }

  // Fallback – if still empty, show nothing and close
  if (allowedRoles.length === 0) {
    console.warn('[ChangeRoleModal] No roles allowed – closing');
    return null;
  }

  if (!selectedRole && allowedRoles.length > 0) {
    setSelectedRole(allowedRoles[0]);
  }

  const previewRights = ROLE_RIGHTS_DEFAULTS[selectedRole] || {};

  async function handleConfirm() {
    if (selectedRole === user.user_type) {
      onClose();
      return;
    }
    setError('');
    setSubmitting(true);
    await onSuccess(selectedRole);
    setSubmitting(false);
  }

  // Helper for UI rendering
  const roleMeta = (role) => {
    switch (role) {
      case 'SUPERADMIN': return { label: 'SUPERADMIN', color: 'purple', desc: 'Full system access' };
      case 'ADMIN': return { label: 'ADMIN', color: 'blue', desc: 'Manage products, view reports' };
      default: return { label: 'USER', color: 'gray', desc: 'Standard user' };
    }
  };

  const colorClasses = {
    purple: { ring: 'border-purple-500 bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
    blue:   { ring: 'border-blue-500 bg-blue-50',   badge: 'bg-blue-100 text-blue-700' },
    gray:   { ring: 'border-gray-400 bg-gray-50',   badge: 'bg-gray-100 text-gray-600' },
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Change User Role</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Updating role for <span className="font-semibold text-gray-700">{user.username ?? user.userid}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Current role display */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500 shrink-0">Current role:</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
              ${user.user_type === 'SUPERADMIN' 
                ? (user.is_seeded ? 'bg-purple-800 text-white' : 'bg-purple-100 text-purple-700')
                : user.user_type === 'ADMIN' 
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
              {user.user_type === 'SUPERADMIN'
                ? (user.is_seeded ? 'SUPERADMIN' : 'AUTHORIZED SUPERADMIN')
                : user.user_type}
            </span>
          </div>

          {/* Role selector */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Select new role</p>
            <div className="space-y-3">
              {allowedRoles.map(roleValue => {
                const meta = roleMeta(roleValue);
                const isSelected = selectedRole === roleValue;
                const colors = colorClasses[meta.color];
                return (
                  <label key={roleValue} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${isSelected ? colors.ring : 'border-gray-200 bg-white'}`}>
                    <input type="radio" name="role" value={roleValue} checked={isSelected} onChange={() => setSelectedRole(roleValue)} className="mt-0.5 shrink-0" />
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors.badge}`}>{meta.label}</span>
                      <p className="text-xs text-gray-500 mt-1">{meta.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rights preview */}
          {selectedRole !== user.user_type && selectedRole && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Rights granted with {selectedRole}</p>
              <div className="grid grid-cols-2 gap-y-2 mt-2">
                {Object.entries(previewRights).map(([rightId, value]) => (
                  <div key={rightId} className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${value === 1 ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-400'}`}>
                      {value === 1 ? '✓' : '✕'}
                    </span>
                    <span className="text-xs text-gray-600">{RIGHT_LABELS[rightId] ?? rightId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className="bg-red-50 border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
          <button onClick={onClose} disabled={submitting} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleConfirm} disabled={selectedRole === user.user_type || submitting || !selectedRole} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg flex items-center gap-2">
            {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? 'Updating…' : `Change to ${selectedRole}`}
          </button>
        </div>
      </div>
    </div>
  );
}