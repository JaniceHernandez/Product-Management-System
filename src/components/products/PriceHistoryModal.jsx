// src/components/products/PriceHistoryModal.jsx
import { useProductRights } from '../../hooks/useProductRights';
import { useState, useEffect, useRef } from 'react';
import { useStampVisibility } from '../../hooks/useStampVisibility';
import { useAuth } from '../../hooks/useAuth';
import { getPriceHistory } from '../../services/priceHistService';
import { addPriceEntry } from '../../services/priceHistService';

export default function PriceHistoryModal({ prodcode, productName, onClose }) {
  const { currentUser } = useAuth();
  const { showPriceHistStamp } = useStampVisibility();
  const { canAdd } = useProductRights();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Add price form state
  const [effdate, setEffdate] = useState('');
  const [unitprice, setUnitprice] = useState('');
  const [notes, setNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [sortOrder, setSortOrder] = useState('desc');

  const today = new Date().toISOString().slice(0, 10);
  const canvasRef = useRef(null);

  useEffect(() => {
    setEffdate(today);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await getPriceHistory(prodcode);
      if (cancelled) return;
      if (fetchError) { setError('Failed to load price history.'); setLoading(false); return; }
      setHistory(data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [prodcode]);

  const animRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || history.length < 1) return;
    // Cancel any previous animation, then kick off after layout
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const id = requestAnimationFrame(() => drawChart(0));
    animRef.current = id;
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [history]);

  function drawChart(progress = 1) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const PAD = { top: 24, right: 32, bottom: 44, left: 64 };

    const sorted = [...history].sort((a, b) => new Date(a.effdate) - new Date(b.effdate));
    const prices = sorted.map(e => Number(e.unitprice));

    // ── Single-point: render a centered dot + label ──────────
    if (sorted.length === 1) {
      const cx = W / 2;
      const cy = H / 2 - 10;
      const price = prices[0];

      // Subtle horizontal dashed baseline
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(244,63,94,0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PAD.left, cy);
      ctx.lineTo(W - PAD.right, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Glow halo
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 36);
      halo.addColorStop(0, 'rgba(236,72,153,0.18)');
      halo.addColorStop(1, 'rgba(236,72,153,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, 36, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(244,63,94,0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // White fill
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Pink dot
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f43f5e';
      ctx.fill();

      // Price label above
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 14px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('₱' + price.toLocaleString('en-PH', { minimumFractionDigits: 2 }), cx, cy - 20);

      // Date label below
      ctx.fillStyle = 'rgba(156,163,175,0.9)';
      ctx.font = '11px system-ui';
      ctx.fillText(new Date(sorted[0].effdate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }), cx, cy + 26);

      // "Add more entries to see a trend" hint
      ctx.fillStyle = 'rgba(209,213,219,0.9)';
      ctx.font = '10px system-ui';
      ctx.fillText('Add more price entries to see a trend chart', cx, H - 10);
      return;
    }

    // ── Multi-point chart ────────────────────────────────────
    const minP = Math.min(...prices) * 0.92;
    const maxP = Math.max(...prices) * 1.08;
    const rangeP = maxP - minP || 1;

    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    function px(i) { return PAD.left + (i / (sorted.length - 1)) * plotW; }
    function py(val) { return PAD.top + plotH - ((val - minP) / rangeP) * plotH; }

    // Grid lines
    ctx.strokeStyle = 'rgba(244,63,94,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + (i / 4) * plotH;
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
      const val = maxP - (i / 4) * rangeP;
      ctx.fillStyle = 'rgba(156,163,175,0.9)';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText('₱' + val.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }), PAD.left - 8, y + 3);
    }

    // Gradient fill under line
    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + plotH);
    grad.addColorStop(0, 'rgba(236,72,153,0.22)');
    grad.addColorStop(1, 'rgba(236,72,153,0.0)');

    // Clip to animated progress (left→right reveal)
    const clipX = PAD.left + progress * plotW;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, clipX, H);
    ctx.clip();

    // Filled area
    ctx.beginPath();
    ctx.moveTo(px(0), py(prices[0]));
    for (let i = 1; i < sorted.length; i++) {
      const x0 = px(i - 1), y0 = py(prices[i - 1]);
      const x1 = px(i), y1 = py(prices[i]);
      const cxm = (x0 + x1) / 2;
      ctx.bezierCurveTo(cxm, y0, cxm, y1, x1, y1);
    }
    ctx.lineTo(px(sorted.length - 1), PAD.top + plotH);
    ctx.lineTo(px(0), PAD.top + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Animated line stroke
    ctx.beginPath();
    ctx.moveTo(px(0), py(prices[0]));
    for (let i = 1; i < sorted.length; i++) {
      const x0 = px(i - 1), y0 = py(prices[i - 1]);
      const x1 = px(i), y1 = py(prices[i]);
      const cx2 = (x0 + x1) / 2;
      ctx.bezierCurveTo(cx2, y0, cx2, y1, x1, y1);
    }
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // Points — only draw those within progress
    sorted.forEach((entry, i) => {
      const x = px(i), y = py(prices[i]);
      if (x > clipX + 2) return; // not yet revealed
      const isCurrent = i === sorted.length - 1;

      if (isCurrent) {
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(236,72,153,0.12)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, isCurrent ? 5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = isCurrent ? '#f43f5e' : '#ec4899';
      ctx.lineWidth = isCurrent ? 2.5 : 2;
      ctx.stroke();

      // X-axis date labels
      if (sorted.length <= 6 || i === 0 || i === sorted.length - 1 || i % Math.ceil(sorted.length / 5) === 0) {
        ctx.fillStyle = 'rgba(156,163,175,0.9)';
        ctx.font = '9px system-ui';
        ctx.textAlign = 'center';
        const label = new Date(entry.effdate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
        ctx.fillText(label, x, H - PAD.bottom + 16);
      }

      // Tooltip above current point (only at end)
      if (isCurrent && progress >= 0.98) {
        const label = '₱' + prices[i].toLocaleString('en-PH', { minimumFractionDigits: 2 });
        ctx.font = 'bold 11px ui-monospace, monospace';
        const tw = ctx.measureText(label).width + 14;
        const bx = Math.min(Math.max(x - tw / 2, PAD.left), W - PAD.right - tw);
        const by = y - 28;
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.roundRect(bx, by, tw, 18, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(label, bx + tw / 2, by + 12);
      }
    });

    // Continue animation if not done — ease-out-cubic
    if (progress < 1) {
      const next = Math.min(progress + 0.032, 1); // ~30 frames for ~1s
      const eased = 1 - Math.pow(1 - next, 3);
      animRef.current = requestAnimationFrame(() => drawChart(eased));
    }
  }

  async function refetch() {
    const { data, error: fetchError } = await getPriceHistory(prodcode);
    if (!fetchError) setHistory(data ?? []);
  }

  function validate() {
    const errors = {};
    if (!effdate) errors.effdate = 'Required.';
    else if (effdate > today) errors.effdate = 'Cannot be in the future.';
    const price = Number(unitprice);
    if (!unitprice) errors.unitprice = 'Required.';
    else if (isNaN(price) || price <= 0) errors.unitprice = 'Must be > 0.';
    return errors;
  }

  async function handleAddPrice() {
    setFormError('');
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setFormLoading(true);
    const { error: apiError } = await addPriceEntry(prodcode, effdate, Number(unitprice), currentUser, notes || null);
    setFormLoading(false);
    if (apiError) { setFormError(apiError.message ?? 'Failed to add price.'); return; }
    setEffdate(today);
    setUnitprice('');
    setNotes('');
    await refetch();
  }

  const sortedHistory = [...history].sort((a, b) => {
    const da = new Date(a.effdate), db = new Date(b.effdate);
    return sortOrder === 'desc' ? db - da : da - db;
  });

  const currentEntryDate = [...history].sort((a, b) => new Date(b.effdate) - new Date(a.effdate))[0]?.effdate;

  function formatPrice(p) {
    return `₱${Number(p).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  }
  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ border: '1px solid rgba(244,63,94,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#fce7f3,#fdf2f8)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Price History</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs font-semibold text-pink-600">{prodcode}</span>
                {productName && <span className="text-xs text-gray-400">· {productName}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none">
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Chart area — shown as soon as there's ≥1 record */}
          {!loading && history.length >= 1 && (
            <div className="px-6 pt-5 pb-2">
              <div className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#fff5f7,#fdf2f8)', border: '1px solid rgba(244,63,94,0.1)', height: 190 }}>
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 border-[3px] border-pink-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="mx-6 mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <span>{error}</span>
              <button onClick={refetch} className="ml-auto underline text-xs">Retry</button>
            </div>
          )}

          {/* History table */}
          {!loading && !error && (
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  {history.length} Record{history.length !== 1 ? 's' : ''}
                </span>
                {history.length > 1 && (
                  <button
                    onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
                    className="text-xs text-pink-500 hover:text-pink-700 flex items-center gap-1 font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" style={{width:12,height:12}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
                    </svg>
                    {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No price history yet. Add the first entry below.</p>
              ) : (
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Effective Date</th>
                        <th className="text-right px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Unit Price</th>
                        {showPriceHistStamp && (
                          <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Stamp</th>
                        )}
                        <th className="text-center px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sortedHistory.map((entry) => {
                        const isCurrent = entry.effdate === currentEntryDate;
                        return (
                          <tr key={`${entry.prodcode}-${entry.effdate}`}
                            className={`transition-colors ${isCurrent ? 'bg-pink-50/60' : 'hover:bg-gray-50/60'}`}>
                            <td className="px-4 py-2.5 font-mono text-gray-700">{formatDate(entry.effdate)}</td>
                            <td className={`px-4 py-2.5 tabular-nums text-right font-mono font-bold ${isCurrent ? 'text-pink-700' : 'text-gray-700'}`}>
                              {formatPrice(entry.unitprice)}
                            </td>
                            {showPriceHistStamp && (
                              <td className="px-4 py-2.5 font-mono text-gray-400">{entry.stamp ?? '—'}</td>
                            )}
                            <td className="px-4 py-2.5 text-center">
                              {isCurrent ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
                                  style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)', color: '#fff' }}>
                                  CURRENT
                                </span>
                              ) : (
                                <span className="text-gray-300 text-[10px]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Add New Price Entry */}
          <div className="px-6 pt-4 pb-6">
            <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg,#fff5f7,#fdf2f8)', border: '1px solid rgba(244,63,94,0.12)' }}>
              <p className="text-xs font-bold text-pink-700 uppercase tracking-widest mb-3">Add New Price Entry</p>

              {formError && (
                <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{formError}</div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Effective Date</label>
                  <input type="date" value={effdate} onChange={e => setEffdate(e.target.value)} max={today}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white ${fieldErrors.effdate ? 'border-red-400' : 'border-gray-200'}`} />
                  {fieldErrors.effdate && <p className="mt-0.5 text-[10px] text-red-600">{fieldErrors.effdate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Unit Price (₱)</label>
                  <input type="number" value={unitprice} onChange={e => setUnitprice(e.target.value)} min="0.01" step="0.01" placeholder="0.00"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white ${fieldErrors.unitprice ? 'border-red-400' : 'border-gray-200'}`} />
                  {fieldErrors.unitprice && <p className="mt-0.5 text-[10px] text-red-600">{fieldErrors.unitprice}</p>}
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Reason / Notes <span className="font-normal text-gray-400">(optional)</span></label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Supplier price increase, seasonal adjustment…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white" />
              </div>

              <button onClick={handleAddPrice} disabled={formLoading}
                className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)' }}>
                {formLoading ? 'Adding…' : '+ Add Price Entry'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}