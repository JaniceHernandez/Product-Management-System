// src/pages/DeletedItemsPage.jsx
// Accessible to ADMIN and SUPERADMIN only (RoleRoute — S2-T03).
import { useState, useEffect } from 'react';
import { useAuth }             from '../hooks/useAuth';
import { getDeletedProducts, recoverProduct } from '../services/productService';
import { useStampVisibility } from '../hooks/useStampVisibility';

export default function DeletedItemsPage() {
  const { currentUser } = useAuth();
  const { showDeletedItemsStamp } = useStampVisibility();

  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [recovering,   setRecovering]   = useState(null);  // prodcode in progress
  const [recoverError, setRecoverError] = useState('');
  const [recoverMsg,   setRecoverMsg]   = useState('');    // success flash

  // Re-exported for the Retry button
  async function fetchDeleted() {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await getDeletedProducts();
    if (fetchError) {
      setError('Failed to load deleted products. Please try again.');
      setLoading(false);
      return;
    }
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadDeleted() {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await getDeletedProducts();
      if (cancelled) return;

      if (fetchError) {
        setError('Failed to load deleted products. Please try again.');
        setLoading(false);
        return;
      }
      setProducts(data);
      setLoading(false);
    }

    loadDeleted();
    return () => { cancelled = true; };
  }, []);

  async function handleRecover(product) {
    setRecoverError('');
    setRecoverMsg('');
    setRecovering(product.prodcode);

    const { error: recoverErr } = await recoverProduct(
      product.prodcode,
      currentUser
    );

    setRecovering(null);

    if (recoverErr) {
      setRecoverError(
        `Failed to recover "${product.prodcode}": ${recoverErr.message ?? 'Unknown error.'}`
      );
      return;
    }

    // Optimistic: remove row immediately without waiting for re-fetch
    setProducts(prev => prev.filter(p => p.prodcode !== product.prodcode));
    setRecoverMsg(
      `"${product.prodcode} — ${product.description}" restored. It is now visible to all users.`
    );
    setTimeout(() => setRecoverMsg(''), 4000);
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="mb-6">
        {/* Breadcrumb */}
        <p className="text-xs text-gray-400 font-medium mb-2">
          Admin <span className="mx-1">›</span> Deleted Items
        </p>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Archived Products</h1>
            <p className="text-sm text-gray-500 mt-1">
              Recover items removed by SUPERADMIN. Review the audit trail before restoration.
            </p>
          </div>
        </div>

        {/* Info strip */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {!loading && products.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {products.length} archived item{products.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Success flash */}
      {recoverMsg && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-start gap-2">
          <span className="mt-0.5">✓</span>
          <span>{recoverMsg}</span>
        </div>
      )}

      {/* Recovery error */}
      {recoverError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {recoverError}
        </div>
      )}

      {/* Fetch error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-3">
          <span>{error}</span>
          <button onClick={fetchDeleted} className="underline hover:no-underline shrink-0">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="font-medium">No deleted products</p>
          <p className="text-sm mt-1">Products that are soft-deleted will appear here and can be recovered.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && products.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Item Details</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                  {showDeletedItemsStamp && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Audit Stamp</th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(product => (
                  <tr key={product.prodcode}>
                    <td className="px-4 py-3 font-mono text-gray-800">{product.prodcode}</td>
                    <td className="px-4 py-3 text-gray-700">{product.description}</td>
                    <td className="px-4 py-3 text-gray-500">{product.unit}</td>
                    {showDeletedItemsStamp && (
                      <td className="px-4 py-3 text-xs text-gray-400">{product.stamp ?? '—'}</td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRecover(product)}
                        disabled={recovering === product.prodcode}
                        className="text-xs font-medium text-green-600 hover:text-green-800 disabled:text-green-300 transition-colors"
                      >
                        {recovering === product.prodcode ? 'Recovering…' : 'Recover'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            {products.length} deleted product{products.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

    </div>
  );
}