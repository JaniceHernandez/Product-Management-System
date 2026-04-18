// src/components/products/SoftDeleteConfirmDialog.jsx
import { useState, useEffect } from 'react';
import { useAuth }             from '../../hooks/useAuth';
import { softDeleteProduct }   from '../../services/productService';

/**
 * @param {object}   product   - The product row selected in ProductsPage
 * @param {Function} onClose
 * @param {Function} onSuccess
 */
export default function SoftDeleteConfirmDialog({ product, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleConfirm() {
    setError('');
    setLoading(true);

    const { error: apiError } = await softDeleteProduct(
      product.prodcode,
      currentUser.userid
    );

    setLoading(false);

    if (apiError) {
      setError(apiError.message ?? 'Failed to delete product. Please try again.');
      return;
    }

    onSuccess();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">Delete Product</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Warning icon + message */}
          <div className="flex gap-3 items-start">
            <span className="text-2xl mt-0.5">⚠️</span>
            <div>
              <p className="text-sm font-medium text-gray-800">
                Are you sure you want to delete{' '}
                <span className="font-mono font-bold">{product?.prodcode}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-1">
                <strong>{product?.description}</strong>
              </p>
              <p className="text-xs text-gray-400 mt-3">
                This product will be hidden from all users but not permanently removed.
                It can be recovered from the <strong>Deleted Items</strong> page.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}