// src/components/reports/ReportTabTopSelling.jsx
// Tab 2 — Top Selling (REP_002, SUPERADMIN only).
// Identical data logic to TopSellingPage.jsx.
// UI: summary cards + ranked table + pink-themed bar chart.
// No service/logic changes.
//
// CHANGES FROM PREVIOUS VERSION:
//   1. Export CSV button — matches All Products gradient style
//   2. "Top Product" summary card — accent changed from gold → fuchsia (no more amber/yellow)
//   3. Product codes in Ranked List — font-mono font-bold text-gray-800 (matches All Products table)
//   4. Gold row highlight on rank #1 removed — uses pink hover like all other rows
//   5. Ranked List card — rounded-2xl + rgba border (matches All Products table card)
//   6. Quantity Sold chart card — same rounded-2xl + rgba border
//   7. Horizontal bar animation — scaleX from left origin (directional, not width-based)

import { useState, useEffect } from 'react';
import { useRights }            from '../../hooks/useRights';
import { getTopSellingProducts } from '../../services/reportService';
import { exportToCSV }           from '../../utils/csvExport';
import LoadingSpinner            from '../ui/LoadingSpinner';
import ErrorBanner               from '../ui/ErrorBanner';

const CSV_COLUMNS = ['rank', 'prodcode', 'description', 'unit', 'totalqty'];
const CSV_HEADERS = {
  rank:        'Rank',
  prodcode:    'Product Code',
  description: 'Description',
  unit:        'Unit',
  totalqty:    'Total Qty Sold',
};

// ── CSS animation injection (scaleX from left — directional sideway) ──────────
if (typeof document !== 'undefined' && !document.getElementById('top-selling-anim')) {
  const s = document.createElement('style');
  s.id = 'top-selling-anim';
  s.textContent = `
    @keyframes tsGrowRight {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }
    .ts-bar-right {
      transform-origin: 0% 50%;
      animation: tsGrowRight 0.55s cubic-bezier(.22,.68,0,1.15) both;
    }
  `;
  document.head.appendChild(s);
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function IconDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}
function IconGold() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  );
}
function IconBarChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  );
}
function IconHash() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9"/>
      <line x1="4" y1="15" x2="20" y2="15"/>
      <line x1="10" y1="3" x2="8" y2="21"/>
      <line x1="16" y1="3" x2="14" y2="21"/>
    </svg>
  );
}

// ── Medal SVG icons ───────────────────────────────────────────────────────────
function MedalGold() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.5"/>
      <text x="12" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">1</text>
      <path d="M8 13.5 L5 21 L12 18 L19 21 L16 13.5" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.2"/>
    </svg>
  );
}
function MedalSilver() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="1.5"/>
      <text x="12" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">2</text>
      <path d="M8 13.5 L5 21 L12 18 L19 21 L16 13.5" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1.2"/>
    </svg>
  );
}
function MedalBronze() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" fill="#FB923C" stroke="#EA580C" strokeWidth="1.5"/>
      <text x="12" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">3</text>
      <path d="M8 13.5 L5 21 L12 18 L19 21 L16 13.5" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.2"/>
    </svg>
  );
}

// ── Pink-tone bar colors (5-tone family) ──────────────────────────────────────
const BAR_COLORS = [
  '#f43f5e',  // rose-500   — 1st
  '#ec4899',  // pink-500   — 2nd
  '#d946ef',  // fuchsia-500— 3rd
  '#f472b6',  // pink-400   — 4th
  '#fb7185',  // rose-400   — 5th
  '#e879f9',  // fuchsia-400— 6th
  '#f9a8d4',  // pink-300   — 7th
  '#fda4af',  // rose-300   — 8th
  '#f0abfc',  // fuchsia-300— 9th
  '#fbcfe8',  // pink-200   — 10th
];

// ── Summary Card ─────────────────────────────────────────────────────────────
// CHANGE: Removed 'gold' accent — no longer used. Keeping pink/fuchsia/coral only.
function SummaryCard({ icon: Icon, label, value, sub, accent }) {
  const accents = {
    pink:    'from-pink-50 to-rose-50 border-pink-100',
    fuchsia: 'from-fuchsia-50 to-purple-50 border-fuchsia-100',
    coral:   'from-rose-50 to-pink-50 border-rose-100',
  };
  const iconAccents = {
    pink:    'bg-pink-100 text-pink-600',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-600',
    coral:   'bg-rose-100 text-rose-600',
  };
  return (
    <div className={`bg-gradient-to-br ${accents[accent] ?? accents.pink} border rounded-xl p-4 flex items-start gap-3`}>
      <div className={`${iconAccents[accent] ?? iconAccents.pink} rounded-lg p-2 shrink-0`}>
        <Icon />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-800 mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReportTabTopSelling() {
  const { canViewTopSelling } = useRights();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [animate,  setAnimate]  = useState(false);

  useEffect(() => {
    if (!canViewTopSelling) return;
    fetchTopSelling();
  }, [canViewTopSelling]);

  async function fetchTopSelling() {
    setLoading(true);
    setError('');
    setAnimate(false);
    const { data, error: fetchError } = await getTopSellingProducts();
    if (fetchError) {
      setError('Failed to load top-selling report. Please try again.');
      setLoading(false);
      return;
    }
    setProducts(data);
    setLoading(false);
    // Trigger animation after DOM settles
    requestAnimationFrame(() => setTimeout(() => setAnimate(true), 60));
  }

  if (!canViewTopSelling) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>The Top Selling report is only available to SUPERADMIN accounts.</p>
      </div>
    );
  }

  const maxQty     = Math.max(...products.map(p => Number(p.totalqty) || 0), 1);
  const rankedData = products.map((p, i) => ({ rank: i + 1, ...p }));
  const totalSold  = products.reduce((s, p) => s + Number(p.totalqty || 0), 0);
  const topProduct = products[0];

  return (
    <div>
      {/* ── Summary Cards ──────────────────────────────────────── */}
      {/* CHANGE: Top Product accent changed from 'gold' → 'fuchsia' */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            icon={IconHash}
            label="Products Ranked"
            value={products.length}
            sub="by total qty sold"
            accent="pink"
          />
          <SummaryCard
            icon={IconBarChart}
            label="Total Sold"
            value={totalSold.toLocaleString()}
            sub="units across all"
            accent="fuchsia"
          />
          <SummaryCard
            icon={IconGold}
            label="Top Product"
            value={topProduct?.prodcode ?? '—'}
            sub={topProduct?.description ?? ''}
            accent="coral"
          />
          <SummaryCard
            icon={IconBarChart}
            label="Top Qty Sold"
            value={Number(topProduct?.totalqty ?? 0).toLocaleString()}
            sub={`${topProduct?.unit ?? ''} sold`}
            accent="pink"
          />
        </div>
      )}

      {/* ── Export CSV — CHANGE: matches All Products gradient style ── */}
      {!loading && !error && products.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => exportToCSV(rankedData, CSV_COLUMNS, CSV_HEADERS, 'top-selling-report.csv')}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm shrink-0 hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)' }}
          >
            <IconDownload />
            Export CSV
          </button>
        </div>
      )}

      {/* Error / Loading / Empty */}
      {error   && <ErrorBanner message={error} onRetry={fetchTopSelling} />}
      {loading && <LoadingSpinner />}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="font-medium">No sales data available</p>
          <p className="text-sm mt-1">Top-selling data appears once salesDetail records exist.</p>
        </div>
      )}

      {/* ── Split layout: Table + Chart ─────────────────────────── */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ── Ranked Table ── */}
          {/* CHANGE: rounded-2xl + rgba border to match All Products table card */}
          <div
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.07)' }}
          >
            {/* Card header — kept from original */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-rose-50">
              <h3 className="text-sm font-semibold text-gray-700">Ranked List</h3>
            </div>

            <table className="w-full text-sm">
              <thead>
                {/* CHANGE: thead style matches All Products table header */}
                <tr style={{ background: 'linear-gradient(to bottom, #fafafa, #f5f5f5)', borderBottom: '1px solid #f0f0f0' }}>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest w-12">#</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Code</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Description</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Total Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product, index) => (
                  // CHANGE: Removed amber-50 highlight on rank #1 — all rows use pink hover
                  <tr
                    key={product.prodcode}
                    className="hover:bg-pink-50/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-center">
                      {index === 0 ? <MedalGold />
                       : index === 1 ? <MedalSilver />
                       : index === 2 ? <MedalBronze />
                       : <span className="text-xs text-gray-400 font-mono tabular-nums">{index + 1}</span>}
                    </td>

                    {/* CHANGE: code style matches All Products — font-mono font-bold text-gray-800 */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-gray-800 text-xs tracking-wide">
                        {product.prodcode}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-gray-700">{product.description}</td>

                    <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-gray-800">
                      {Number(product.totalqty).toLocaleString()}
                      <span className="text-xs text-gray-400 ml-1 font-normal">{product.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Horizontal Bar Chart ── */}
          {/* CHANGE: rounded-2xl + rgba border; bars use scaleX animation from left origin */}
          <div
            className="bg-white rounded-2xl shadow-sm p-5"
            style={{ border: '1px solid rgba(0,0,0,0.07)' }}
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-5">Quantity Sold</h3>
            <div className="space-y-3">
              {products.map((product, index) => {
                const pct   = (Number(product.totalqty) / maxQty) * 100;
                const delay = `${index * 0.07}s`;
                const color = BAR_COLORS[index] ?? '#fbcfe8';

                return (
                  <div key={product.prodcode} className="flex items-center gap-3">
                    {/* Code label */}
                    <span className="text-xs font-mono font-bold text-gray-800 w-16 shrink-0 text-right tracking-wide">
                      {product.prodcode}
                    </span>

                    {/* Track + animated fill */}
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={animate ? 'ts-bar-right' : ''}
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          borderRadius: '9999px',
                          background: color,
                          animationDelay: animate ? delay : undefined,
                        }}
                      />
                    </div>

                    {/* Value */}
                    <span className="text-xs tabular-nums text-gray-600 w-12 shrink-0 text-right font-medium">
                      {Number(product.totalqty).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Bar width proportional to{' '}
                <span className="font-medium text-pink-500">#{products[0]?.prodcode}</span>{' '}
                ({Number(products[0]?.totalqty ?? 0).toLocaleString()} units — max)
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}