// src/components/products/SoftDeleteConfirmDialog.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProductRights } from '../../hooks/useProductRights';
import { softDeleteProduct } from '../../services/productService';

export default function SoftDeleteConfirmDialog({ product, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const { canDelete, rightsLoading } = useProductRights();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function handleKeyDown(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (rightsLoading) return null;
  if (!canDelete) return null;

  async function handleConfirm() {
    setError('');
    setLoading(true);
    const { error: apiError } = await softDeleteProduct(product.prodcode, currentUser);
    setLoading(false);
    if (apiError) { setError(apiError.message ?? 'Failed to delete product.'); return; }
    onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
        style={{ border: '1px solid rgba(244,63,94,0.15)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50">
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4h6v2" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-800">Delete Product</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-xl leading-none transition-colors">×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 mb-4">
            <p className="text-xs text-gray-500 mb-0.5">Product</p>
            <p className="font-mono font-bold text-gray-800 text-sm">{product?.prodcode}</p>
            <p className="text-sm text-gray-600 mt-0.5">{product?.description}</p>
          </div>

          <p className="text-sm text-gray-600">
            This product will be <strong>hidden</strong> from all users but not permanently removed.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            It can be recovered from the <strong>Soft-Deleted</strong> tab on this page at any time.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} disabled={loading}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
            {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}