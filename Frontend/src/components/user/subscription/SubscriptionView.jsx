import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  CreditCard,
  Coins,
  Crown,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  History,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { AppContext } from '../../../context/Context';
import { paymentAPI } from '../../../utils/api';
import { InteractiveCard } from '../ui/InteractiveCard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// ─── Helpers ─────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const daysLeft = (expiresAt) => {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt) - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const statusColors = {
  active: 'text-lime-400 bg-lime-400/10 border-lime-400/30',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/30',
  past_due: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  trialing: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  none: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
};

const paymentStatusColors = {
  completed: 'text-lime-400',
  pending: 'text-amber-400',
  failed: 'text-red-400',
  cancelled: 'text-gray-400',
  refunded: 'text-blue-400',
};

// ─── Main Component ──────────────────────────────────
const SubscriptionView = () => {
  const { user, coinBalance, fetchCoinBalance } = useContext(AppContext);

  const [coinData, setCoinData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState({ coin: true, payments: true, products: true });
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [error, setError] = useState(null);

  const subscription = user?.subscription || {};
  const isActive = subscription.status === 'active';
  const remaining = daysLeft(subscription.expiresAt);

  // ─── Fetch data in parallel on mount ───────────────
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      const [coinRes, payRes, prodRes] = await Promise.allSettled([
        paymentAPI.getCoinBalance(),
        paymentAPI.getMyPayments({ page: 1, limit: 5 }),
        fetch(`${API_BASE_URL}/products`).then((r) => r.json()),
      ]);

      if (cancelled) return;

      // Coin balance
      if (coinRes.status === 'fulfilled' && coinRes.value.success) {
        setCoinData(coinRes.value.data?.data);
      }
      setLoading((p) => ({ ...p, coin: false }));

      // Payment history
      if (payRes.status === 'fulfilled' && payRes.value.success) {
        setPayments(payRes.value.data?.data?.payments || []);
      }
      setLoading((p) => ({ ...p, payments: false }));

      // Products
      if (prodRes.status === 'fulfilled' && prodRes.value.success) {
        setProducts(prodRes.value.data || []);
      }
      setLoading((p) => ({ ...p, products: false }));
    };

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  // ─── Checkout handler ──────────────────────────────
  const handleCheckout = useCallback(async (planKey) => {
    setCheckoutLoading(planKey);
    setError(null);
    try {
      const result = await paymentAPI.createCheckoutSession(planKey);
      if (!result.success) throw new Error(result.error?.message || 'Checkout failed');
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (err) {
      setError(err.message);
      setCheckoutLoading(null);
    }
  }, []);

  // ─── Refresh coin balance ──────────────────────────
  const handleRefreshCoins = useCallback(async () => {
    setLoading((p) => ({ ...p, coin: true }));
    await fetchCoinBalance();
    const res = await paymentAPI.getCoinBalance();
    if (res.success) setCoinData(res.data?.data);
    setLoading((p) => ({ ...p, coin: false }));
  }, [fetchCoinBalance]);

  // Coin history (last 5)
  const recentCoinHistory = useMemo(
    () => (coinData?.recentHistory || []).slice(0, 5),
    [coinData],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Subscription & U-Coins
        </h2>
        {isActive && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${statusColors.active}`}>
            <Crown className="w-4 h-4" /> Active Plan
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* ─── Top Stats Row ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Plan */}
        <InteractiveCard className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-purple-400" />
            <span className="text-gray-400 text-sm">Current Plan</span>
          </div>
          <p className="text-white text-xl font-bold capitalize">
            {subscription.plan === 'none' || !subscription.plan ? 'Free' : subscription.plan}
          </p>
        </InteractiveCard>

        {/* Status */}
        <InteractiveCard className="p-5 bg-gradient-to-br from-lime-500/10 to-lime-600/5 border-lime-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-lime-400" />
            <span className="text-gray-400 text-sm">Status</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium border ${statusColors[subscription.status] || statusColors.none}`}>
            {subscription.status === 'active' && <CheckCircle className="w-3.5 h-3.5" />}
            {(subscription.status || 'none').replace('_', ' ')}
          </span>
        </InteractiveCard>

        {/* U-Coins */}
        <InteractiveCard className="p-5 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-orange-400" />
              <span className="text-gray-400 text-sm">U-Coins</span>
            </div>
            <button
              onClick={handleRefreshCoins}
              disabled={loading.coin}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              title="Refresh balance"
            >
              <RefreshCw className={`w-4 h-4 ${loading.coin ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-orange-400 text-xl font-bold">
            {loading.coin ? '...' : (coinBalance ?? user?.coins ?? 0).toLocaleString()}
          </p>
        </InteractiveCard>

        {/* Days Left */}
        <InteractiveCard className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Expires</span>
          </div>
          {isActive ? (
            <p className="text-white text-xl font-bold">
              {remaining} <span className="text-sm font-normal text-gray-400">days left</span>
            </p>
          ) : (
            <p className="text-gray-500 text-xl font-bold">—</p>
          )}
        </InteractiveCard>
      </div>

      {/* ─── Subscribe / Upgrade Products ──────────── */}
      <div>
        <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-lime-400" />
          {isActive ? 'Renew or Switch Plan' : 'Subscribe to a Plan'}
        </h3>

        {loading.products ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-lime-400 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <InteractiveCard className="p-6 text-center">
            <p className="text-gray-400">No plans available right now.</p>
          </InteractiveCard>
        ) : (
          <div className={`grid gap-4 ${products.length === 1 ? 'max-w-md' : 'md:grid-cols-2'}`}>
            {products.map((product) => {
              const isCurrentPlan = isActive && subscription.plan === product.key;
              return (
                <InteractiveCard
                  key={product._id || product.key}
                  className={`p-6 relative overflow-hidden ${
                    isCurrentPlan
                      ? 'border-lime-400/50 ring-1 ring-lime-400/20'
                      : product.isPopular
                      ? 'border-lime-400/30'
                      : ''
                  }`}
                >
                  {product.isPopular && (
                    <span className="absolute top-3 right-3 bg-lime-400 text-black px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      Popular
                    </span>
                  )}
                  {isCurrentPlan && (
                    <span className="absolute top-3 right-3 bg-purple-500 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      Current
                    </span>
                  )}

                  <h4 className="text-white text-lg font-bold mb-1">{product.name}</h4>
                  <p className="text-lime-400 text-2xl font-bold mb-4">{product.price}</p>

                  {product.features?.length > 0 && (
                    <ul className="space-y-2 mb-6">
                      {product.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                          <CheckCircle className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={() => handleCheckout(product.key)}
                    disabled={!!checkoutLoading}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                      isCurrentPlan
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-lime-400 text-black hover:bg-lime-300'
                    } disabled:opacity-50`}
                  >
                    {checkoutLoading === product.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {isCurrentPlan ? 'Renew' : 'Subscribe'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </InteractiveCard>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Coin History ──────────────────────────── */}
      <div>
        <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-orange-400" />
          Recent Coin Activity
        </h3>

        {loading.coin ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
          </div>
        ) : recentCoinHistory.length === 0 ? (
          <InteractiveCard className="p-5 text-center">
            <p className="text-gray-500 text-sm">No coin activity yet.</p>
          </InteractiveCard>
        ) : (
          <InteractiveCard className="divide-y divide-gray-800">
            {recentCoinHistory.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    entry.type === 'credit' ? 'bg-lime-400/10' : 'bg-red-400/10'
                  }`}>
                    <Coins className={`w-4 h-4 ${entry.type === 'credit' ? 'text-lime-400' : 'text-red-400'}`} />
                  </div>
                  <p className="text-gray-300 text-sm truncate">{entry.reason}</p>
                </div>
                <span className={`font-semibold text-sm flex-shrink-0 ml-3 ${
                  entry.type === 'credit' ? 'text-lime-400' : 'text-red-400'
                }`}>
                  {entry.type === 'credit' ? '+' : '-'}{entry.amount?.toLocaleString()}
                </span>
              </div>
            ))}
          </InteractiveCard>
        )}
      </div>

      {/* ─── Payment History ───────────────────────── */}
      <div>
        <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-400" />
          Payment History
        </h3>

        {loading.payments ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <InteractiveCard className="p-5 text-center">
            <p className="text-gray-500 text-sm">No payments yet.</p>
          </InteractiveCard>
        ) : (
          <InteractiveCard className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-left px-5 py-3 font-medium">Plan</th>
                  <th className="text-left px-5 py-3 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 font-medium">Coins</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 text-gray-300 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                    <td className="px-5 py-3 text-white capitalize whitespace-nowrap">{p.plan}</td>
                    <td className="px-5 py-3 text-gray-300 whitespace-nowrap">
                      ${(p.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-orange-400 whitespace-nowrap">
                      {p.coinsAwarded > 0 ? `+${p.coinsAwarded.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`capitalize ${paymentStatusColors[p.status] || 'text-gray-400'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </InteractiveCard>
        )}
      </div>
    </div>
  );
};

export default SubscriptionView;
