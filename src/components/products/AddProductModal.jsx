// src/components/products/AddProductModal.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProductRights } from '../../hooks/useProductRights';
import { addProductWithPrice } from '../../services/productService';

const UNIT_OPTIONS = ['pc', 'ea', 'mtr', 'pkg', 'ltr'];

export default function AddProductModal({ onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const { canAdd, rightsLoading } = useProductRights();

  // Product fields
  const [prodcode, setProdcode] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('pc');

  // Price fields
  const [unitprice, setUnitprice] = useState('');
  const [effdate, setEffdate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const today = new Date().toISOString().slice(0, 10);
  useEffect(() => {
    // Set default effective date to today
    setEffdate(today);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (rightsLoading) return null;
  if (!canAdd) return null;

  function validate() {
    const errors = {};

    // Product validation
    if (!prodcode.trim()) {
      errors.prodcode = 'Product code is required.';
    } else if (!/^[A-Z]{2}\d{4}$/.test(prodcode.trim().toUpperCase())) {
      errors.prodcode = 'Format: 2 letters + 4 digits (e.g. AK0001).';
    }

    if (!description.trim()) {
      errors.description = 'Description is required.';
    } else if (description.trim().length > 30) {
      errors.description = 'Description must be 30 characters or fewer.';
    }

    if (!UNIT_OPTIONS.includes(unit)) {
      errors.unit = 'Select a valid unit.';
    }

    // Price validation
    const price = Number(unitprice);
    if (!unitprice) {
      errors.unitprice = 'Unit price is required.';
    } else if (isNaN(price) || price <= 0) {
      errors.unitprice = 'Unit price must be greater than 0.';
    }

    if (!effdate) {
      errors.effdate = 'Effective date is required.';
    } else if (effdate > today) {
      errors.effdate = 'Effective date cannot be in the future.';
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

    const productData = {
      prodcode: prodcode.trim().toUpperCase(),
      description: description.trim(),
      unit,
    };

    const priceData = {
      effdate: effdate,
      unitprice: Number(unitprice),
    };

    const { error: apiError } = await addProductWithPrice(
      productData,
      priceData,
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

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-base font-semibold text-gray-800">Add Product</h3>
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

          {/* Product Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={prodcode}
              onChange={e => setProdcode(e.target.value.toUpperCase())}
              placeholder="e.g. AK0001"
              maxLength={6}
              className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${
                fieldErrors.prodcode ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {fieldErrors.prodcode && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.prodcode}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">2 letters + 4 digits. Cannot be changed later.</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Product name or description"
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
              Unit <span className="text-red-500">*</span>
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
            {fieldErrors.unit && <p className="mt-1 text-xs text-red-600">{fieldErrors.unit}</p>}
          </div>

          {/* Separator */}
          <hr className="my-2" />

          {/* Initial Price – Effective Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={effdate}
                onChange={e => setEffdate(e.target.value)}
                max={today}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.effdate ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {fieldErrors.effdate && <p className="mt-1 text-xs text-red-600">{fieldErrors.effdate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (₱) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={unitprice}
                onChange={e => setUnitprice(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.unitprice ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {fieldErrors.unitprice && <p className="mt-1 text-xs text-red-600">{fieldErrors.unitprice}</p>}
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2">The first price entry will be recorded with this date.</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
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
            {loading ? 'Adding…' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}