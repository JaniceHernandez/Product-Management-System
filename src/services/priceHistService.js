// src/services/priceHistService.js
// Data-access layer for the pricehist table.
// All price-history components import from here.

import { supabase }  from '../lib/supabaseClient';
import { makeStamp } from '../utils/stampHelper';

// ── getPriceHistory ────────────────────────────────────────────
// US-15: Fetch all price history entries for a product.
// Returns rows ordered newest first (most recent effdate first).
// The stamp column is included — visibility is controlled in the UI
// layer (shown to ADMIN/SUPERADMIN, hidden from USER — S2-T12).
//
// @param {string} prodcode - FK to product table
// @returns {{ data: Array, error: object|null }}
export async function getPriceHistory(prodcode) {
  const { data, error } = await supabase
    .from('pricehist')
    .select('effdate, prodcode, unitprice, stamp')
    .eq('prodcode', prodcode)
    .order('effdate', { ascending: false });

  if (error) {
    console.error('getPriceHistory error:', error.message);
    return { data: [], error };
  }

  return { data: data ?? [], error: null };
}

// ── addPriceEntry ──────────────────────────────────────────────
// US-16: Add a new price record for a product.
// US-29: Stamp recorded on every write.
//
// A new price entry is inserted with the effective date provided by the user.
// It does not delete or update previous entries — price history is immutable
// and accumulative. The new entry becomes the "current price" if its effdate
// is later than all existing entries.
//
// Called by AddPriceEntryForm (S2-T06), available to all authenticated users
// who have access to the product detail view. The UI may add additional role
// gating — this service function itself has no role check.
//
// @param {string} prodcode
// @param {string} effdate   - Format: 'YYYY-MM-DD'
// @param {number} unitprice - Must be > 0 (enforced by DB CHECK constraint)
// @param {string} userId    - currentUser.userid
// @returns {{ data: object|null, error: object|null }}
export async function addPriceEntry(prodcode, effdate, unitprice, userId) {
  // Validate unitprice before hitting the database
  if (!unitprice || Number(unitprice) <= 0) {
    return {
      data: null,
      error: { message: 'Unit price must be greater than 0.' },
    };
  }

  const stamp = makeStamp('ADDED', userId);

  const { data, error } = await supabase
    .from('pricehist')
    .insert({
      prodcode,
      effdate,
      unitprice: Number(unitprice),
      stamp,
    })
    .select()
    .single();

  if (error) {
    // Provide a user-friendly message for the most common constraint violations
    if (error.message.includes('unitp_ck') || error.message.includes('check')) {
      return { data: null, error: { message: 'Unit price must be greater than 0.' } };
    }
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      return {
        data: null,
        error: { message: `A price entry for ${prodcode} on ${effdate} already exists.` },
      };
    }
    console.error('addPriceEntry error:', error.message);
    return { data: null, error };
  }

  return { data, error: null };
}

// ── getCurrentPrice ────────────────────────────────────────────
// US-17: Get the current (most recent) price for a single product.
//
// Attempts to use the current_product_price view (S2-T10).
// Falls back to a direct max-date query if the view is not yet deployed.
//
// @param {string} prodcode
// @returns {{ unitprice: number|null, effdate: string|null, error: object|null }}
export async function getCurrentPrice(prodcode) {
  // Try the view first (available after S2-T10 merges)
  const { data: viewData, error: viewError } = await supabase
    .from('current_product_price')
    .select('prodcode, unitprice, effdate')
    .eq('prodcode', prodcode)
    .maybeSingle();

  if (!viewError && viewData) {
    return { unitprice: viewData.unitprice, effdate: viewData.effdate, error: null };
  }

  // Fallback: direct query — get the most recent pricehist row for this product
  const { data, error } = await supabase
    .from('pricehist')
    .select('unitprice, effdate')
    .eq('prodcode', prodcode)
    .order('effdate', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('getCurrentPrice fallback error:', error.message);
    return { unitprice: null, effdate: null, error };
  }

  return {
    unitprice: data?.unitprice ?? null,
    effdate:   data?.effdate   ?? null,
    error:     null,
  };
}

// ── getAllCurrentPrices ────────────────────────────────────────
// Returns current prices for all products — used by ProductListPage (S2-T04)
// to populate the price column without making N individual getCurrentPrice calls.
//
// Attempts to use the current_product_price view (S2-T10).
// Falls back to a subquery approach if the view is not deployed.
//
// @returns {{ data: Array<{ prodcode, unitprice, effdate }>, error: object|null }}
export async function getAllCurrentPrices() {
  // Try the view first
  const { data: viewData, error: viewError } = await supabase
    .from('current_product_price')
    .select('prodcode, unitprice, effdate');

  if (!viewError && viewData) {
    return { data: viewData ?? [], error: null };
  }

  // Fallback: fetch all pricehist rows and reduce in JS
  // (Less efficient but works before the view is deployed)
  const { data, error } = await supabase
    .from('pricehist')
    .select('prodcode, unitprice, effdate')
    .order('effdate', { ascending: false });

  if (error) {
    console.error('getAllCurrentPrices fallback error:', error.message);
    return { data: [], error };
  }

  // Keep only the most recent entry per product
  const priceMap = new Map();
  for (const row of (data ?? [])) {
    if (!priceMap.has(row.prodcode)) {
      priceMap.set(row.prodcode, row);
    }
  }

  return { data: Array.from(priceMap.values()), error: null };
}