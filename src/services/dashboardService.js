// src/services/dashboardService.js
// Data-access layer for the Dashboard page.
// All functions are designed to be called in parallel via Promise.all().
// Each function returns { data, error } — never throws.

import { supabase } from '../lib/supabaseClient';

// ── getProductMetrics ──────────────────────────────────────────
// Returns counts for the metric cards.
// @returns {{ activeCount, inactiveCount, pendingActivations, totalUsers, error }}
export async function getDashboardMetrics() {
  const [activeRes, inactiveRes, usersRes] = await Promise.all([
    // Active product count
    supabase
      .from('product')
      .select('prodcode', { count: 'exact', head: true })
      .eq('record_status', 'ACTIVE'),
    // Soft-deleted product count
    supabase
      .from('product')
      .select('prodcode', { count: 'exact', head: true })
      .eq('record_status', 'INACTIVE'),
    // All user rows (RLS scopes this per actor)
    supabase
      .from('user')
      .select('userid, record_status, user_type', { count: 'exact' }),
  ]);

  const users             = usersRes.data ?? [];
  const pendingActivations = users.filter(u => u.record_status === 'INACTIVE').length;
  const totalUsers         = users.length;

  return {
    activeProducts:      activeRes.count  ?? 0,
    softDeletedProducts: inactiveRes.count ?? 0,
    pendingActivations,
    totalUsers,
    error: activeRes.error ?? inactiveRes.error ?? usersRes.error ?? null,
  };
}

// ── getTopSellingChartData ─────────────────────────────────────
// Returns top 10 products by quantity sold — for the bar chart.
// Only called when REP_002 = 1 (SUPERADMIN).
export async function getTopSellingChartData() {
  const { data, error } = await supabase
    .from('top_selling_products')
    .select('prodcode, description, totalqty');

  if (error) return { data: [], error };
  return { data: data ?? [], error: null };
}

// ── getPriceTrendData ──────────────────────────────────────────
// Returns recent price history entries for the trend line chart.
// Shows the 5 most recently updated products' price history.
export async function getPriceTrendData() {
  const { data, error } = await supabase
    .from('pricehist')
    .select('prodcode, effdate, unitprice')
    .order('effdate', { ascending: true })
    .limit(60); // last 60 price entries across all products

  if (error) return { data: [], error };
  return { data: data ?? [], error: null };
}

// ── getUserStatusData ──────────────────────────────────────────
// Returns user counts by status and type — for the doughnut chart.
// Only called by SUPERADMIN (full user visibility).
export async function getUserStatusData() {
  const { data, error } = await supabase
    .from('user')
    .select('user_type, record_status');

  if (error) return { data: [], error };

  const result = {
    activeUsers:    (data ?? []).filter(u => u.record_status === 'ACTIVE').length,
    inactiveUsers:  (data ?? []).filter(u => u.record_status === 'INACTIVE').length,
    superadminCount:(data ?? []).filter(u => u.user_type === 'SUPERADMIN').length,
    adminCount:     (data ?? []).filter(u => u.user_type === 'ADMIN').length,
    userCount:      (data ?? []).filter(u => u.user_type === 'USER').length,
  };

  return { data: result, error: null };
}

// ── getRecentActivity ──────────────────────────────────────────
// Returns the 5 most recent activity log entries.
// RLS scopes result: SUPERADMIN sees all; ADMIN sees own.
export async function getRecentActivity() {
  const { data, error } = await supabase
    .from('activity_log')
    .select('log_id, actor_email, actor_role, action, target_table, target_id, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) return { data: [], error };
  return { data: data ?? [], error: null };
}