// src/services/reportService.js
// Data-access layer for the Reports module.
// REP_001: getProductReport() — product listing with current price
// REP_002: getTopSellingProducts() — top 10 products by quantity sold
// Components import from here — never call supabase.from('view_name') directly.

import { supabase } from '../lib/supabaseClient';

// ── getProductReport ───────────────────────────────────────────
// US-18: Product listing report (REP_001).
// US-20: Returns structured data used for CSV export.
//
// Queries the current_product_price view (S2-T10) which returns:
//   prodcode, description, unit, unitprice, effdate, record_status
// All rows are ACTIVE (view filters INACTIVE products).
//
// @param {object} options - Optional query modifiers
// @param {string} options.search - Filter by prodcode or description (client-side)
// @param {string} options.sortField - Column to sort by (default: 'prodcode')
// @param {string} options.sortDirection - 'asc' or 'desc' (default: 'asc')
// @returns {{ data: Array, error: object|null }}
export async function getProductReport({ search = '', sortField = 'prodcode', sortDirection = 'asc' } = {}) {
  const { data, error } = await supabase
    .from('current_product_price')
    .select('prodcode, description, unit, unitprice, effdate')
    .order(sortField, { ascending: sortDirection === 'asc' });

  if (error) {
    console.error('getProductReport error:', error.message);
    return { data: [], error };
  }

  // Apply search filter in JS (view does not support ILIKE without PostgREST params)
  const filtered = search
    ? (data ?? []).filter(row =>
        row.prodcode.toLowerCase().includes(search.toLowerCase()) ||
        row.description.toLowerCase().includes(search.toLowerCase())
      )
    : (data ?? []);

  return { data: filtered, error: null };
}

// ── getTopSellingProducts ──────────────────────────────────────
// US-19: Top-selling products report (REP_002) — SUPERADMIN only.
//
// Queries the top_selling_products view (S3-T06) which returns:
//   prodcode, description, unit, totalqty
// View is pre-sorted DESC by totalqty and limited to 10 rows.
// No additional filtering needed — the view handles everything.
//
// @returns {{ data: Array, error: object|null }}
export async function getTopSellingProducts() {
  const { data, error } = await supabase
    .from('top_selling_products')
    .select('prodcode, description, unit, totalqty');

  if (error) {
    console.error('getTopSellingProducts error:', error.message);
    return { data: [], error };
  }

  return { data: data ?? [], error: null };
}