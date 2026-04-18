// src/components/products/EditProductModal.jsx
import { useProductRights } from '../../hooks/useProductRights';
import { useState, useEffect } from 'react';
import { updateProduct }  from '../../services/productService';

const UNIT_OPTIONS = ['pc', 'ea', 'mtr', 'pkg', 'ltr'];

/**
 * @param {object}   product   - The product row selected in ProductsPage
 * @param {Function} onClose
 * @param {Function} onSuccess
 */
export default function EditProductModal({ product, onClose, onSuccess }) {
  const { canEdit, rightsLoading } = useProductRights();

if (rightsLoading) return null;
if (!canEdit) return null;

  const [description, setDescription] = useState(product?.description ?? '');
  const [unit,        setUnit]        = useState(product?.unit ?? 'pc');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function validate() {
    const errors = {};
    if (!description.trim()) {
      errors.description = 'Description is required.';
    } else if (description.trim().length > 30) {
      errors.description = 'Description must be 30 characters or fewer.';
    }
    if (!UNIT_OPTIONS.includes(unit)) {
      errors.unit = 'Select a valid unit.';
    }
    return errors;
  }

  async function handleSubmit() {
    setError('');
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    const { error: apiError } = await updateProduct(
      product.prodcode,
      { description: description.trim(), unit },
      currentUser.userid
    );

    setLoading(false);

    if (apiError) {
      setError(apiError.message ?? 'Failed to update product. Please try again.');
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Edit Product</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{product?.prodcode}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Product Code — read-only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Code
            </label>
            <input
              type="text"
              value={product?.prodcode ?? ''}
              readOnly
              className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm font-mono text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-400">Product code cannot be changed.</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={30}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.description ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">{description.length}/30 characters</p>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {UNIT_OPTIONS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
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
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}