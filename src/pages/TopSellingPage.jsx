// src/pages/TopSellingPage.jsx
// REP_002: Top-selling products ranked by total quantity sold.
// Accessible to SUPERADMIN only (REP_002 = 1; sidebar gated in S2-T13).
// Displays: ranked table + horizontal bar chart.
import { useState, useEffect } from 'react';
import { useRights }            from '../hooks/useRights';
import { getTopSellingProducts } from '../services/reportService';
import { exportToCSV }           from '../utils/csvExport';

const CSV_COLUMNS = ['rank', 'prodcode', 'description', 'unit', 'totalqty'];
const CSV_HEADERS = {
  rank:        'Rank',
  prodcode:    'Product Code',
  description: 'Description',
  unit:        'Unit',
  totalqty:    'Total Qty Sold',
};

export default function TopSellingPage() {
  const { canViewTopSelling } = useRights();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!canViewTopSelling) return;
    fetchTopSelling();
  }, [canViewTopSelling]);

  async function fetchTopSelling() {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await getTopSellingProducts();

    if (fetchError) {
      setError('Failed to load top-selling report. Please try again.');
      setLoading(false);
      return;
    }

    setProducts(data);
    setLoading(false);
  }

  // Access guard — shows a permission message if REP_002 right is missing
  if (!canViewTopSelling) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>The Top Selling report is only available to SUPERADMIN accounts.</p>
      </div>
    );
  }

  // Compute max totalqty for bar chart scaling
  const maxQty = Math.max(...products.map(p => Number(p.totalqty) || 0), 1);

  // Add rank to data for CSV export
  const rankedData = products.map((p, i) => ({ rank: i + 1, ...p }));

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Top Selling Products</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Top 10 active products ranked by total quantity sold across all transactions.
          </p>
        </div>
        {products.length > 0 && (
          <button
            onClick={() => exportToCSV(rankedData, CSV_COLUMNS, CSV_HEADERS, 'top-selling-report.csv')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            ⬇ Export CSV
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-3">
          <span>{error}</span>
          <button onClick={fetchTopSelling} className="underline hover:no-underline shrink-0">Retry</button>
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
          <p className="font-medium">No sales data available</p>
          <p className="text-sm mt-1">Top-selling data appears once salesDetail records exist.</p>
        </div>
      )}

      {/* Content — ranked table + bar chart */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ── Ranked Table ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Ranked List</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product, index) => (
                  <tr
                    key={product.prodcode}
                    className={index === 0 ? 'bg-yellow-50' : 'hover:bg-gray-50 transition-colors'}
                  >
                    <td className="px-4 py-3 text-center">
                      {index === 0 ? (
                        <span className="text-yellow-500 font-bold text-base">🥇</span>
                      ) : index === 1 ? (
                        <span className="text-gray-400 font-bold">🥈</span>
                      ) : index === 2 ? (
                        <span className="text-orange-400 font-bold">🥉</span>
                      ) : (
                        <span className="text-xs text-gray-400 font-mono">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{product.prodcode}</td>
                    <td className="px-4 py-3 text-gray-700">{product.description}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-800">
                      {Number(product.totalqty).toLocaleString()}
                      <span className="text-xs text-gray-400 ml-1">{product.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Horizontal Bar Chart ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Quantity Sold</h3>
            <div className="space-y-3">
              {products.map((product, index) => {
                const pct = Math.round((Number(product.totalqty) / maxQty) * 100);
                const barColors = [
                  'bg-yellow-400',
                  'bg-gray-300',
                  'bg-orange-400',
                  'bg-blue-400',
                  'bg-blue-300',
                  'bg-blue-200',
                  'bg-blue-200',
                  'bg-blue-200',
                  'bg-blue-200',
                  'bg-blue-200',
                ];
                return (
                  <div key={product.prodcode} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-500 w-16 shrink-0 text-right">
                      {product.prodcode}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColors[index] ?? 'bg-blue-200'} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-gray-600 w-16 shrink-0">
                      {Number(product.totalqty).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}