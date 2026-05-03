// src/components/reports/ReportTabPriceTrends.jsx
// Tab 3 — Price Trends (SUPERADMIN only).
// Charts:
//   1. Price Distribution — fixed ₱400 bins (0–400, 401–800, …), animated upward
//   2. Top 5 Most Expensive — horizontal bars, animated sideway
// Side by side. No average-over-time chart.
// No external chart library — pure SVG + CSS animation.
//
// CHANGES FROM PREVIOUS VERSION:
//   1. ChartCard background — changed from #fdf2f8 (pink) → white, border rgba(0,0,0,0.07)
//      to match All Products table card and Top Selling cards
//   2. ChartCard header — border-b changed from border-pink-100 → border-gray-100
//   3. ChartCard subtitle — text-pink-400 → text-gray-400 (consistent with other tabs)
//   4. SVG gridlines — updated from #fce7f3 to #f3f4f6 (visible on white bg)
//   5. SVG axis label text — updated from #f9a8d4 to #9ca3af (gray-400, readable on white)
//   6. Top 5 bar track — updated from #fce7f3 to #f3f4f6 (consistent with Top Selling bars)
//   7. Top 5 price label — updated from fill="#374151" to fill="#374151" (kept — already correct)
//   8. ChartCard title color — text-gray-800 kept, consistent
//   9. Icon color — text-pink-500 kept for accent, consistent with tab icons

import { useState, useEffect, useMemo } from 'react';
import { useRights }        from '../../hooks/useRights';
import { getProductReport } from '../../services/reportService';
import LoadingSpinner       from '../ui/LoadingSpinner';
import ErrorBanner          from '../ui/ErrorBanner';

// ── Pink palette (bars only — not backgrounds) ────────────────────────────────
const PINK2      = '#ec4899';
const PINK3      = '#d946ef';
const PINK_BARS  = ['#f43f5e', '#ec4899', '#d946ef', '#f472b6', '#fb7185'];

// ── CSS keyframe injection (runs once) ───────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('price-trends-anim')) {
  const s = document.createElement('style');
  s.id = 'price-trends-anim';
  s.textContent = `
    @keyframes ptGrowUp {
      from { transform: scaleY(0); }
      to   { transform: scaleY(1); }
    }
    @keyframes ptGrowRight {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }
    .pt-bar-up {
      transform-origin: 50% 100%;
      animation: ptGrowUp 0.55s cubic-bezier(.22,.68,0,1.15) both;
    }
    .pt-bar-right {
      transform-origin: 0% 50%;
      animation: ptGrowRight 0.55s cubic-bezier(.22,.68,0,1.15) both;
    }
  `;
  document.head.appendChild(s);
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconDistrib() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="4" height="18"/>
      <rect x="9" y="8" width="4" height="13"/>
      <rect x="16" y="13" width="4" height="8"/>
    </svg>
  );
}
function IconTop5() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 20 18 10"/>
      <polyline points="12 20 12 4"/>
      <polyline points="6 20 6 14"/>
    </svg>
  );
}

// ── Chart Card ────────────────────────────────────────────────────────────────
// CHANGE: bg-white + rgba border to match All Products table card and Top Selling cards
// CHANGE: border-b border-gray-100 (was border-pink-100)
// CHANGE: subtitle text-gray-400 (was text-pink-400)
function ChartCard({ title, subtitle, icon: Icon, children }) {
  return (
    <div
      className="flex-1 min-w-0 rounded-2xl overflow-hidden bg-white shadow-sm"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}
    >
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-pink-500"><Icon /></span>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Chart 1: Price Distribution — fixed ₱400 bins ────────────────────────────
const BIN_SIZE  = 400;
const BIN_COUNT = 8;

function PriceDistributionChart({ rows, animate }) {
  const W = 460, H = 220;
  const PAD = { t: 24, r: 10, b: 46, l: 38 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const bins = useMemo(() => {
    const prices = rows.map(r => Number(r.unitprice)).filter(p => p > 0);
    const buckets = Array.from({ length: BIN_COUNT }, (_, i) => ({
      shortLabel: i < BIN_COUNT - 1
        ? `${(i * BIN_SIZE).toLocaleString()}–${((i + 1) * BIN_SIZE).toLocaleString()}`
        : `${(i * BIN_SIZE).toLocaleString()}+`,
      count: 0,
    }));
    prices.forEach(p => {
      const idx = Math.min(Math.floor(p / BIN_SIZE), BIN_COUNT - 1);
      buckets[idx].count++;
    });
    return buckets;
  }, [rows]);

  const maxCount = Math.max(...bins.map(b => b.count), 1);
  const barW     = innerW / BIN_COUNT;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 230 }}>
      {/* Y gridlines — CHANGE: #f3f4f6 (gray-100) instead of #fce7f3 — visible on white */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y   = PAD.t + innerH * (1 - t);
        const val = Math.round(maxCount * t);
        return (
          <g key={t}>
            <line
              x1={PAD.l} y1={y} x2={PAD.l + innerW} y2={y}
              stroke="#f3f4f6"
              strokeWidth="1"
              strokeDasharray={t > 0 ? '3 3' : '0'}
            />
            {/* CHANGE: fill #9ca3af (gray-400) instead of #f9a8d4 — readable on white */}
            <text x={PAD.l - 5} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
              {val}
            </text>
          </g>
        );
      })}

      {/* Bars — animation: upward (scaleY from bottom) */}
      {bins.map((bin, i) => {
        const barH  = Math.max((bin.count / maxCount) * innerH, bin.count > 0 ? 3 : 0);
        const x     = PAD.l + i * barW;
        const y     = PAD.t + innerH - barH;
        const delay = `${i * 0.06}s`;
        const fill  = i % 2 === 0 ? PINK2 : PINK3;
        const opacity = 0.65 + (bin.count / maxCount) * 0.35;

        return (
          <g key={i}>
            <rect
              x={x + 3} y={y}
              width={barW - 6} height={barH}
              rx="4"
              fill={fill}
              fillOpacity={opacity}
              className={animate ? 'pt-bar-up' : ''}
              style={animate ? { animationDelay: delay } : {}}
            />
            {bin.count > 0 && (
              <text
                x={x + barW / 2} y={y - 5}
                textAnchor="middle" fontSize="9" fontWeight="700" fill={PINK2}
              >
                {bin.count}
              </text>
            )}
            {/* X label — CHANGE: fill #9ca3af for readability on white */}
            <text
              x={0} y={0}
              textAnchor="end"
              fontSize="7.5"
              fill="#9ca3af"
              transform={`translate(${x + barW / 2 + 4}, ${PAD.t + innerH + 10}) rotate(-38)`}
            >
              {bin.shortLabel}
            </text>
          </g>
        );
      })}

      {/* Axes — CHANGE: #e5e7eb (gray-200) instead of #fce7f3 */}
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + innerH} stroke="#e5e7eb" strokeWidth="1"/>
      <line x1={PAD.l} y1={PAD.t + innerH} x2={PAD.l + innerW} y2={PAD.t + innerH} stroke="#e5e7eb" strokeWidth="1"/>

      {/* X axis label — CHANGE: fill #9ca3af */}
      <text x={PAD.l + innerW / 2} y={H - 1} textAnchor="middle" fontSize="8" fill="#9ca3af">
        Price range (₱) — per 400
      </text>
    </svg>
  );
}

// ── Chart 2: Top 5 Most Expensive — animated horizontal bars ─────────────────
function TopExpensiveChart({ rows, animate }) {
  const top5 = useMemo(() =>
    [...rows]
      .filter(r => r.unitprice != null)
      .sort((a, b) => Number(b.unitprice) - Number(a.unitprice))
      .slice(0, 5),
    [rows]
  );

  if (!top5.length) return <p className="text-xs text-gray-400 text-center py-8">No data</p>;

  const maxPrice = Number(top5[0].unitprice);
  const ROW_H    = 46;
  const W        = 460;
  const LABEL_W  = 74;
  const VAL_W    = 84;
  const BAR_AREA = W - LABEL_W - VAL_W - 8;
  const H        = top5.length * ROW_H + 8;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 250 }}>
      {top5.map((row, i) => {
        const pct   = Number(row.unitprice) / maxPrice;
        const barW  = Math.max(pct * BAR_AREA, 4);
        const y     = i * ROW_H + 4;
        const cy    = y + ROW_H / 2;
        const delay = `${i * 0.09}s`;
        const fill  = PINK_BARS[i] ?? '#fbcfe8';

        return (
          <g key={row.prodcode}>
            {/* Code — CHANGE: fill #374151 (gray-700) matching All Products code style */}
            <text
              x={LABEL_W - 8} y={cy - 5}
              textAnchor="end" fontSize="9" fill="#374151" fontWeight="800"
              fontFamily="monospace"
            >
              {row.prodcode}
            </text>
            {/* Description — CHANGE: fill #9ca3af (gray-400) readable on white */}
            <text
              x={LABEL_W - 8} y={cy + 8}
              textAnchor="end" fontSize="7.5" fill="#9ca3af"
            >
              {(row.description ?? '').slice(0, 13)}{(row.description ?? '').length > 13 ? '…' : ''}
            </text>

            {/* Track — CHANGE: #f3f4f6 (gray-100) instead of #fce7f3 — matches Top Selling bars */}
            <rect x={LABEL_W} y={cy - 9} width={BAR_AREA} height={18} rx="5" fill="#f3f4f6"/>

            {/* Animated fill — sideway from left */}
            <rect
              x={LABEL_W} y={cy - 9}
              width={barW} height={18}
              rx="5"
              fill={fill}
              fillOpacity="0.88"
              className={animate ? 'pt-bar-right' : ''}
              style={animate ? { animationDelay: delay } : {}}
            />

            {/* Price label — gray-700, consistent */}
            <text
              x={LABEL_W + BAR_AREA + 6} y={cy + 5}
              fontSize="9" fill="#374151" fontWeight="700"
            >
              ₱{Number(row.unitprice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReportTabPriceTrends() {
  const { canViewTopSelling } = useRights();

  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [animate, setAnimate] = useState(false);

  async function fetchAll() {
    setLoading(true);
    setError('');
    setAnimate(false);

    const { data, error: fetchError } = await getProductReport();

    if (fetchError) {
      setError('Failed to load price trend data. Please try again.');
      setLoading(false);
      return;
    }

    setRows(data);
    setLoading(false);
    requestAnimationFrame(() => setTimeout(() => setAnimate(true), 60));
  }

  useEffect(() => {
    if (!canViewTopSelling) return;
    fetchAll();
  }, [canViewTopSelling]);

  if (!canViewTopSelling) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Price Trends is only available to SUPERADMIN accounts.</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorBanner message={error} onRetry={fetchAll} />;

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <ChartCard
        icon={IconDistrib}
        title="Price Distribution"
        subtitle="Products per ₱400 price range"
      >
        <PriceDistributionChart rows={rows} animate={animate} />
      </ChartCard>

      <ChartCard
        icon={IconTop5}
        title="Top 5 Most Expensive"
        subtitle="Products ranked by current unit price"
      >
        <TopExpensiveChart rows={rows} animate={animate} />
      </ChartCard>
    </div>
  );
}