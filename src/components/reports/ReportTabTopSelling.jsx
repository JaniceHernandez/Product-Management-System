// src/components/reports/ReportTabTopSelling.jsx
import { useState, useEffect } from 'react';
import { useRights } from '../../hooks/useRights';
import { getTopSellingProducts } from '../../services/reportService';
import { exportToCSV } from '../../utils/csvExport';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorBanner from '../ui/ErrorBanner';

const CSV_COLUMNS = ['rank', 'prodcode', 'description', 'unit', 'totalqty', 'totalvalue'];
const CSV_HEADERS = {
  rank: 'Rank',
  prodcode: 'Product Code',
  description: 'Description',
  unit: 'Unit',
  totalqty: 'Total Qty Sold',
  totalvalue: 'Total Sales Value (₱)',
};

// CSS animation
if (typeof document !== 'undefined' && !document.getElementById('top-selling-anim')) {
  const s = document.createElement('style');
  s.id = 'top-selling-anim';
  s.textContent = `
    @keyframes growRight {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }
    .bar-animate {
      transform-origin: 0% 50%;
      animation: growRight 0.55s cubic-bezier(.22,.68,0,1.15) both;
    }
  `;
  document.head.appendChild(s);
}

// Icons
function IconDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function MedalGold() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="6" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.5"/>
      <text x="12" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">1</text>
      <path d="M8 13.5 L5 21 L12 18 L19 21 L16 13.5" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.2"/>
    </svg>
  );
}

function MedalSilver() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="6" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="1.5"/>
      <text x="12" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">2</text>
      <path d="M8 13.5 L5 21 L12 18 L19 21 L16 13.5" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1.2"/>
    </svg>
  );
}

function MedalBronze() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="6" fill="#FB923C" stroke="#EA580C" strokeWidth="1.5"/>
      <text x="12" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">3</text>
      <path d="M8 13.5 L5 21 L12 18 L19 21 L16 13.5" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.2"/>
    </svg>
  );
}

const BAR_COLORS = [
  '#f43f5e', '#ec4899', '#d946ef', '#f472b6', '#fb7185',
  '#e879f9', '#f9a8d4', '#fda4af', '#f0abfc', '#fbcfe8',
];

function formatCurrency(value) {
  return `₱ ${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export default function ReportTabTopSelling() {
  const { canViewTopSelling } = useRights();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [animate, setAnimate] = useState(false);

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
      setError('Failed to load top-selling report.');
      setLoading(false);
      return;
    }
    setProducts(data);
    setLoading(false);
    requestAnimationFrame(() => setTimeout(() => setAnimate(true), 60));
  }

  if (!canViewTopSelling) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>The Top Selling report is only available to SUPERADMIN accounts.</p>
      </div>
    );
  }

  // Sort products by quantity for first chart
  const productsByQty = [...products].sort((a, b) => Number(b.totalqty) - Number(a.totalqty));
  // Sort products by value for second chart
  const productsByValue = [...products].sort((a, b) => Number(b.totalvalue) - Number(a.totalvalue));

  const maxQty = Math.max(...products.map(p => Number(p.totalqty) || 0), 1);
  const maxValue = Math.max(...products.map(p => Number(p.totalvalue) || 0), 1);
  const rankedData = products.map((p, i) => ({ rank: i + 1, ...p }));

  return (
    <div>
      {/* Export CSV */}
      {!loading && !error && products.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => exportToCSV(rankedData, CSV_COLUMNS, CSV_HEADERS, 'top-selling-report.csv')}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)' }}
          >
            <IconDownload />
            Export CSV
          </button>
        </div>
      )}

      {/* Error / Loading / Empty */}
      {error && <ErrorBanner message={error} onRetry={fetchTopSelling} />}
      {loading && <LoadingSpinner />}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="font-medium">No sales data available</p>
          <p className="text-sm mt-1">Top-selling data appears once sales records exist.</p>
        </div>
      )}

      {/* Two Graphs Side by Side */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Graph 1: Ranked by Quantity Sold */}
          <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            <h3 className="text-sm font-semibold text-gray-700 mb-5">Ranked by Quantity Sold</h3>
            <div className="space-y-3">
              {productsByQty.map((product, index) => {
                const qty = Number(product.totalqty) || 0;
                const pct = (qty / maxQty) * 100;
                const delay = `${index * 0.07}s`;
                const color = BAR_COLORS[index] ?? '#fbcfe8';
                return (
                  <div key={`qty-${product.prodcode}`} className="flex items-center gap-3">
                    <div className="w-8 shrink-0">
                      {index === 0 ? <MedalGold /> : index === 1 ? <MedalSilver /> : index === 2 ? <MedalBronze /> : <span className="text-xs text-gray-400 font-mono">{index + 1}</span>}
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-800 w-16 shrink-0 tracking-wide">{product.prodcode}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={animate ? 'bar-animate' : ''}
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          borderRadius: '9999px',
                          background: color,
                          animationDelay: animate ? delay : undefined,
                        }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-gray-600 w-12 shrink-0 text-right font-medium">
                      {qty.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-4 pt-3 border-t">Bar width = quantity sold. Max: {maxQty.toLocaleString()} units</p>
          </div>

          {/* Graph 2: Ranked by Sales Value */}
          <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            <h3 className="text-sm font-semibold text-gray-700 mb-5">Ranked by Sales Value (₱)</h3>
            <div className="space-y-3">
              {productsByValue.map((product, index) => {
                const value = Number(product.totalvalue) || 0;
                const pct = (value / maxValue) * 100;
                const delay = `${index * 0.07}s`;
                const color = BAR_COLORS[index] ?? '#fbcfe8';
                return (
                  <div key={`val-${product.prodcode}`} className="flex items-center gap-3">
                    <div className="w-8 shrink-0">
                      {index === 0 ? <MedalGold /> : index === 1 ? <MedalSilver /> : index === 2 ? <MedalBronze /> : <span className="text-xs text-gray-400 font-mono">{index + 1}</span>}
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-800 w-16 shrink-0 tracking-wide">{product.prodcode}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={animate ? 'bar-animate' : ''}
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          borderRadius: '9999px',
                          background: color,
                          animationDelay: animate ? delay : undefined,
                        }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-gray-600 w-24 shrink-0 text-right font-medium">
                      {formatCurrency(value)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-4 pt-3 border-t">Bar width = sales value. Max: {formatCurrency(maxValue)}</p>
          </div>

        </div>
      )}
    </div>
  );
}