// src/components/admin/ChangeRoleModal.jsx
// Modal for SUPERADMIN to change a user's role.
// Shows the target user's current role, a role selector, and a
// summary of what rights the new role will grant before confirming.
import { useState } from 'react';
import { ROLE_RIGHTS_DEFAULTS, RIGHT_LABELS } from '../../utils/roleDefaults';

const ROLE_OPTIONS = [
  {
    value:       'ADMIN',
    label:       'ADMIN',
    description: 'Can manage products, view all reports. Cannot delete products or manage users.',
    color:       'blue',
  },
  {
    value:       'USER',
    label:       'USER',
    description: 'Standard user. Can add and edit products, view the product report.',
    color:       'gray',
  },
];

const COLOR = {
  blue: { ring: 'border-blue-500 bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
  gray: { ring: 'border-gray-400 bg-gray-50',  badge: 'bg-gray-100 text-gray-600' },
};

export default function ChangeRoleModal({ user, onClose, onSuccess }) {
  const [selectedRole, setSelectedRole]   = useState(user.user_type === 'ADMIN' ? 'USER' : 'ADMIN');
  const [submitting,   setSubmitting]     = useState(false);
  const [error,        setError]          = useState('');

  const previewRights = ROLE_RIGHTS_DEFAULTS[selectedRole] ?? {};
  const noChange      = selectedRole === user.user_type;

  async function handleConfirm() {
    if (noChange) return;
    setError('');
    setSubmitting(true);
    await onSuccess(selectedRole);
    setSubmitting(false);
  }

  return (
    // Backdrop
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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none mt-0.5"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Current role */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500 shrink-0">Current role:</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
              ${user.user_type === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              {user.user_type}
            </span>
          </div>

          {/* Role selector */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Select new role</p>
            <div className="space-y-3">
              {ROLE_OPTIONS.map(option => {
                const isSelected = selectedRole === option.value;
                const colors     = COLOR[option.color];
                return (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors
                      ${isSelected ? colors.ring : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={isSelected}
                      onChange={() => setSelectedRole(option.value)}
                      className="mt-0.5 shrink-0 accent-blue-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors.badge}`}>
                          {option.label}
                        </span>
                        {option.value === user.user_type && (
                          <span className="text-xs text-gray-400 italic">current</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rights preview */}
          {!noChange && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Rights granted with <span className={selectedRole === 'ADMIN' ? 'text-blue-600' : 'text-gray-700'}>{selectedRole}</span> role
              </p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {Object.entries(previewRights).map(([rightId, value]) => (
                  <div key={rightId} className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      value === 1
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-50 text-red-400'
                    }`}>
                      {value === 1 ? '✓' : '✕'}
                    </span>
                    <span className="text-xs text-gray-600">{RIGHT_LABELS[rightId] ?? rightId}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-amber-600 mt-3 flex items-start gap-1.5">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>All existing rights will be reset to the defaults for <strong>{selectedRole}</strong>.</span>
              </p>
            </div>
          )}

          {/* No-change notice */}
          {noChange && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
              The selected role is the same as the current role. Choose a different role to make a change.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={noChange || submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg transition-colors flex items-center gap-2"
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