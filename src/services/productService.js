// src/services/productService.js
// Data-access layer for the product table.
// All components import from here — never call supabase.from('product') directly.

import { supabase }  from '../lib/supabaseClient';
import { makeStamp } from '../utils/stampHelper';
import { logActivity } from './activityLogService';

// ── getProducts ────────────────────────────────────────────────
// US-08: Fetch the product list.
// US-12: USER sees only ACTIVE rows (client-side filter + RLS).
// US-13: ADMIN/SUPERADMIN see all rows.
//
// Joins the current_product_price view (S2-T10) to include the
// latest unit price per product. Falls back to null if the view
// is not yet available.
//
// @param {string} userType - 'USER' | 'ADMIN' | 'SUPERADMIN'
// @returns {{ data: Array, error: object|null }}
export async function getProducts(userType) {
  // Select product columns + current price from the view (added after S2-T10 merges)
  // If the view does not yet exist, use the simpler select below instead.
  let query = supabase
    .from('product')
    .select(`
      prodcode,
      description,
      unit,
      record_status,
      stamp,
      current_product_price ( unitprice, effdate )
    `)
    .order('prodcode');

  // Layer 1 filter: USER accounts always get only ACTIVE rows
  if (userType === 'USER') {
    query = query.eq('record_status', 'ACTIVE');
  }
  // ADMIN / SUPERADMIN: no filter — sees both ACTIVE and INACTIVE

  const { data, error } = await query;

  if (error) {
    // Fallback: if the view join fails (view not deployed yet), fetch without price
    if (error.message.includes('current_product_price')) {
      console.warn('getProducts: current_product_price view not available, fetching without price');
      return getProductsWithoutPrice(userType);
    }
    console.error('getProducts error:', error.message);
    return { data: [], error };
  }

  return { data: data ?? [], error: null };
}

// Internal fallback used until S2-T10 (current_product_price view) is deployed
async function getProductsWithoutPrice(userType) {
  let query = supabase
    .from('product')
    .select('prodcode, description, unit, record_status, stamp')
    .order('prodcode');

  if (userType === 'USER') {
    query = query.eq('record_status', 'ACTIVE');
  }

  const { data, error } = await query;
  return { data: data ?? [], error: error ?? null };
}

// ── addProduct ─────────────────────────────────────────────────
// US-09: Add a new product.
// US-29: Stamp recorded on every write.
// Gated in UI by PRD_ADD = 1 (UserRightsContext — S2-T11).
// RLS INSERT policy enforced at DB level by S2-T09.
//
// @param {{ prodcode: string, description: string, unit: string }} product
// @param {string} userId - currentUser.userid
// @returns {{ data: object|null, error: object|null }}
export async function addProductWithPrice(productData, priceData, currentUser) {
  const productStamp = makeStamp('ADDED');
  const priceStamp = makeStamp('ADDED');

  // 1. Insert product
  const { data: product, error: productError } = await supabase
    .from('product')
    .insert({ ...productData, record_status: 'ACTIVE', stamp: productStamp })
    .select()
    .single();

  if (productError) {
    console.error('addProductWithPrice - product insert error:', productError.message);
    return { data: null, error: productError };
  }

  // 2. Insert price history entry
  const { error: priceError } = await supabase
    .from('pricehist')
    .insert({
      prodcode: productData.prodcode,
      effdate: priceData.effdate,
      unitprice: Number(priceData.unitprice),
      stamp: priceStamp,
    });

  if (priceError) {
    // Rollback: delete the product we just created
    await supabase.from('product').delete().eq('prodcode', productData.prodcode);
    console.error('addProductWithPrice - price insert error:', priceError.message);
    return { data: null, error: priceError };
  }

  // 3. Log both actions
  await logActivity({
    actorId: currentUser.userid,
    actorEmail: currentUser.email,
    actorRole: currentUser.user_type,
    action: 'PRODUCT_ADDED',
    targetTable: 'product',
    targetId: productData.prodcode,
    detail: `Added product ${productData.prodcode} — ${productData.description ?? ''}`,
  });

  await logActivity({
    actorId: currentUser.userid,
    actorEmail: currentUser.email,
    actorRole: currentUser.user_type,
    action: 'PRICE_ADDED',
    targetTable: 'pricehist',
    targetId: productData.prodcode,
    detail: `Initial price ₱${priceData.unitprice} effective ${priceData.effdate}`,
  });

  return { data: product, error: null };
}

// ── updateProduct ──────────────────────────────────────────────
// US-10: Edit product information.
// US-29: Stamp recorded on every write.
// Gated in UI by PRD_EDIT = 1 (UserRightsContext — S2-T11).
// RLS UPDATE policy enforced at DB level by S2-T09.
//
// @param {string} prodcode - PK of the product to update
// @param {{ description?: string, unit?: string }} updates
// @param {string} userId - currentUser.userid
// @returns {{ data: object|null, error: object|null }}
export async function updateProduct(prodcode, updates, currentUser) {
  const stamp = makeStamp('EDITED');

  const { data, error } = await supabase
    .from('product')
    .update({ ...updates, stamp })
    .eq('prodcode', prodcode)
    .select()
    .single();

  if (error) {
    console.error('updateProduct error:', error.message);
    return { data: null, error };
  }

  // Log the activity — was missing previously
  await logActivity({
    actorId:     currentUser.userid,
    actorEmail:  currentUser.email,
    actorRole:   currentUser.user_type,
    action:      'PRODUCT_EDITED',
    targetTable: 'product',
    targetId:    prodcode,
    detail:      `Edited product ${prodcode}`,
  });

  return { data, error: null };
}

// ── softDeleteProduct ──────────────────────────────────────────
// US-11: SUPERADMIN soft-deletes a product.
// US-33/US-34: No hard delete — sets record_status = 'INACTIVE'.
// After this call, the product immediately disappears from USER lists
// (both the client filter and the RLS policy exclude INACTIVE rows).
// Gated in UI by PRD_DEL = 1 (SUPERADMIN only per rights matrix).
// RLS UPDATE policy enforced at DB level by S2-T09.
//
// @param {string} prodcode
// @param {string} userId - currentUser.userid
// @returns {{ error: object|null }}
export async function softDeleteProduct(prodcode, currentUser) {
  const stamp = makeStamp('DEACTIVATED');

  const { error } = await supabase
    .from('product')
    .update({ record_status: 'INACTIVE', stamp })
    .eq('prodcode', prodcode);

  if (error) {
    console.error('softDeleteProduct error:', error.message);
    return { error };
  }

  await logActivity({
    actorId:     currentUser.userid,
    actorEmail:  currentUser.email,
    actorRole:   currentUser.user_type,
    action:      'PRODUCT_DELETED',
    targetTable: 'product',
    targetId:    prodcode,
    detail:      `Soft-deleted product ${prodcode}`,
  });

  return { error: null };
}

// ── recoverProduct ─────────────────────────────────────────────
// US-14: ADMIN or SUPERADMIN recovers a soft-deleted product.
// US-35: Recover inactive records so they are visible again.
// Sets record_status back to 'ACTIVE'. Product immediately reappears
// in all users' product lists.
// Only accessible via the Deleted Items page (route-gated — S2-T03).
// RLS UPDATE policy enforced at DB level by S2-T09.
//
// @param {string} prodcode
// @param {string} userId - currentUser.userid
// @returns {{ error: object|null }}
export async function recoverProduct(prodcode, currentUser) {
  const stamp = makeStamp('REACTIVATED');

  const { error } = await supabase
    .from('product')
    .update({ record_status: 'ACTIVE', stamp })
    .eq('prodcode', prodcode);

  if (error) {
    console.error('recoverProduct error:', error.message);
    return { error };
  }

  await logActivity({
    actorId:     currentUser.userid,
    actorEmail:  currentUser.email,
    actorRole:   currentUser.user_type,
    action:      'PRODUCT_RECOVERED',
    targetTable: 'product',
    targetId:    prodcode,
    detail:      `Recovered product ${prodcode}`,
  });

  return { error: null };
}

// ── getDeletedProducts ─────────────────────────────────────────
// US-13: ADMIN/SUPERADMIN view soft-deleted (INACTIVE) products.
// Used exclusively by DeletedItemsPage (route-gated — S2-T03).
// Returns INACTIVE products with stamp visible (ADMIN/SUPERADMIN see stamp).
//
// @returns {{ data: Array, error: object|null }}
export async function getDeletedProducts() {
  const { data, error } = await supabase
    .from('product')
    .select('prodcode, description, unit, record_status, stamp')  // ADD stamp
    .eq('record_status', 'INACTIVE')
    .order('prodcode');

  if (error) {
    console.error('getDeletedProducts error:', error.message);
    return { data: [], error };
  }

  return { data: data ?? [], error: null };
}