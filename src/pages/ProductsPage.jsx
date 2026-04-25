// src/pages/ProductsPage.jsx
import { useProductRights } from '../hooks/useProductRights';
import { useStampVisibility } from '../hooks/useStampVisibility';
import { useState, useEffect, useMemo, Fragment } from 'react';
import PriceHistoryPanel        from '../components/products/PriceHistoryPanel';

import { getProducts }          from '../services/productService';
import { getAllCurrentPrices }  from '../services/priceHistService';
import AddProductModal          from '../components/products/AddProductModal';
import EditProductModal         from '../components/products/EditProductModal';
import SoftDeleteConfirmDialog  from '../components/products/SoftDeleteConfirmDialog';

// ── SortTh moved outside component to avoid static-components lint error ──
function SortTh({ field, label, sortField, sortDirection, onSort }) {
  const active = sortField === field;
  const icon   = sortDirection === 'asc' ? '↑' : '↓';
  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
      onClick={() => onSort(field)}
    >
      {label}{' '}
      {active
        ? <span className="text-blue-500">{icon}</span>
        : <span className="text-gray-300">↕</span>
      }
    </th>
  );
}

export default function ProductsPage() {
  const { canAdd, canEdit, canDelete, showStamp, currentUser, userType } = useProductRights();
  const { showProductStamp } = useStampVisibility();

  // ── Data ─────────────────────────────────────────────────────
  const [products,  setProducts]  = useState([]);
  const [prices,    setPrices]    = useState(new Map());
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // ── UI controls ───────────────────────────────────────────────
  const [searchTerm,       setSearchTerm]       = useState('');
  const [sortField,        setSortField]        = useState('prodcode');
  const [sortDirection,    setSortDirection]    = useState('asc');
  const [selectedProduct,  setSelectedProduct]  = useState(null);
  const [showAddModal,     setShowAddModal]     = useState(false);
  const [showEditModal,    setShowEditModal]    = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expandedProdcode, setExpandedProdcode] = useState(null);

  function handleTogglePriceHistory(prodcode) {
    setExpandedProdcode(prev => prev === prodcode ? null : prodcode);
  }

  // ── Fetch ─────────────────────────────────────────────────────
  async function fetchData() {
    setLoading(true);
    setError('');

    const [prodResult, priceResult] = await Promise.all([
      getProducts(userType),
      getAllCurrentPrices(),
    ]);

    if (prodResult.error) {
      setError('Failed to load products. Please try again.');
      setLoading(false);
      return;
    }

    setProducts(prodResult.data);
    const map = new Map((priceResult.data ?? []).map(p => [p.prodcode, p]));
    setPrices(map);
    setLoading(false);
  }

  // Cleanup flag prevents setState on unmounted component
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      const [prodResult, priceResult] = await Promise.all([
        getProducts(userType),
        getAllCurrentPrices(),
      ]);

      if (cancelled) return;

      if (prodResult.error) {
        setError('Failed to load products. Please try again.');
        setLoading(false);
        return;
      }

      setProducts(prodResult.data);
      const map = new Map((priceResult.data ?? []).map(p => [p.prodcode, p]));
      setPrices(map);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userType]);

  function handleDataChange() { fetchData(); }

  // ── Filter + sort (client-side) ───────────────────────────────
  const displayed = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const filtered = products.filter(p =>
      p.prodcode.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
    );

    return [...filtered].sort((a, b) => {
      let va, vb;
      if (sortField === 'unitprice') {
        va = prices.get(a.prodcode)?.unitprice ?? 0;
        vb = prices.get(b.prodcode)?.unitprice ?? 0;
      } else {
        va = (a[sortField] ?? '').toLowerCase();
        vb = (b[sortField] ?? '').toLowerCase();
      }
      if (va < vb) return sortDirection === 'asc' ? -1 :  1;
      if (va > vb) return sortDirection === 'asc' ?  1 : -1;
      return 0;
    });
  }, [products, prices, searchTerm, sortField, sortDirection]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function formatPrice(prodcode) {
    const p = prices.get(prodcode);
    if (!p?.unitprice) return '—';
    return `₱ ${Number(p.unitprice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Products</h2>
          {!loading && (
            <p className="text-sm text-gray-400 mt-0.5">
              {displayed.length} product{displayed.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {canAdd && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Add Product
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by code or description…"
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-3">
          <span>{error}</span>
          <button onClick={fetchData} className="underline hover:no-underline shrink-0">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && displayed.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="font-medium">No products found</p>
          <p className="text-sm mt-1">
            {searchTerm
              ? 'Try a different search term.'
              : canAdd
                ? 'Add your first product using the button above.'
                : 'No products have been added yet.'}
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && displayed.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <SortTh field="prodcode"    label="Code"          sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <SortTh field="description" label="Description"   sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <SortTh field="unit"        label="Unit"          sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <SortTh field="unitprice"   label="Current Price" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  {showProductStamp && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Stamp
                    </th>
                  )}
                  {(canEdit || canDelete) && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {displayed.map(product => (
                  <Fragment key={product.prodcode}>

                    {/* Product row */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-gray-800">
                        {product.prodcode}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{product.description}</td>
                      <td className="px-4 py-3 text-gray-500">{product.unit}</td>
                      <td className="px-4 py-3 text-gray-700 tabular-nums">
                        {formatPrice(product.prodcode)}
                      </td>

                      {showProductStamp && (
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                          {product.stamp ?? '—'}
                        </td>
                      )}

                      {/* Actions column */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          {/* Price History toggle — visible to all authenticated users */}
                          <button
                            onClick={() => handleTogglePriceHistory(product.prodcode)}
                            className={`text-xs font-medium transition-colors ${
                              expandedProdcode === product.prodcode
                                ? 'text-blue-700 underline'
                                : 'text-blue-500 hover:text-blue-700'
                            }`}
                          >
                            {expandedProdcode === product.prodcode ? 'Hide ▲' : 'Price History ▼'}
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => { setSelectedProduct(product); setShowEditModal(true); }}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => { setSelectedProduct(product); setShowDeleteDialog(true); }}
                              className="text-xs font-medium text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Price History Panel row — spans all columns */}
                    {expandedProdcode === product.prodcode && (
                      <tr>
                        <td
                          colSpan={
                            4 + (showProductStamp ? 1 : 0) + ((canEdit || canDelete) ? 1 : 0)
                          }
                          className="p-0"
                        >
                          <PriceHistoryPanel
                            prodcode={product.prodcode}
                            isOpen={true}
                            onClose={() => setExpandedProdcode(null)}
                          />
                        </td>
                      </tr>
                    )}

                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && canAdd && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); handleDataChange(); }}
        />
      )}

      {showEditModal && canEdit && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          onClose={() => { setShowEditModal(false); setSelectedProduct(null); }}
          onSuccess={() => { setShowEditModal(false); setSelectedProduct(null); handleDataChange(); }}
        />
      )}

      {showDeleteDialog && canDelete && selectedProduct && (
        <SoftDeleteConfirmDialog
          product={selectedProduct}
          onClose={() => { setShowDeleteDialog(false); setSelectedProduct(null); }}
          onSuccess={() => { setShowDeleteDialog(false); setSelectedProduct(null); handleDataChange(); }}
        />
      )}

    </div>
  );
}