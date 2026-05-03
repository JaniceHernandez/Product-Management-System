// src/services/reportService.js
import { supabase } from '../lib/supabaseClient';

// ── getProductReport ───────────────────────────────────────────
export async function getProductReport({ search = '', sortField = 'prodcode', sortDirection = 'asc' } = {}) {
  const { data, error } = await supabase
    .from('current_product_price')
    .select('prodcode, description, unit, unitprice, effdate')
    .order(sortField, { ascending: sortDirection === 'asc' });

  if (error) {
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
export async function getTopSellingProducts() {
  const { data, error } = await supabase
    .from('top_selling_products')
    .select('prodcode, description, unit, totalqty, totalvalue');  // ← make sure totalvalue is here
  
  if (error) {
    return { data: [], error };
  }
  
  return { data: data ?? [], error: null };
}