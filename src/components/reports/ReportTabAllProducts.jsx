// src/components/reports/ReportTabAllProducts.jsx
// Tab 1 — All Products (REP_001).
// Same data logic as original ProductReportPage.jsx.
// New: summary cards + pink theme + clickable rows (Price History Modal placeholder).
// No service logic changed.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRights }        from '../../hooks/useRights';
import { getProductReport } from '../../services/reportService';
import { exportToCSV }      from '../../utils/csvExport';
import LoadingSpinner       from '../ui/LoadingSpinner';
import ErrorBanner          from '../ui/ErrorBanner';

const CSV_COLUMNS = ['prodcode', 'description', 'unit', 'unitprice', 'effdate'];
const CSV_HEADERS = {
  prodcode:    'Product Code',
  description: 'Description',
  unit:        'Unit',
  unitprice:   'Current Price',
  effdate:     'Price Effective Date',
};

// ── SVG Icons ────────────────────────────────────────────────────────────────
function IconDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconPackage() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24"/>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.29 7 12 12 20.71 7"/>
      <line x1="12" y1="22" x2="12" y2="12"/>
    </svg>
  );
}
function IconTag() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
}
function IconTrendUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  );
}
function IconTrendDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
      <polyline points="17 18 23 18 23 12"/>
    </svg>
  );
}
// Exact copies of ProductsPage sort icons (up/down arrows, not chevrons)
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

// ── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, sub, accent }) {
  const accents = {
    pink:    'from-pink-50 to-rose-50 border-pink-100',
    fuchsia: 'from-fuchsia-50 to-purple-50 border-fuchsia-100',
    coral:   'from-rose-50 to-pink-50 border-rose-100',
    light:   'from-pink-50 to-pink-100/40 border-pink-100',
  };
  const iconAccents = {
    pink:    'bg-pink-100 text-pink-600',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-600',
    coral:   'bg-rose-100 text-rose-600',
    light:   'bg-pink-100 text-pink-500',
  };
  return (
    <div className={`bg-gradient-to-br ${accents[accent] ?? accents.pink} border rounded-xl p-4 flex items-start gap-3`}>
      <div className={`${iconAccents[accent] ?? iconAccents.pink} rounded-lg p-2 shrink-0`}>
        <Icon />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-800 mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Sort Header Cell — exact match to ProductsPage SortTh ───────────────────
function SortTh({ field, label, sortField, sortDir, onSort, className = '' }) {
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
            ? (sortDir === 'asc' ? <IconSortUp /> : <IconSortDown />)
            : <IconSortBoth />}
        </span>
      </span>
    </th>
  );
}

// ── Formatters ────────────────────────────────────────────────────────────────
function formatPrice(p) {
  if (p == null) return '—';
  return `₱${Number(p).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReportTabAllProducts() {
  const { canViewReports } = useRights();

  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [sortField, setSortField] = useState('prodcode');
  const [sortDir,   setSortDir]   = useState('asc');

  // ── Unchanged fetch logic ─────────────────────────────────────
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await getProductReport({ sortField, sortDirection: sortDir });
    if (fetchError) {
      setError('Failed to load product report. Please try again.');
      setLoading(false);
      return;
    }
    setRows(data);
    setLoading(false);
  }, [sortField, sortDir]);

  useEffect(() => {
    if (!canViewReports) return;
    fetchReport();
  }, [canViewReports, fetchReport]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return rows;
    return rows.filter(r =>
      r.prodcode.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term)
    );
  }, [rows, search]);

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
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  // ── Summary metrics (derived from rows, not a new fetch) ──────
  const metrics = useMemo(() => {
    if (!rows.length) return null;
    const prices = rows.map(r => Number(r.unitprice)).filter(p => !isNaN(p) && p > 0);
    const avg    = prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
    const max    = prices.length ? Math.max(...prices) : 0;
    const min    = prices.length ? Math.min(...prices) : 0;
    const highest = rows.find(r => Number(r.unitprice) === max);
    const lowest  = rows.find(r => Number(r.unitprice) === min);
    return { total: rows.length, avg, max, min, highest, lowest };
  }, [rows]);

  const canExport = displayed.length > 0;

  return (
    <div>
      {/* ── Summary Cards ──────────────────────────────────────── */}
      {!loading && !error && metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            icon={IconPackage}
            label="Total Products"
            value={metrics.total.toLocaleString()}
            sub={search ? `${displayed.length} matching` : 'active with prices'}
            accent="pink"
          />
          <SummaryCard
            icon={IconTag}
            label="Avg Price"
            value={`₱ ${metrics.avg.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sub="across all products"
            accent="fuchsia"
          />
          <SummaryCard
            icon={IconTrendUp}
            label="Highest Price"
            value={`₱ ${metrics.max.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
            sub={metrics.highest?.description ?? ''}
            accent="coral"
          />
          <SummaryCard
            icon={IconTrendDown}
            label="Lowest Price"
            value={`₱ ${metrics.min.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
            sub={metrics.lowest?.description ?? ''}
            accent="light"
          />
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative w-full max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <IconSearch />
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by code or description…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white transition"
          />
        </div>

        {canExport && (
          <button
            onClick={() => exportToCSV(displayed, CSV_COLUMNS, CSV_HEADERS, 'product-report.csv')}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm shrink-0 hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)' }}
          >
            <IconDownload />
            Export CSV
          </button>
        )}
      </div>

      {/* Count */}
      {!loading && !error && (
        <p className="text-xs text-gray-400 mb-3">
          Showing <span className="font-semibold text-gray-600">{displayed.length}</span> of{' '}
          <span className="font-semibold text-gray-600">{rows.length}</span> products
          {search && ` matching "${search}"`}
        </p>
      )}

      {/* Error / Loading / Empty */}
      {error   && <ErrorBanner message={error} onRetry={fetchReport} />}
      {loading && <LoadingSpinner />}
      {!loading && !error && displayed.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 24, height: 24 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
          <p className="font-semibold text-gray-500">No products found</p>
          <p className="text-sm mt-1 text-gray-400">
            {search ? 'Try a different search term.' : 'No products with price history exist yet.'}
          </p>
        </div>
      )}

      {/* ── Table — styled to match ProductsPage ───────────────── */}
      {!loading && !error && displayed.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(to bottom, #fafafa, #f5f5f5)', borderBottom: '1px solid #f0f0f0' }}>
                  <SortTh field="prodcode"    label="Code"          sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="description" label="Description"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="unit"        label="Unit"          sortField={sortField} sortDir={sortDir} onSort={handleSort} className="w-24" />
                  <SortTh field="unitprice"   label="Current Price" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="w-44" />
                  <SortTh field="effdate"     label="Price Since"   sortField={sortField} sortDir={sortDir} onSort={handleSort} className="w-36" />
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {displayed.map(row => (
                  <tr
                    key={row.prodcode}
                    className="hover:bg-pink-50/40 transition-colors cursor-pointer"
                    title="Click to view price history"
                  >
                    {/* Code — dark mono to match Products table */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-gray-800 text-xs tracking-wide">{row.prodcode}</span>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3.5 text-gray-700">{row.description}</td>

                    {/* Unit — pill badge to match Products table */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                        {row.unit}
                      </span>
                    </td>

                    {/* Price — mono bold + LIVE badge to match Products table */}
                    <td className="px-4 py-3.5">
                      <span className={`font-mono font-bold tabular-nums text-sm ${row.unitprice ? 'text-gray-900' : 'text-gray-300'}`}>
                        {formatPrice(row.unitprice)}
                      </span>
                      {row.unitprice && (
                        <span
                          className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide"
                          style={{ background: 'linear-gradient(135deg,#fce7f3,#fdf2f8)', color: '#db2777' }}
                        >
                          LIVE
                        </span>
                      )}
                    </td>

                    {/* Price Since */}
                    <td className="px-4 py-3.5 text-xs text-gray-400">{formatDate(row.effdate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer — matches Products table footer */}
          <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{displayed.length}</span> of{' '}
              <span className="font-semibold text-gray-600">{rows.length}</span> products
            </p>
            <button
              onClick={() => exportToCSV(displayed, CSV_COLUMNS, CSV_HEADERS, 'product-report.csv')}
              className="text-xs text-pink-600 hover:text-pink-800 font-medium flex items-center gap-1 hidden sm:flex"
            >
              <IconDownload /> Export CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}