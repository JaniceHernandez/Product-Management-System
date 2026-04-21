// src/pages/DeletedItemsPage.jsx
// Accessible to ADMIN and SUPERADMIN only (RoleRoute — S2-T03).
import { useState, useEffect } from 'react';
import { useAuth }             from '../hooks/useAuth';
import { getDeletedProducts, recoverProduct } from '../services/productService';

export default function DeletedItemsPage() {
  const { currentUser } = useAuth();

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
      currentUser.userid
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
        <h2 className="text-xl font-bold text-gray-800">Deleted Items</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Soft-deleted products. These are hidden from all users but not permanently removed.
          Recover them to make them visible again.
        </p>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Stamp</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(product => (
                  <tr key={product.prodcode} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-gray-800">{product.prodcode}</td>
                    <td className="px-4 py-3 text-gray-700">{product.description}</td>
                    <td className="px-4 py-3 text-gray-500">{product.unit}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{product.stamp ?? '—'}</td>
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