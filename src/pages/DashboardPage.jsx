// src/pages/DashboardPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth }           from '../hooks/useAuth';
import { useRights }         from '../hooks/useRights';
import LoadingSpinner        from '../components/ui/LoadingSpinner';
import {
  getDashboardMetrics,
  getTopSellingChartData,
  getUserStatusData,
  getRecentActivity,
} from '../services/dashboardService';

// ─── Animated number counter ──────────────────────────────────
function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (value == null) return;
    const target = Number(value);
    const start  = performance.now();
    const tick   = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

// ─── SVG Icons ────────────────────────────────────────────────
const IconBox = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const IconWarning = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconReport = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const IconTrending = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);
const IconRefresh = ({ spinning }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const IconChevron = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

// ─── MetricCard ───────────────────────────────────────────────
function MetricCard({ label, value, sub, icon, delay = 0 }) {
  return (
    <div
      className="rounded-2xl bg-white p-4 sm:p-5 flex flex-col gap-2 sm:gap-2.5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
      style={{
        border: '1px solid #fce7f3',
        borderLeft: '3px solid #ec4899',
        animation: 'fadeUp 0.4s ease both',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Label + icon — identical across all cards */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-widest leading-tight" style={{ color: '#ec4899' }}>
          {label}
        </span>
        <span
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#fce7f3', color: '#ec4899' }}
        >
          {icon}
        </span>
      </div>

      {/* Value — identical across all cards */}
      <p className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight" style={{ color: '#1f2937' }}>
        {value != null
          ? <AnimatedNumber value={value} />
          : <span style={{ color: '#fce7f3' }}>—</span>
        }
      </p>

      {/* Sub-label — identical across all cards */}
      {sub && (
        <p className="text-xs font-semibold" style={{ color: '#f9a8d4' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── QuickAction ──────────────────────────────────────────────
const QA_THEMES = {
  pink:    { hover: 'hover:border-pink-300 hover:bg-pink-50',       icon: 'bg-pink-50 text-pink-500 group-hover:bg-pink-100',          chevron: 'group-hover:text-pink-400'    },
  fuchsia: { hover: 'hover:border-fuchsia-300 hover:bg-fuchsia-50', icon: 'bg-fuchsia-50 text-fuchsia-500 group-hover:bg-fuchsia-100', chevron: 'group-hover:text-fuchsia-400' },
  rose:    { hover: 'hover:border-rose-300 hover:bg-rose-50',       icon: 'bg-rose-50 text-rose-500 group-hover:bg-rose-100',          chevron: 'group-hover:text-rose-400'    },
  muted:   { hover: 'hover:border-pink-200 hover:bg-pink-50',       icon: 'bg-pink-50 text-pink-400 group-hover:bg-pink-100',          chevron: 'group-hover:text-pink-300'    },
};

function QuickAction({ to, icon, label, description, color = 'pink', delay = 0 }) {
  const t = QA_THEMES[color];
  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-pink-100 rounded-2xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${t.hover}`}
      style={{ animation: 'fadeUp 0.4s ease both', animationDelay: `${delay}ms` }}
    >
      <span className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${t.icon}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {description && <p className="text-xs text-pink-300 truncate mt-0.5">{description}</p>}
      </div>
      <span className={`text-pink-200 transition-colors duration-200 ml-auto shrink-0 ${t.chevron}`}><IconChevron /></span>
    </Link>
  );
}

// ─── Top 5 Bar Chart ─────────────────────────────────────────
function BarChart({ data, maxValue }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  const top5   = data.slice(0, 5);
  if (!top5.length) return null;
  const colors = ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3'];

  return (
    <div className="bg-white rounded-2xl border border-pink-100 p-5 sm:p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500"><IconTrending /></span>
          Top Selling Products
        </h3>
        <span className="text-xs font-medium text-pink-300 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-100">
          by qty · top 5
        </span>
      </div>
      <div className="space-y-3.5">
        {top5.map((item, i) => {
          const pct = maxValue > 0 ? Math.round((item.value / maxValue) * 100) : 0;
          return (
            <div key={item.label} className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs font-bold text-pink-300 w-4 shrink-0 text-center">{i + 1}</span>
              <span className="text-xs font-mono font-medium text-gray-600 w-12 sm:w-14 shrink-0 truncate" title={item.label}>{item.label}</span>
              <div className="flex-1 bg-pink-50 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: mounted ? `${pct}%` : '0%', backgroundColor: colors[i], transitionDelay: `${i * 80}ms` }}
                />
              </div>
              <span className="text-xs tabular-nums font-semibold text-gray-600 w-8 sm:w-10 shrink-0 text-right">
                {item.value.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Doughnut Chart ───────────────────────────────────────────
function DoughnutChart({ active, inactive }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t); }, []);

  const total = (active + inactive) || 1;
  const R = 36, C = 2 * Math.PI * R;
  const GAP = inactive > 0 ? 4 : 0;
  const activeLen   = Math.max(0, (active   / total) * C - GAP);
  const inactiveLen = Math.max(0, (inactive / total) * C - GAP);

  return (
    <div className="bg-white rounded-2xl border border-pink-100 p-5 sm:p-6 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500">
          <IconUsers />
        </span>
        <h3 className="text-sm font-bold text-gray-800">User Account Status</h3>
      </div>
      <div className="flex items-center justify-center gap-6 sm:gap-8">
        <div className="relative shrink-0 w-32 h-32 sm:w-36 sm:h-36">
          <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: 'drop-shadow(0 4px 14px rgba(236,72,153,0.15))' }}>
            <g transform="rotate(-90 50 50)">
              <circle cx="50" cy="50" r={R} fill="none" stroke="#fce7f3" strokeWidth="12" />
              <circle cx="50" cy="50" r={R} fill="none" stroke="#ec4899" strokeWidth="12" strokeLinecap="butt"
                strokeDasharray={`${mounted ? activeLen : 0} ${C}`} strokeDashoffset="0"
                style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.34,1.56,0.64,1)' }}
              />
              {inactive > 0 && (
                <circle cx="50" cy="50" r={R} fill="none" stroke="#fdf2f8" strokeWidth="12" strokeLinecap="butt"
                  strokeDasharray={`${mounted ? inactiveLen : 0} ${C}`} strokeDashoffset={-(activeLen + GAP)}
                  style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.12s' }}
                />
              )}
            </g>
            <text x="50" y="46" textAnchor="middle" fontSize="17" fontWeight="700" fill="#1f2937" fontFamily="inherit">{total}</text>
            <text x="50" y="59" textAnchor="middle" fontSize="7.5" fill="#f9a8d4" fontFamily="inherit" fontWeight="600">total</text>
          </svg>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: '#ec4899', boxShadow: '0 0 0 3px #fce7f3' }} />
            <div>
              <p className="text-xs text-gray-400 font-medium leading-none mb-1">Active</p>
              <p className="text-2xl font-bold text-gray-800 leading-none">{active}</p>
            </div>
          </div>
          <div className="h-px bg-pink-100" />
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: '#fdf2f8', border: '1.5px solid #f9a8d4', boxShadow: '0 0 0 3px #fdf2f8' }} />
            <div>
              <p className="text-xs text-gray-400 font-medium leading-none mb-1">Inactive</p>
              <p className="text-2xl font-bold text-gray-800 leading-none">{inactive}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Activity feed icon ───────────────────────────────────────
function ActivityIcon({ action = '' }) {
  if (action.includes('DELETED') || action.includes('DEACTIVATED'))
    return (
      <span className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </span>
    );
  if (action.includes('ADDED') || action.includes('ACTIVATED') || action.includes('RECOVERED'))
    return (
      <span className="w-8 h-8 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </span>
    );
  if (action.includes('SIGNED'))
    return (
      <span className="w-8 h-8 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </span>
    );
  return (
    <span className="w-8 h-8 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </span>
  );
}

function formatRelativeTime(ts) {
  if (!ts) return '';
  const diff  = Date.now() - new Date(ts).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
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

// ─── Page ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const { currentUser }                       = useAuth();
  const { canViewTopSelling, canManageUsers } = useRights();
  const navigate                              = useNavigate();

  const isSuperAdmin = currentUser?.user_type === 'SUPERADMIN';
  const isAdmin      = currentUser?.user_type === 'ADMIN';

  const [metrics,    setMetrics]    = useState(null);
  const [topSelling, setTopSelling] = useState([]);
  const [userStatus, setUserStatus] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [lastSync,   setLastSync]   = useState(null);

  useEffect(() => {
    if (currentUser?.user_type === 'USER') navigate('/products', { replace: true });
  }, [currentUser, navigate]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const fetches = [getDashboardMetrics(), getRecentActivity()];
    if (canViewTopSelling) fetches.push(getTopSellingChartData());
    if (isSuperAdmin)      fetches.push(getUserStatusData());

    const results = await Promise.all(fetches);
    const [metricsRes, activityRes, ...extras] = results;

    setMetrics(metricsRes);
    setRecentLogs(activityRes.data ?? []);

    let idx = 0;
    if (canViewTopSelling) {
      setTopSelling((extras[idx]?.data ?? []).map(p => ({
        label: p.prodcode,
        value: Number(p.totalqty),
      })));
      idx++;
    }
    if (isSuperAdmin) setUserStatus(extras[idx]?.data ?? null);

    setLastSync(new Date());
    setLoading(false);
  }, [canViewTopSelling, isSuperAdmin]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const quickActions = [
    { to: '/products', icon: <IconBox />,    label: 'Manage Products', description: 'Add, edit, or remove products', color: 'pink'    },
    { to: '/reports',  icon: <IconReport />, label: 'View Reports',    description: 'Sales and inventory reports',   color: 'fuchsia' },
    ...(canManageUsers ? [{
      to: '/admin', icon: <IconUsers />, label: 'Manage Users',
      description: metrics?.pendingActivations > 0 ? `${metrics.pendingActivations} pending activation(s)` : 'Roles & access control',
      color: 'rose',
    }] : []),
    ...((isSuperAdmin || isAdmin) ? [{
      to: '/products?tab=Soft-Deleted', 
      icon: <IconTrash />, 
      label: 'Deleted Items',
      description: metrics?.softDeletedProducts > 0 ? `${metrics.softDeletedProducts} item(s) awaiting review` : 'Review soft-deleted records',
      color: 'muted',
    }] : []),
  ];

  const maxQty     = Math.max(...topSelling.map(t => t.value), 1);
  const showCharts = canViewTopSelling || (isSuperAdmin && userStatus);
  const chartCols  = canViewTopSelling && isSuperAdmin ? 'lg:grid-cols-2' : 'grid-cols-1';

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between" style={{ animation: 'fadeUp 0.35s ease both' }}>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse shrink-0" />
              <span className="text-xs text-pink-500 font-semibold">All systems operational</span>
              {lastSync && (
                <>
                  <span className="text-pink-200">·</span>
                  <span className="text-xs text-pink-300">Last sync {formatRelativeTime(lastSync.toISOString())}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold text-pink-600 hover:text-pink-800 disabled:text-pink-200 px-3 sm:px-4 py-2 rounded-xl border border-pink-200 hover:border-pink-400 hover:bg-pink-50 transition-all duration-200 shrink-0"
          >
            <IconRefresh spinning={loading} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {loading && <LoadingSpinner />}

        {!loading && (
          <>
            {/* ── Metric cards — all identical style ── */}
            <div className={`grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
              <MetricCard
                label="Total Active Products"
                value={metrics?.activeProducts}
                icon={<IconBox />}
                sub={undefined}
                delay={0}
              />
              <MetricCard
                label="Total Users"
                value={metrics?.totalUsers}
                icon={<IconUser />}
                sub={isSuperAdmin ? 'global' : 'visible to you'}
                delay={60}
              />
              <MetricCard
                label="Pending Activations"
                value={metrics?.pendingActivations}
                icon={<IconWarning />}
                sub={metrics?.pendingActivations > 0 ? 'Action required' : 'None pending'}
                delay={120}
              />
              {isSuperAdmin && (
                <MetricCard
                  label="Soft-Deleted Items"
                  value={metrics?.softDeletedProducts}
                  icon={<IconTrash />}
                  sub="Awaiting review"
                  delay={180}
                />
              )}
            </div>

            {/* ── Charts ── */}
            {showCharts && (
              <div className={`grid gap-3 sm:gap-4 grid-cols-1 ${chartCols}`} style={{ animation: 'fadeUp 0.4s ease 0.2s both' }}>
                {canViewTopSelling && <BarChart data={topSelling} maxValue={maxQty} />}
                {isSuperAdmin && userStatus && (
                  <DoughnutChart active={userStatus.activeUsers} inactive={userStatus.inactiveUsers} />
                )}
              </div>
            )}

            {/* ── Bottom: Quick Actions (left) + Recent Activity (right) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4" style={{ animation: 'fadeUp 0.4s ease 0.3s both' }}>

              {/* Quick Actions */}
              <div className="flex flex-col gap-3">
                <h2 className="text-xs font-bold text-pink-400 uppercase tracking-widest">Quick Actions</h2>
                <div className="flex flex-col gap-2 sm:gap-3">
                  {quickActions.map((a, i) => <QuickAction key={a.to} {...a} delay={i * 50} />)}
                </div>
              </div>

              {/* Recent System Activity */}
              <div
                className="bg-white rounded-2xl border border-pink-100 p-4 sm:p-5 shadow-sm flex flex-col"
                style={{ animation: 'fadeUp 0.4s ease 0.35s both' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-800">Recent System Activity</h2>
                  <Link to="/activity-log" className="text-xs font-bold text-pink-500 hover:text-pink-700 uppercase tracking-wide transition-colors">
                    Full Log →
                  </Link>
                </div>
                {recentLogs.length === 0 ? (
                  <p className="text-sm text-pink-300 text-center py-8">No recent activity recorded.</p>
                ) : (
                  <div className="divide-y divide-pink-50">
                    {recentLogs.map((log, i) => (
                      <div
                        key={log.log_id}
                        className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                        style={{ animation: 'fadeUp 0.3s ease both', animationDelay: `${0.4 + i * 0.04}s` }}
                      >
                        <ActivityIcon action={log.action} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {ACTION_FRIENDLY[log.action] ?? log.action}
                          </p>
                          <p className="text-xs text-pink-300 truncate mt-0.5">
                            {log.detail ?? '—'}
                            {isSuperAdmin && log.actor_email && (
                              <> · <span className="text-pink-500 font-medium">{log.actor_email}</span></>
                            )}
                          </p>
                        </div>
                        <span className="text-xs text-pink-200 shrink-0 whitespace-nowrap pt-0.5">
                          {formatRelativeTime(log.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}