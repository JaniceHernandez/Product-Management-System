// src/components/products/AddPriceEntryForm.jsx
import { useState } from 'react';
import { useAuth }        from '../../hooks/useAuth';
import { addPriceEntry }  from '../../services/priceHistService';

/**
 * @param {string}   prodcode   - FK to product
 * @param {Function} onSuccess  - Called after successful insert; parent re-fetches
 */
export default function AddPriceEntryForm({ prodcode, onSuccess }) {
  const { currentUser } = useAuth();

  const [effdate,     setEffdate]     = useState('');
  const [unitprice,   setUnitprice]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const today = new Date().toISOString().slice(0, 10);

  function validate() {
    const errors = {};

    if (!effdate) {
      errors.effdate = 'Effective date is required.';
    } else if (effdate > today) {
      errors.effdate = 'Effective date cannot be in the future.';
    }

    const price = Number(unitprice);
    if (!unitprice) {
      errors.unitprice = 'Unit price is required.';
    } else if (isNaN(price) || price <= 0) {
      errors.unitprice = 'Unit price must be greater than 0.';
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

    const { error: apiError } = await addPriceEntry(
      prodcode,
      effdate,
      Number(unitprice),
      currentUser.userid
    );

    setLoading(false);

    if (apiError) {
      setError(apiError.message ?? 'Failed to add price entry. Please try again.');
      return;
    }

    setEffdate('');
    setUnitprice('');
    onSuccess();
  }

  return (
    <div className="border-t border-blue-200 pt-4 mt-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Add New Price Entry
      </p>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Full-width row: date + price inputs stretch to fill, button at end */}
      <div className="flex items-end gap-3 w-full">

        {/* Effective Date — flex-1 so it grows */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Effective Date
          </label>
          <input
            type="date"
            value={effdate}
            onChange={e => setEffdate(e.target.value)}
            max={today}
            className={`w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.effdate ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {fieldErrors.effdate && (
            <p className="mt-0.5 text-xs text-red-600">{fieldErrors.effdate}</p>
          )}
        </div>

        {/* Unit Price — flex-1 so it grows */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Unit Price (₱)
          </label>
          <input
            type="number"
            value={unitprice}
            onChange={e => setUnitprice(e.target.value)}
            min="0.01"
            step="0.01"
            placeholder="0.00"
            className={`w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.unitprice ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {fieldErrors.unitprice && (
            <p className="mt-0.5 text-xs text-red-600">{fieldErrors.unitprice}</p>
          )}
        </div>

        {/* Submit — fixed width, aligned to bottom */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors shrink-0"
        >
          {loading ? 'Adding…' : 'Add Price'}
        </button>

      </div>
    </div>
  );
}