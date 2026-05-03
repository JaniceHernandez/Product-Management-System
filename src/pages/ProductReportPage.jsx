// src/pages/ProductReportPage.jsx
// Unified Reports hub — three tabs:
//   1. All Products  (REP_001) — all roles
//   2. Top Selling   (REP_002, SUPERADMIN only)
//   3. Price Trends  (SUPERADMIN only — same guard as Top Selling)
// No logic changes to existing data-fetching; only UI restructured.

import { useState } from 'react';
import { useRights } from '../hooks/useRights';
import ReportTabAllProducts  from '../components/reports/ReportTabAllProducts';
import ReportTabTopSelling   from '../components/reports/ReportTabTopSelling';
import ReportTabPriceTrends  from '../components/reports/ReportTabPriceTrends';

// ── SVG Icons ────────────────────────────────────────────────────────────────
function IconTable() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M3 15h18M9 3v18"/>
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  );
}
function IconTrend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'all-products', label: 'All Products', Icon: IconTable },
  { id: 'top-selling',  label: 'Top Selling',  Icon: IconTrophy },
  { id: 'price-trends', label: 'Price Trends', Icon: IconTrend },
];

export default function ProductReportPage() {
  const { canViewReports, canViewTopSelling } = useRights();
  const [activeTab, setActiveTab] = useState('all-products');

  if (!canViewReports) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>You do not have permission to view reports.</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full">

      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Analytics and data exports for products, sales, and pricing.
        </p>
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────── */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {TABS.map(({ id, label, Icon }) => {
          // Both Top Selling and Price Trends are SUPERADMIN only
          if ((id === 'top-selling' || id === 'price-trends') && !canViewTopSelling) return null;

          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={[
                'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all duration-150 select-none whitespace-nowrap',
                isActive
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ].join(' ')}
            >
              <span className={isActive ? 'text-pink-500' : 'text-gray-400'}>
                <Icon />
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────── */}
      <div>
        {activeTab === 'all-products' && <ReportTabAllProducts />}
        {activeTab === 'top-selling'  && canViewTopSelling && <ReportTabTopSelling />}
        {activeTab === 'price-trends' && canViewTopSelling && <ReportTabPriceTrends />}
      </div>

    </div>
  );
}