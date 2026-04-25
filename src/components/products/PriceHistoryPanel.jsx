// src/components/products/PriceHistoryPanel.jsx
import { useProductRights } from '../../hooks/useProductRights';
import { useState, useEffect } from 'react';
import { useStampVisibility } from '../../hooks/useStampVisibility';
import { getPriceHistory }   from '../../services/priceHistService';
import AddPriceEntryForm     from './AddPriceEntryForm';

/**
 * @param {string}  prodcode  - The product whose price history to show
 * @param {boolean} isOpen    - Controlled by parent (ProductsPage)
 * @param {Function} onClose  - Called when user collapses the panel
 */
export default function PriceHistoryPanel({ prodcode, isOpen}) {


  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Stamp visibility: ADMIN sees pricehist stamps; SUPERADMIN sees all; USER never
  //const { showStamp } = useProductRights();
  const { showPriceHistStamp } = useStampVisibility();

  // Fetch when panel opens
  useEffect(() => {
    if (!isOpen || !prodcode) return;

    let cancelled = false;

    (async () => {
      setLoading(() => true);
      setError(() => '');

      const { data, error: fetchError } = await getPriceHistory(prodcode);

      if (cancelled) return;

      if (fetchError) {
        setError(() => 'Failed to load price history.');
        setLoading(() => false);
        return;
      }

      setHistory(() => data);
      setLoading(() => false);
    })();

    return () => { cancelled = true; };
  }, [isOpen, prodcode]);

  // Re-fetch after a new price entry is added
  async function handlePriceAdded() {
    setLoading(() => true);
    setError(() => '');

    const { data, error: fetchError } = await getPriceHistory(prodcode);

    if (fetchError) {
      setError(() => 'Failed to load price history.');
      setLoading(() => false);
      return;
    }

    setHistory(() => data);
    setLoading(() => false);
  }

  if (!isOpen) return null;

  // The most recent entry is the first in the list (ordered by effdate DESC)
  const currentEntryDate = history[0]?.effdate;

  function formatPrice(p) {
    return `₱ ${Number(p).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  return (
    <div className="bg-blue-50 border border-blue-100 p-4">

      {/* Panel header */}
      <div className="flex items-center mb-3">
        <div>
          <span className="text-sm font-semibold text-blue-800">
            Price History
          </span>
          <span className="ml-2 text-xs text-blue-500 font-mono">{prodcode}</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 mb-3">
          {error}
          <button onClick={handlePriceAdded} className="ml-2 underline">Retry</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && history.length === 0 && (
        <p className="text-xs text-blue-400 text-center py-4">
          No price history recorded yet. Add the first price entry below.
        </p>
      )}

      {/* History table */}
      {!loading && !error && history.length > 0 && (
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-blue-600 font-semibold">
                <th className="text-left pb-2 pr-4">Effective Date</th>
                <th className="text-right pb-2 pr-4">Unit Price</th>
                {/* Stamp — absent from DOM for USER */}
                {showPriceHistStamp && (
                  <th className="text-left pb-2 pr-4">Stamp</th>
                )}
                <th className="text-left pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => {
                const isCurrent = entry.effdate === currentEntryDate;
                return (
                  <tr
                    key={`${entry.prodcode}-${entry.effdate}`}
                    className={isCurrent ? 'text-blue-900 font-medium' : 'text-blue-700'}
                  >
                    <td className="py-1 pr-4 font-mono">
                      {formatDate(entry.effdate)}
                    </td>
                    <td className="py-1 pr-4 tabular-nums text-right">
                      {formatPrice(entry.unitprice)}
                    </td>
                    {/* Stamp — absent from DOM for USER (project guide Section 9.3) */}
                    {showPriceHistStamp && (
                      <td className="py-1 pr-4 font-mono text-blue-400">
                        {entry.stamp ?? '—'}
                      </td>
                    )}
                    <td className="py-1">
                      {isCurrent ? (
                        <span className="inline-block bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                          CURRENT
                        </span>
                      ) : (
                        <span className="text-blue-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Price Entry Form — always visible inside the open panel */}
      <AddPriceEntryForm
        prodcode={prodcode}
        onSuccess={handlePriceAdded}
      />

    </div>
  );
}