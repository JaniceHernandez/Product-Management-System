// src/components/products/EditProductModal.jsx
import { useProductRights } from '../../hooks/useProductRights';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { updateProduct } from '../../services/productService';

const UNIT_OPTIONS = ['pc', 'ea', 'mtr', 'pkg', 'ltr'];

export default function EditProductModal({ product, onClose, onSuccess }) {
  const { canEdit, rightsLoading } = useProductRights();
  const { currentUser } = useAuth();

  const [description, setDescription] = useState(product?.description ?? '');
  const [unit, setUnit] = useState(product?.unit ?? 'pc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    function handleKeyDown(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (rightsLoading) return null;
  if (!canEdit) return null;

  function validate() {
    const errors = {};
    if (!description.trim()) errors.description = 'Description is required.';
    else if (description.trim().length > 30) errors.description = 'Max 30 characters.';
    if (!UNIT_OPTIONS.includes(unit)) errors.unit = 'Select a valid unit.';
    return errors;
  }

  async function handleSubmit() {
    setError('');
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setLoading(true);

    const { error: apiError } = await updateProduct(
      product.prodcode,
      { description: description.trim(), unit },
      currentUser
    );

    setLoading(false);
    if (apiError) { setError(apiError.message ?? 'Failed to update product.'); return; }
    onSuccess();
  }

  const inputBase = 'w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition-colors bg-white';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        style={{ border: '1px solid rgba(244,63,94,0.15)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#fce7f3,#fdf2f8)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="#ec4899" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Edit Product</h3>
              <p className="text-xs font-mono text-pink-500 mt-0.5">{product?.prodcode}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-xl leading-none transition-colors">×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Product Code — read-only */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Code</label>
            <input type="text" value={product?.prodcode ?? ''} readOnly
              className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 text-sm font-mono text-gray-400 cursor-not-allowed" />
            <p className="mt-1 text-xs text-gray-400">Product code cannot be changed.</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} maxLength={30}
              className={`${inputBase} ${fieldErrors.description ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
            {fieldErrors.description
              ? <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
              : <p className="mt-1 text-xs text-gray-400">{description.length}/30 characters</p>}
          </div>

          {/* Unit */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unit</label>
            <select value={unit} onChange={e => setUnit(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white">
              {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            {fieldErrors.unit && <p className="mt-1 text-xs text-red-600">{fieldErrors.unit}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} disabled={loading}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-60 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)' }}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}