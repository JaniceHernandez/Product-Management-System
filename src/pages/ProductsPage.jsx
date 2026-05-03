// src/pages/ProductsPage.jsx
import { useProductRights } from '../hooks/useProductRights';
import { useStampVisibility } from '../hooks/useStampVisibility';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import PriceHistoryModal from '../components/products/PriceHistoryModal';
import { getProducts, recoverProduct } from '../services/productService';
import { getAllCurrentPrices } from '../services/priceHistService';
import AddProductModal from '../components/products/AddProductModal';
import EditProductModal from '../components/products/EditProductModal';
import SoftDeleteConfirmDialog from '../components/products/SoftDeleteConfirmDialog';

// ── Icon components ────────────────────────────────────────────
function IconHistory() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function IconDelete() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconSortUp() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
function IconSortDown() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}
function IconSortBoth() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}
function IconFilter() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <polygon points="22 3 2 3 10 13.46 10 21 14 18 14 13.46 22 3" />
    </svg>
  );
}
function IconX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SortTh({ field, label, sortField, sortDirection, onSort, className = '' }) {
  const active = sortField === field;
  return (
    <th
      className={`px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest cursor-pointer select-none hover:text-gray-700 transition-colors ${className}`}
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1.5">
        {label}
        <span className={active ? 'text-pink-500' : 'text-gray-300'}>
          {active
            ? (sortDirection === 'asc' ? <IconSortUp /> : <IconSortDown />)
            : <IconSortBoth />}
        </span>
      </span>
    </th>
  );
}

const TABS_BASE = ['All', 'Active'];

export default function ProductsPage() {
  const { canAdd, canEdit, canDelete, userType } = useProductRights();
  const { showProductStamp } = useStampVisibility();
  const { currentUser } = useAuth();
  const location = useLocation();

  const canViewSoftDeleted = ['ADMIN', 'SUPERADMIN'].includes(userType);
  const TABS = canViewSoftDeleted ? [...TABS_BASE, 'Soft-Deleted'] : TABS_BASE;

  // Read query param on mount to set initial tab
  const initialTab = (() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'Soft-Deleted' && canViewSoftDeleted) return 'Soft-Deleted';
    return 'All';
  })();

  const [products, setProducts] = useState([]);
  const [prices, setPrices] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [unitFilter, setUnitFilter] = useState('');
  const [sortField, setSortField] = useState('prodcode');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Price range filter states
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [priceHistoryProduct, setPriceHistoryProduct] = useState(null);

  // Recover state
  const [recovering, setRecovering] = useState(null);
  const [recoverError, setRecoverError] = useState('');
  const [recoverMsg, setRecoverMsg] = useState('');

  // Prevent USER from accessing Soft-Deleted tab if they navigate manually or rights change
  useEffect(() => {
    if (!canViewSoftDeleted && activeTab === 'Soft-Deleted') {
      setActiveTab('All');
    }
  }, [canViewSoftDeleted, activeTab]);

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

  async function handleRecover(product) {
    setRecoverError('');
    setRecoverMsg('');
    setRecovering(product.prodcode);
    const { error: recoverErr } = await recoverProduct(product.prodcode, currentUser);
    setRecovering(null);
    if (recoverErr) {
      setRecoverError(`Failed to recover "${product.prodcode}": ${recoverErr.message ?? 'Unknown error.'}`);
      return;
    }
    setRecoverMsg(`"${product.prodcode} — ${product.description}" restored. It is now visible to all users.`);
    setTimeout(() => setRecoverMsg(''), 4000);
    handleDataChange();
  }

  const allUnits = useMemo(() => {
    const units = [...new Set(products.map(p => p.unit).filter(Boolean))].sort();
    return units;
  }, [products]);

  // Clear price filters
  const clearPriceFilters = () => {
    setMinPrice('');
    setMaxPrice('');
  };

  const displayed = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let filtered = products.filter(p =>
      (p.prodcode.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)) &&
      (unitFilter ? p.unit === unitFilter : true)
    );

    // Apply price range filter
    if (minPrice || maxPrice) {
      filtered = filtered.filter(p => {
        const price = prices.get(p.prodcode)?.unitprice ?? 0;
        const min = minPrice ? parseFloat(minPrice) : -Infinity;
        const max = maxPrice ? parseFloat(maxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }

    if (activeTab === 'Active') filtered = filtered.filter(p => !isSoftDeleted(p));
    else if (activeTab === 'Soft-Deleted') filtered = filtered.filter(p => isSoftDeleted(p));

    return [...filtered].sort((a, b) => {
      let va, vb;
      if (sortField === 'unitprice') {
        va = prices.get(a.prodcode)?.unitprice ?? 0;
        vb = prices.get(b.prodcode)?.unitprice ?? 0;
      } else {
        va = (a[sortField] ?? '').toString().toLowerCase();
        vb = (b[sortField] ?? '').toString().toLowerCase();
      }
      if (va < vb) return sortDirection === 'asc' ? -1 : 1;
      if (va > vb) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, prices, searchTerm, activeTab, unitFilter, sortField, sortDirection, minPrice, maxPrice]);

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
    return `₱${Number(p.unitprice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  }

  function isSoftDeleted(p) {
    return !!p.deleted_at || (typeof p.stamp === 'string' && p.stamp.toUpperCase().includes('DEACTIVATED'));
  }

  const activeCount = products.filter(p => !isSoftDeleted(p)).length;
  const softDeletedCount = products.filter(p => isSoftDeleted(p)).length;
  const tabCounts = { All: products.length, Active: activeCount, 'Soft-Deleted': softDeletedCount };

  // Get min and max possible prices for placeholder hints
  const allPrices = Array.from(prices.values()).map(p => p.unitprice).filter(p => p > 0);
  const globalMinPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const globalMaxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 10000;

  return (
    <div className="p-6 max-w-full">

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">Product Catalogue</h1>
              {canDelete && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] text-amber-600 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 11, height: 11 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Soft-delete: <strong>SUPERADMIN</strong> only</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">Overseeing current inventory lifecycles and pricing structures.</p>
          </div>
          {canAdd && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0 hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)' }}
            >
              <span className="text-base leading-none">+</span>
              Add Product
            </button>
          )}
        </div>

        {/* Stats */}
        {!loading && products.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Stock</p>
              <p className="text-2xl font-bold text-gray-800">{products.length.toLocaleString()}</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Price Records</p>
              <p className="text-2xl font-bold text-gray-800">{prices.size.toLocaleString()}</p>
            </div>
            {canDelete && (
              <>
                <div className="w-px h-10 bg-gray-100" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Soft-Deleted</p>
                  <p className="text-2xl font-bold" style={{ color: '#f43f5e' }}>{softDeletedCount}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <IconSearch />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by code or description…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
          />
        </div>

        {allUnits.length > 0 && (
          <select
            value={unitFilter}
            onChange={e => setUnitFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
          >
            <option value="">All Units</option>
            {allUnits.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        )}

        {/* ── Price Range Filter ── */}
        <button
          onClick={() => setShowPriceFilter(!showPriceFilter)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
            showPriceFilter || minPrice || maxPrice
              ? 'bg-pink-100 text-pink-700 border border-pink-200'
              : 'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          <IconFilter />
          <span>Price</span>
          {(minPrice || maxPrice) && (
            <span className="ml-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center font-bold">!</span>
          )}
        </button>

        {showPriceFilter && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">₱</span>
            <input
              type="number"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              placeholder="Min"
              className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              min="0"
              step="0.01"
            />
            <span className="text-xs text-gray-400">–</span>
            <input
              type="number"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="Max"
              className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              min="0"
              step="0.01"
            />
            {(minPrice || maxPrice) && (
              <button
                onClick={clearPriceFilters}
                className="ml-1 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Clear price filters"
              >
                <IconX />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 ml-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab ? 'bg-pink-100 text-pink-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Active filter indicator ── */}
      {(minPrice || maxPrice) && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-gray-500">Active filters:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 text-xs">
            Price: {minPrice ? `₱${parseFloat(minPrice).toLocaleString()}` : '₱0'} - {maxPrice ? `₱${parseFloat(maxPrice).toLocaleString()}` : 'Any'}
            <button onClick={clearPriceFilters} className="ml-1 hover:text-pink-800">
              <IconX />
            </button>
          </span>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-3">
          <span>{error}</span>
          <button onClick={fetchData} className="underline hover:no-underline shrink-0 ml-auto">Retry</button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-pink-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && displayed.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 24, height: 24 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
          <p className="font-semibold text-gray-500">No products found</p>
          <p className="text-sm mt-1 text-gray-400">
            {searchTerm || minPrice || maxPrice ? 'Try adjusting your filters.' : canAdd ? 'Add your first product using the button above.' : 'No products have been added yet.'}
          </p>
        </div>
      )}

      {/* ── Recover flash messages ── */}
      {recoverMsg && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-start gap-2">
          <span className="mt-0.5">✓</span>
          <span>{recoverMsg}</span>
        </div>
      )}
      {recoverError && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {recoverError}
        </div>
      )}

      {/* ── Soft-Deleted tab: Archived recovery panel ── */}
      {!loading && !error && activeTab === 'Soft-Deleted' && displayed.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(to bottom, #fafafa, #f5f5f5)', borderBottom: '1px solid #f0f0f0' }}>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Product ID</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Item Details</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest w-20">Unit</th>
                  {showProductStamp && (
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest w-52">Audit Stamp</th>
                  )}
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-widest w-32">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map(product => (
                  <tr key={product.prodcode} className="hover:bg-pink-50/30 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-800 text-xs tracking-wide">{product.prodcode}</td>
                    <td className="px-4 py-3.5 text-gray-600">{product.description}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs font-medium">{product.unit}</span>
                    </td>
                    {showProductStamp && (
                      <td className="px-4 py-3.5 text-xs text-gray-400 font-mono">{product.stamp ?? '—'}</td>
                    )}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleRecover(product)}
                        disabled={recovering === product.prodcode}
                        className="text-xs font-semibold text-green-600 hover:text-green-800 disabled:text-green-300 transition-colors"
                      >
                        {recovering === product.prodcode ? 'Recovering…' : 'Recover'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              <span className="font-semibold text-gray-600">{displayed.length}</span> archived product{displayed.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* ── Normal table (All / Active tabs) ── */}
      {!loading && !error && activeTab !== 'Soft-Deleted' && displayed.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(to bottom, #fafafa, #f5f5f5)', borderBottom: '1px solid #f0f0f0' }}>
                  <SortTh field="prodcode"    label="Code"          sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <SortTh field="description" label="Description"   sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <SortTh field="unit"        label="Unit"          sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="w-20" />
                  <SortTh field="unitprice"   label="Current Price" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="w-40" />
                  {showProductStamp && (
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest w-32">Stamp</th>
                  )}
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-widest w-32">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {displayed.map(product => {
                  const priceData = prices.get(product.prodcode);
                  const isSoftDeletedRow = isSoftDeleted(product);

                  return (
                    <tr
                      key={product.prodcode}
                      onClick={() => setPriceHistoryProduct(product)}
                      className={`transition-colors cursor-pointer group ${isSoftDeletedRow ? 'opacity-50' : 'hover:bg-pink-50/40'}`}
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-gray-800 text-xs tracking-wide">{product.prodcode}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-gray-700">{product.description}</span>
                        {isSoftDeletedRow && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-500 uppercase tracking-wide">Deleted</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">{product.unit}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`font-mono font-bold tabular-nums text-sm ${priceData?.unitprice ? 'text-gray-900' : 'text-gray-300'}`}>
                          {formatPrice(product.prodcode)}
                        </span>
                        {priceData?.unitprice && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide"
                            style={{ background: 'linear-gradient(135deg,#fce7f3,#fdf2f8)', color: '#db2777' }}>
                            LIVE
                          </span>
                        )}
                      </td>
                      {showProductStamp && (
                        <td className="px-4 py-3.5 text-xs text-gray-400 font-mono">
                          {product.stamp ?? '—'}
                        </td>
                      )}
                      <td className="px-4 py-3.5">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setPriceHistoryProduct(product)}
                            title="Price History"
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all text-gray-400 hover:text-pink-600 hover:bg-pink-50"
                          >
                            <IconHistory />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => { setSelectedProduct(product); setShowEditModal(true); }}
                              title="Edit Product"
                              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <IconEdit />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => { setSelectedProduct(product); setShowDeleteDialog(true); }}
                              title="Delete Product"
                              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <IconDelete />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{displayed.length}</span> of <span className="font-semibold text-gray-600">{products.length}</span> products
              {(minPrice || maxPrice) && <span className="ml-2 text-pink-500">(price filtered)</span>}
            </p>
            <p className="text-xs text-gray-400 hidden sm:block">Click any row to view price history</p>
          </div>
        </div>
      )}

      {/* ── Price History Modal ── */}
      {priceHistoryProduct && (
        <PriceHistoryModal
          prodcode={priceHistoryProduct.prodcode}
          productName={priceHistoryProduct.description}
          onClose={() => setPriceHistoryProduct(null)}
        />
      )}

      {/* ── Add Product Modal ── */}
      {showAddModal && canAdd && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); handleDataChange(); }}
        />
      )}

      {/* ── Edit Product Modal ── */}
      {showEditModal && canEdit && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          onClose={() => { setShowEditModal(false); setSelectedProduct(null); }}
          onSuccess={() => { setShowEditModal(false); setSelectedProduct(null); handleDataChange(); }}
        />
      )}

      {/* ── Soft Delete Dialog ── */}
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