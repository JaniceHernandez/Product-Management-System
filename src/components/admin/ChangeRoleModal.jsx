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
    if (user.user_type === 'SUPERADMIN' && user.is_seeded === true) {
      allowedRoles = [];
    } else if (user.user_type === 'SUPERADMIN' && user.is_seeded === false) {
      allowedRoles = ['ADMIN'];
    } else if (user.user_type === 'ADMIN') {
      allowedRoles = ['SUPERADMIN', 'USER'];
    } else if (user.user_type === 'USER') {
      allowedRoles = ['ADMIN', 'SUPERADMIN'];
    }
  } else if (currentUser?.user_type === 'SUPERADMIN') {
    if (user.user_type === 'ADMIN') allowedRoles = ['USER'];
    else if (user.user_type === 'USER') allowedRoles = ['ADMIN'];
  } else if (currentUser?.user_type === 'ADMIN' && user.user_type === 'USER') {
    allowedRoles = ['ADMIN'];
  }

  if (allowedRoles.length === 0) {
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

  const roleMeta = (role) => {
    switch (role) {
      case 'SUPERADMIN': return { label: 'SUPERADMIN', desc: 'Full system access' };
      case 'ADMIN':      return { label: 'ADMIN',      desc: 'Manage products, view reports' };
      default:           return { label: 'USER',       desc: 'Standard user' };
    }
  };

  // Pink-system color map — matches the app's primary palette
  const roleColors = {
    SUPERADMIN: {
      ring:  'border-pink-400 bg-pink-50',
      badge: 'bg-pink-100 text-pink-700',
    },
    ADMIN: {
      ring:  'border-rose-400 bg-rose-50',
      badge: 'bg-rose-100 text-rose-700',
    },
    USER: {
      ring:  'border-gray-300 bg-gray-50',
      badge: 'bg-gray-100 text-gray-600',
    },
  };

  const currentRoleBadge = () => {
    if (user.user_type === 'SUPERADMIN') {
      return user.is_seeded
        ? 'bg-pink-600 text-white'
        : 'bg-pink-100 text-pink-700';
    }
    if (user.user_type === 'ADMIN') return 'bg-rose-100 text-rose-700';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ border: '1px solid rgba(244,63,94,0.15)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#fce7f3,#fdf2f8)' }}
            >
              {/* Person + shield icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ec4899" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Change User Role</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Updating role for{' '}
                <span className="font-semibold text-gray-700">{user.username ?? user.userid}</span>
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

        <div className="px-6 py-5 space-y-5">
          {/* Current role */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <span className="text-xs text-gray-500 shrink-0">Current role:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${currentRoleBadge()}`}>
              {user.user_type === 'SUPERADMIN'
                ? (user.is_seeded ? 'SUPERADMIN' : 'AUTHORIZED SUPERADMIN')
                : user.user_type}
            </span>
          </div>

          {/* Role selector */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Select new role</p>
            <div className="space-y-3">
              {allowedRoles.map(roleValue => {
                const meta = roleMeta(roleValue);
                const isSelected = selectedRole === roleValue;
                const colors = roleColors[roleValue] ?? roleColors.USER;
                return (
                  <label
                    key={roleValue}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      isSelected ? colors.ring : 'border-gray-200 bg-white hover:border-pink-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={roleValue}
                      checked={isSelected}
                      onChange={() => setSelectedRole(roleValue)}
                      className="mt-0.5 shrink-0 accent-pink-500"
                    />
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors.badge}`}>
                        {meta.label}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{meta.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rights preview */}
          {selectedRole !== user.user_type && selectedRole && (
            <div
              className="rounded-xl p-4"
              style={{ background: 'linear-gradient(135deg,#fff5f7,#fdf2f8)', border: '1px solid rgba(244,63,94,0.1)' }}
            >
              <p className="text-[10px] font-bold text-pink-600 uppercase tracking-widest mb-3">
                Rights granted with {selectedRole}
              </p>
              <div className="grid grid-cols-2 gap-y-2">
                {Object.entries(previewRights).map(([rightId, value]) => (
                  <div key={rightId} className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                        value === 1 ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-400'
                      }`}
                    >
                      {value === 1 ? '✓' : '✕'}
                    </span>
                    <span className="text-xs text-gray-600">{RIGHT_LABELS[rightId] ?? rightId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-6 pt-2 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedRole === user.user_type || submitting || !selectedRole}
            className="text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-50 hover:opacity-90 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)' }}
          >
            {submitting && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {submitting ? 'Updating…' : `Change to ${selectedRole}`}
          </button>
        </div>
      </div>
    </div>
  );
}