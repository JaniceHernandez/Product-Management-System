// src/components/products/AddProductModal.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProductRights } from '../../hooks/useProductRights';
import { addProductWithPrice } from '../../services/productService';

const UNIT_OPTIONS = ['pc', 'ea', 'mtr', 'pkg', 'ltr'];

export default function AddProductModal({ onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const { canAdd, rightsLoading } = useProductRights();

  const [prodcode, setProdcode] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('pc');
  const [unitprice, setUnitprice] = useState('');
  const [effdate, setEffdate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { setEffdate(today); }, []);

  useEffect(() => {
    function handleKeyDown(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (rightsLoading) return null;
  if (!canAdd) return null;

  function validate() {
    const errors = {};
    if (!prodcode.trim()) errors.prodcode = 'Product code is required.';
    else if (!/^[A-Z]{2}\d{4}$/.test(prodcode.trim().toUpperCase())) errors.prodcode = 'Format: 2 letters + 4 digits (e.g. AK0001).';
    if (!description.trim()) errors.description = 'Description is required.';
    else if (description.trim().length > 30) errors.description = 'Max 30 characters.';
    if (!UNIT_OPTIONS.includes(unit)) errors.unit = 'Select a valid unit.';
    const price = Number(unitprice);
    if (!unitprice) errors.unitprice = 'Unit price is required.';
    else if (isNaN(price) || price <= 0) errors.unitprice = 'Must be greater than 0.';
    if (!effdate) errors.effdate = 'Effective date is required.';
    else if (effdate > today) errors.effdate = 'Cannot be in the future.';
    return errors;
  }

  async function handleSubmit() {
    setError('');
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setLoading(true);

    const { error: apiError } = await addProductWithPrice(
      { prodcode: prodcode.trim().toUpperCase(), description: description.trim(), unit },
      { effdate, unitprice: Number(unitprice) },
      currentUser
    );

    setLoading(false);
    if (apiError) {
      if (apiError.message?.includes('duplicate') || apiError.message?.includes('unique')) {
        setError(`Product code "${prodcode.toUpperCase()}" already exists.`);
      } else {
        setError(apiError.message ?? 'Failed to add product. Please try again.');
      }
      return;
    }
    onSuccess();
  }

  const inputBase = 'w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition-colors bg-white';
  const inputNormal = `${inputBase} border-gray-200`;
  const inputError = `${inputBase} border-red-400 bg-red-50`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ border: '1px solid rgba(244,63,94,0.15)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#fce7f3,#fdf2f8)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="#ec4899" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Add Product</h3>
              <p className="text-xs text-gray-400">Fill in product details below</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-xl leading-none transition-colors">×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Product Code */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Code <span className="text-red-500">*</span></label>
            <input type="text" value={prodcode} onChange={e => setProdcode(e.target.value.toUpperCase())}
              placeholder="e.g. AK0001" maxLength={6}
              className={`${fieldErrors.prodcode ? inputError : inputNormal} font-mono uppercase`} />
            {fieldErrors.prodcode ? <p className="mt-1 text-xs text-red-600">{fieldErrors.prodcode}</p>
              : <p className="mt-1 text-xs text-gray-400">2 letters + 4 digits. Cannot be changed later.</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description <span className="text-red-500">*</span></label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Product name or description" maxLength={30}
              className={fieldErrors.description ? inputError : inputNormal} />
            {fieldErrors.description ? <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
              : <p className="mt-1 text-xs text-gray-400">{description.length}/30 characters</p>}
          </div>

          {/* Unit */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unit <span className="text-red-500">*</span></label>
            <select value={unit} onChange={e => setUnit(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white">
              {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            {fieldErrors.unit && <p className="mt-1 text-xs text-red-600">{fieldErrors.unit}</p>}
          </div>

          <hr className="border-gray-100" />

          <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg,#fff5f7,#fdf2f8)', border: '1px solid rgba(244,63,94,0.1)' }}>
            <p className="text-[10px] font-bold text-pink-600 uppercase tracking-widest mb-3">Initial Price Entry</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Effective Date <span className="text-red-500">*</span></label>
                <input type="date" value={effdate} onChange={e => setEffdate(e.target.value)} max={today}
                  className={`${fieldErrors.effdate ? inputError : inputNormal}`} />
                {fieldErrors.effdate && <p className="mt-1 text-xs text-red-600">{fieldErrors.effdate}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unit Price (₱) <span className="text-red-500">*</span></label>
                <input type="number" value={unitprice} onChange={e => setUnitprice(e.target.value)}
                  min="0.01" step="0.01" placeholder="0.00"
                  className={fieldErrors.unitprice ? inputError : inputNormal} />
                {fieldErrors.unitprice && <p className="mt-1 text-xs text-red-600">{fieldErrors.unitprice}</p>}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">The first price entry will be recorded with this date.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} disabled={loading}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-60 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)' }}>
            {loading ? 'Adding…' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}