// src/services/priceHistService.js

import { supabase }  from '../lib/supabaseClient';
import { makeStamp } from '../utils/stampHelper';
import { logActivity } from './activityLogService';

// ── getPriceHistory ────────────────────────────────────────────
export async function getPriceHistory(prodcode) {
  const { data, error } = await supabase
    .from('pricehist')
    .select('effdate, prodcode, unitprice, stamp')
    .eq('prodcode', prodcode)
    .order('effdate', { ascending: false });

  if (error) {
    return { data: [], error };
  }

  return { data: data ?? [], error: null };
}

// ── addPriceEntry ──────────────────────────────────────────────
export async function addPriceEntry(prodcode, effdate, unitprice, currentUser) {
  const stamp = makeStamp('ADDED');
  // Validate unitprice before hitting the database
  if (!unitprice || Number(unitprice) <= 0) {
    return {
      data: null,
      error: { message: 'Unit price must be greater than 0.' },
    };
  }

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
    return { data: null, error };
  }

  await logActivity({
    actorId:     currentUser.userid,
    actorEmail:  currentUser.email,
    actorRole:   currentUser.user_type,
    action:      'PRICE_ADDED',
    targetTable: 'pricehist',
    targetId:    prodcode,
    detail:      `Added price ₱${unitprice} for ${prodcode} effective ${effdate}`,
  });

  return { data, error: null };
}

// ── getCurrentPrice ────────────────────────────────────────────
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
    return { unitprice: null, effdate: null, error };
  }

  return {
    unitprice: data?.unitprice ?? null,
    effdate:   data?.effdate   ?? null,
    error:     null,
  };
}

// ── getAllCurrentPrices ────────────────────────────────────────
export async function getAllCurrentPrices() {
  // Try the view first
  const { data: viewData, error: viewError } = await supabase
    .from('current_product_price')
    .select('prodcode, unitprice, effdate');

  if (!viewError && viewData) {
    return { data: viewData ?? [], error: null };
  }

  const { data, error } = await supabase
    .from('pricehist')
    .select('prodcode, unitprice, effdate')
    .order('effdate', { ascending: false });

  if (error) {
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