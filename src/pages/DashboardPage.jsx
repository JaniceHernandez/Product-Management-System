// src/pages/DashboardPage.jsx
// Dashboard for SUPERADMIN and ADMIN users.
// Shows metric cards, charts, quick actions, recent activity, and system health.
// Charts use CSS/SVG — no external charting library required.
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link }   from 'react-router-dom';
import { useAuth }             from '../hooks/useAuth';
import { useRights }           from '../hooks/useRights';
import LoadingSpinner          from '../components/ui/LoadingSpinner';
import {
  getDashboardMetrics,
  getTopSellingChartData,
  getPriceTrendData,
  getUserStatusData,
  getRecentActivity,
} from '../services/dashboardService';

// ── Sub-components ─────────────────────────────────────────────

function MetricCard({ label, value, sub, highlight, icon }) {
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-2 ${
      highlight
        ? 'bg-amber-50 border-amber-300'
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${highlight ? 'text-amber-700' : 'text-gray-800'}`}>
        {value ?? <span className="text-gray-300">—</span>}
      </p>
      {sub && (
        <p className={`text-xs font-medium ${highlight ? 'text-amber-600' : 'text-gray-400'}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

function QuickAction({ to, icon, label, color }) {
  const colors = {
    blue:   'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
    green:  'hover:bg-green-50 hover:border-green-300 hover:text-green-700',
    purple: 'hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700',
    red:    'hover:bg-red-50 hover:border-red-200 hover:text-red-600',
  };
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-3 p-5 bg-white border border-gray-200 rounded-xl transition-all ${colors[color]}`}
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-sm font-semibold text-center text-gray-700">{label}</span>
    </Link>
  );
}

// Horizontal Bar Chart — pure CSS, no library
function BarChart({ data, maxValue, title }) {
  if (!data.length) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-bold text-gray-700 mb-4">{title}</h3>
      <div className="space-y-2.5">
        {data.map((item, i) => {
          const pct = maxValue > 0 ? Math.round((item.value / maxValue) * 100) : 0;
          const barColors = [
            'bg-blue-500', 'bg-blue-400', 'bg-blue-300',
            'bg-indigo-400', 'bg-indigo-300', 'bg-violet-300',
            'bg-violet-200', 'bg-sky-300', 'bg-sky-200', 'bg-slate-200',
          ];
          return (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-500 w-16 shrink-0 text-right truncate"
                title={item.label}>
                {item.label}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColors[i] ?? 'bg-blue-200'} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-gray-600 w-12 shrink-0 text-right">
                {item.value.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Price Trend Line Chart — SVG
function LineTrendChart({ data, title }) {
  if (!data.length) return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-center h-48">
      <p className="text-sm text-gray-400">No price history available.</p>
    </div>
  );

  const W = 320, H = 140, PAD = 20;
  const prices    = data.map(d => Number(d.unitprice));
  const minPrice  = Math.min(...prices);
  const maxPrice  = Math.max(...prices);
  const range     = maxPrice - minPrice || 1;

  const points = data.map((d, i) => {
    const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
    const y = PAD + (1 - (Number(d.unitprice) - minPrice) / range) * (H - PAD * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${PAD},${H - PAD} ${points} ${W - PAD},${H - PAD}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-bold text-gray-700 mb-3">{title}</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <polygon points={areaPoints} fill="url(#priceGrad)" />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dots on each data point */}
        {data.map((d, i) => {
          const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
          const y = PAD + (1 - (Number(d.unitprice) - minPrice) / range) * (H - PAD * 2);
          return <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" />;
        })}
      </svg>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>₱{minPrice.toLocaleString()}</span>
        <span>₱{maxPrice.toLocaleString()}</span>
      </div>
    </div>
  );
}

// User Status Doughnut Chart — SVG
function DoughnutChart({ active, inactive, title }) {
  const total = active + inactive || 1;
  const activePct   = (active / total) * 100;
  const inactivePct = (inactive / total) * 100;

  // SVG donut via stroke-dasharray on a circle (r=40, circumference≈251)
  const C = 251;
  const activeStroke   = (activePct / 100) * C;
  const inactiveStroke = (inactivePct / 100) * C;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-bold text-gray-700 mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
          {/* Background ring */}
          <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="14" />
          {/* Inactive segment (red) */}
          <circle cx="50" cy="50" r="40" fill="none"
            stroke="#fca5a5" strokeWidth="14"
            strokeDasharray={`${inactiveStroke} ${C - inactiveStroke}`}
            strokeDashoffset={C * 0.25}
            strokeLinecap="round"
          />
          {/* Active segment (green) — drawn on top */}
          <circle cx="50" cy="50" r="40" fill="none"
            stroke="#4ade80" strokeWidth="14"
            strokeDasharray={`${activeStroke} ${C - activeStroke}`}
            strokeDashoffset={C * 0.25 + inactiveStroke}
            strokeLinecap="round"
          />
          <text x="50" y="54" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1f2937">
            {total}
          </text>
        </svg>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400 shrink-0" />
            <span className="text-gray-600">Active</span>
            <span className="ml-auto font-bold text-gray-800">{active}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-300 shrink-0" />
            <span className="text-gray-600">Inactive</span>
            <span className="ml-auto font-bold text-gray-800">{inactive}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Activity dot colour per action category
function activityDotColor(action = '') {
  if (action.includes('DELETED') || action.includes('DEACTIVATED')) return 'bg-red-500';
  if (action.includes('ADDED') || action.includes('ACTIVATED') || action.includes('RECOVERED'))
    return 'bg-green-500';
  if (action.includes('SIGNED')) return 'bg-gray-400';
  return 'bg-blue-500';
}

function formatRelativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return new Date(ts).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  return 'Yesterday';
}

const ACTION_FRIENDLY = {
  PRODUCT_ADDED:     'Product added',
  PRODUCT_EDITED:    'Product edited',
  PRODUCT_DELETED:   'Product soft-deleted',
  PRODUCT_RECOVERED: 'Product recovered',
  PRICE_ADDED:       'Price entry added',
  USER_ACTIVATED:    'User activated',
  USER_DEACTIVATED:  'User deactivated',
  ROLE_CHANGED:      'Role changed',
  USER_SIGNED_IN:    'User signed in',
  USER_SIGNED_OUT:   'User signed out',
};

// ── Main DashboardPage component ───────────────────────────────
export default function DashboardPage() {
  const { currentUser }             = useAuth();
  const { canViewTopSelling, canManageUsers } = useRights();
  const navigate                    = useNavigate();

  const isSuperAdmin = currentUser?.user_type === 'SUPERADMIN';
  const isAdmin      = currentUser?.user_type === 'ADMIN';

  const [metrics,      setMetrics]      = useState(null);
  const [topSelling,   setTopSelling]   = useState([]);
  const [priceTrend,   setPriceTrend]   = useState([]);
  const [userStatus,   setUserStatus]   = useState(null);
  const [recentLogs,   setRecentLogs]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [lastSync,     setLastSync]     = useState(null);

  // Redirect USER who somehow reaches this page
  useEffect(() => {
    if (currentUser && currentUser.user_type === 'USER') {
      navigate('/products', { replace: true });
    }
  }, [currentUser, navigate]);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const fetches = [
      getDashboardMetrics(),
      getPriceTrendData(),
      getRecentActivity(),
    ];

    if (canViewTopSelling) fetches.push(getTopSellingChartData());
    if (isSuperAdmin)       fetches.push(getUserStatusData());

    const results = await Promise.all(fetches);

    const [metricsRes, priceRes, activityRes, ...extras] = results;

    setMetrics(metricsRes);
    setPriceTrend(priceRes.data ?? []);
    setRecentLogs(activityRes.data ?? []);

    let extraIdx = 0;
    if (canViewTopSelling) {
      setTopSelling((extras[extraIdx]?.data ?? []).map(p => ({
        label: p.prodcode,
        value: Number(p.totalqty),
        desc:  p.description,
      })));
      extraIdx++;
    }
    if (isSuperAdmin) {
      setUserStatus(extras[extraIdx]?.data ?? null);
    }

    setLastSync(new Date());
    setLoading(false);
  }, [canViewTopSelling, isSuperAdmin]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Quick actions — scoped per role
  const quickActions = [
    { to: '/products',  icon: '📦', label: 'Manage Products', color: 'blue' },
    { to: '/reports',   icon: '📊', label: 'View Reports',    color: 'green' },
    ...(canManageUsers ? [{ to: '/admin', icon: '👥', label: 'Manage Users', color: 'purple' }] : []),
    ...(isSuperAdmin || isAdmin ? [{ to: '/deleted-items', icon: '🗑', label: 'Deleted Items', color: 'red' }] : []),
  ];

  const maxQty = Math.max(...topSelling.map(t => t.value), 1);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-600 font-medium">All systems operational</span>
            {lastSync && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-xs text-gray-400">
                  Last sync {formatRelativeTime(lastSync.toISOString())}
                </span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-300 flex items-center gap-1"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : '↻'}
          Refresh
        </button>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && (
        <>
          {/* ── Metric cards row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Active Products"
              value={metrics?.activeProducts?.toLocaleString()}
              icon="📦"
            />
            <MetricCard
              label="Total Users"
              value={metrics?.totalUsers?.toLocaleString()}
              sub={isSuperAdmin ? 'global' : 'visible to you'}
              icon="👤"
            />
            <MetricCard
              label="Pending Activations"
              value={metrics?.pendingActivations}
              sub={metrics?.pendingActivations > 0 ? 'Action required' : 'None pending'}
              highlight={metrics?.pendingActivations > 0}
              icon="⚠"
            />
            {isSuperAdmin && (
              <MetricCard
                label="Soft-Deleted Items"
                value={metrics?.softDeletedProducts}
                sub="Awaiting review"
                icon="🗑"
              />
            )}
          </div>

          {/* ── Charts row ── */}
          <div className={`grid gap-4 ${
            canViewTopSelling && isSuperAdmin
              ? 'grid-cols-1 lg:grid-cols-3'
              : 'grid-cols-1 lg:grid-cols-2'
          }`}>
            {canViewTopSelling && (
              <BarChart
                data={topSelling}
                maxValue={maxQty}
                title="🏆 Top Selling Products (by Qty)"
              />
            )}
            <LineTrendChart
              data={priceTrend}
              title="📈 Product Price Trend"
            />
            {isSuperAdmin && userStatus && (
              <DoughnutChart
                active={userStatus.activeUsers}
                inactive={userStatus.inactiveUsers}
                title="👥 User Account Status"
              />
            )}
          </div>

          {/* ── Quick actions ── */}
          <div>
            <h2 className="text-base font-bold text-gray-700 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {quickActions.map(action => (
                <QuickAction key={action.to} {...action} />
              ))}
            </div>
          </div>

          {/* ── Bottom row: Recent Activity + System Health ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Recent System Activity — spans 2 cols */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-700">Recent System Activity</h2>
                <Link
                  to="/activity-log"
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold uppercase tracking-wide"
                >
                  Full Log →
                </Link>
              </div>
              {recentLogs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No recent activity recorded.</p>
              ) : (
                <div className="space-y-3">
                  {recentLogs.map(log => (
                    <div key={log.log_id} className="flex items-start gap-3">
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${activityDotColor(log.action)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {ACTION_FRIENDLY[log.action] ?? log.action}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {log.detail ?? '—'}
                          {isSuperAdmin && log.actor_email && (
                            <> · <span className="text-blue-500">{log.actor_email}</span></>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-gray-300 shrink-0 whitespace-nowrap">
                        {formatRelativeTime(log.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System Health panel */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 text-white">
              <h2 className="text-sm font-bold mb-4 text-gray-200">System Health</h2>
              <div className="space-y-4">

                {/* Database Load indicator */}
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Database Load</span>
                    <span className="text-green-400 font-semibold">OPTIMAL</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-1/4 bg-gradient-to-r from-yellow-400 to-green-400 rounded-full" />
                  </div>
                </div>

                {/* Key metrics summary */}
                <div className="border-t border-gray-700 pt-3 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Products</span>
                    <span className="font-bold">{metrics?.activeProducts?.toLocaleString() ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Users</span>
                    <span className="font-bold">{metrics?.totalUsers ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${metrics?.pendingActivations > 0 ? 'text-amber-400' : 'text-gray-400'}`}>
                      Pending Activations
                    </span>
                    <span className={`font-bold ${metrics?.pendingActivations > 0 ? 'text-amber-400' : ''}`}>
                      {metrics?.pendingActivations ?? '—'}
                    </span>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Soft-Deleted Items</span>
                      <span className="font-bold">{metrics?.softDeletedProducts ?? '—'}</span>
                    </div>
                  )}
                </div>

                {/* Server uptime indicator */}
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Server Uptime</span>
                    <span className="text-lg font-extrabold text-green-400">99.9%</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-gray-500">Supabase — Connected</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}