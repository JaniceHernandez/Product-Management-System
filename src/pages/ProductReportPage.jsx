// src/pages/ProductReportPage.jsx
// REP_001: Product listing report with current prices.
// Accessible to: SUPERADMIN, ADMIN, USER (REP_001 = 1 for all).
// Features: sortable columns, search filter, CSV export.
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRights }        from '../hooks/useRights';
import { getProductReport } from '../services/reportService';
import { exportToCSV }      from '../utils/csvExport';

const CSV_COLUMNS  = ['prodcode', 'description', 'unit', 'unitprice', 'effdate'];
const CSV_HEADERS  = {
  prodcode:    'Product Code',
  description: 'Description',
  unit:        'Unit',
  unitprice:   'Current Price',
  effdate:     'Price Effective Date',
};

export default function ProductReportPage() {
  const { canViewReports } = useRights();

  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [sortField, setSortField] = useState('prodcode');
  const [sortDir,   setSortDir]   = useState('asc');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await getProductReport({
      sortField,
      sortDirection: sortDir,
    });

    if (fetchError) {
      setError('Failed to load product report. Please try again.');
      setLoading(false);
      return;
    }

    setRows(data);
    setLoading(false);
  }, [sortField, sortDir]);

  // Rights guard — redirect or show empty if REP_001 right is missing
  // (should not happen since sidebar link is gated, but defensive)
  useEffect(() => {
    if (!canViewReports) return;
    fetchReport();
  }, [canViewReports, fetchReport]);

  // Client-side search filter
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return rows;
    return rows.filter(r =>
      r.prodcode.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term)
    );
  }, [rows, search]);

  // Client-side sort
  const displayed = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = sortField === 'unitprice' ? Number(a[sortField] ?? 0) : (a[sortField] ?? '').toLowerCase();
      const vb = sortField === 'unitprice' ? Number(b[sortField] ?? 0) : (b[sortField] ?? '').toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function SortTh({ field, label }) {
    const active = sortField === field;
    return (
      <th
        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
        onClick={() => handleSort(field)}
      >
        {label} {active ? (sortDir === 'asc' ? '↑' : '↓') : <span className="text-gray-300">↕</span>}
      </th>
    );
  }

  function formatPrice(p) {
    if (p == null) return '—';
    return `₱ ${Number(p).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  if (!canViewReports) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>You do not have permission to view reports.</p>
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Product Report</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            All active products with their current unit prices.
          </p>
        </div>
        {/* CSV Export — only when data is available */}
        {displayed.length > 0 && (
          <button
            onClick={() => exportToCSV(displayed, CSV_COLUMNS, CSV_HEADERS, 'product-report.csv')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            ⬇ Export CSV
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by code or description…"
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Count */}
      {!loading && !error && (
        <p className="text-xs text-gray-400 mb-3">
          {displayed.length} product{displayed.length !== 1 ? 's' : ''}
          {search && ` matching "${search}"`}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-3">
          <span>{error}</span>
          <button onClick={fetchReport} className="underline hover:no-underline shrink-0">Retry</button>
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
            {search ? 'Try a different search term.' : 'No products with price history exist yet.'}
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
                  <SortTh field="prodcode"    label="Code" />
                  <SortTh field="description" label="Description" />
                  <SortTh field="unit"        label="Unit" />
                  <SortTh field="unitprice"   label="Current Price" />
                  <SortTh field="effdate"     label="Price Since" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayed.map(row => (
                  <tr key={row.prodcode} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-gray-800">{row.prodcode}</td>
                    <td className="px-4 py-3 text-gray-700">{row.description}</td>
                    <td className="px-4 py-3 text-gray-500">{row.unit}</td>
                    <td className="px-4 py-3 tabular-nums text-gray-700">{formatPrice(row.unitprice)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(row.effdate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 flex items-center justify-between">
            <span>{displayed.length} products shown</span>
            {displayed.length > 0 && (
              <button
                onClick={() => exportToCSV(displayed, CSV_COLUMNS, CSV_HEADERS, 'product-report.csv')}
                className="text-green-600 hover:text-green-800 font-medium"
              >
                ⬇ Export CSV
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}