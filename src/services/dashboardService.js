// src/services/dashboardService.js

import { supabase } from '../lib/supabaseClient';

// ── getProductMetrics ──────────────────────────────────────────
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
export async function getTopSellingChartData() {
  const { data, error } = await supabase
    .from('top_selling_products')
    .select('prodcode, description, totalqty');

  if (error) return { data: [], error };
  return { data: data ?? [], error: null };
}

// ── getPriceTrendData ──────────────────────────────────────────
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
export async function getRecentActivity() {
  const { data, error } = await supabase
    .from('activity_log')
    .select('log_id, actor_email, actor_role, action, target_table, target_id, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) return { data: [], error };
  return { data: data ?? [], error: null };
}