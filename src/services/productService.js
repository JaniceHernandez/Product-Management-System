// src/services/productService.js

import { supabase }  from '../lib/supabaseClient';
import { makeStamp } from '../utils/stampHelper';
import { logActivity } from './activityLogService';

// ── getProducts ────────────────────────────────────────────────
export async function getProducts(userType) {
  // Base query: get all active products (or all if admin/superadmin)
  let query = supabase
    .from('product')
    .select(`
      prodcode,
      description,
      unit,
      record_status,
      stamp
    `)
    .order('prodcode');

  if (userType === 'USER') {
    query = query.eq('record_status', 'ACTIVE');
  }

  const { data: products, error: productsError } = await query;
  if (productsError) {
    return { data: [], error: productsError };
  }

  if (!products || products.length === 0) {
    return { data: [], error: null };
  }

  // Fetch the latest price for each product using a single query
  const prodCodes = products.map(p => p.prodcode);
  const { data: prices, error: pricesError } = await supabase
    .from('pricehist')
    .select('prodcode, unitprice, effdate')
    .in('prodcode', prodCodes)
    .order('effdate', { ascending: false });

  if (pricesError) {
    // Still return products without prices
    return { data: products.map(p => ({ ...p, current_price: null })), error: null };
  }

  // Build a map of the latest price per product
  const priceMap = new Map();
  for (const price of prices) {
    if (!priceMap.has(price.prodcode)) {
      priceMap.set(price.prodcode, {
        unitprice: price.unitprice,
        effdate: price.effdate,
      });
    }
  }

  // Merge prices into products
  const merged = products.map(product => ({
    ...product,
    current_price: priceMap.get(product.prodcode) || null,
  }));

  return { data: merged, error: null };
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
export async function updateProduct(prodcode, updates, currentUser) {
  const stamp = makeStamp('EDITED');

  const { data, error } = await supabase
    .from('product')
    .update({ ...updates, stamp })
    .eq('prodcode', prodcode)
    .select()
    .single();

  if (error) {
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
export async function softDeleteProduct(prodcode, currentUser) {
  const stamp = makeStamp('DEACTIVATED');

  const { error } = await supabase
    .from('product')
    .update({ record_status: 'INACTIVE', stamp })
    .eq('prodcode', prodcode);

  if (error) {
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
export async function recoverProduct(prodcode, currentUser) {
  const stamp = makeStamp('REACTIVATED');

  const { error } = await supabase
    .from('product')
    .update({ record_status: 'ACTIVE', stamp })
    .eq('prodcode', prodcode);

  if (error) {
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
export async function getDeletedProducts() {
  const { data, error } = await supabase
    .from('product')
    .select('prodcode, description, unit, record_status, stamp')  // ADD stamp
    .eq('record_status', 'INACTIVE')
    .order('prodcode');

  if (error) {
    return { data: [], error };
  }

  return { data: data ?? [], error: null };
}