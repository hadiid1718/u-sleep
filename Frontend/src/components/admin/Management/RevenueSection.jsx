import { useState, useEffect, useCallback } from "react";
import { DollarSign, Target, TrendingUp, Users, Loader2, RefreshCw, CreditCard, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import MetricCard from "../utils/MatricCard";
import { paymentAPI } from "../../../utils/api";

const RevenueSection = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [subPage, setSubPage] = useState(1);
  const [payPage, setPayPage] = useState(1);
  const [subLoading, setSubLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const ITEMS_PER_PAGE = 2;

  const fetchRevenueStats = useCallback(async (currentSubPage = subPage, currentPayPage = payPage, opts = {}) => {
    if (opts.initial) setLoading(true);
    if (opts.sub) setSubLoading(true);
    if (opts.pay) setPayLoading(true);
    setError(null);
    try {
      const result = await paymentAPI.getRevenueStats({
        subPage: currentSubPage,
        subLimit: ITEMS_PER_PAGE,
        payPage: currentPayPage,
        payLimit: ITEMS_PER_PAGE,
      });
      if (result.success) {
        setStats(result.data?.data);
      } else {
        setError(result.error?.message || 'Failed to load revenue data');
      }
    } catch (err) {
      setError(err.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
      setSubLoading(false);
      setPayLoading(false);
    }
  }, [subPage, payPage]);

  useEffect(() => {
    fetchRevenueStats(1, 1, { initial: true });
  }, []);

  const handleSubPageChange = (newPage) => {
    setSubPage(newPage);
    fetchRevenueStats(newPage, payPage, { sub: true });
  };

  const handlePayPageChange = (newPage) => {
    setPayPage(newPage);
    fetchRevenueStats(subPage, newPage, { pay: true });
  };

  const metrics = stats?.metrics;

  const revenueMetrics = [
    {
      title: 'Monthly Revenue',
      value: metrics?.monthlyRevenue || '$0.00',
      change: `${metrics?.monthlyRevenueCount ?? 0} subscriptions`,
      icon: DollarSign,
    },
    {
      title: 'Annual Revenue',
      value: metrics?.annualRevenue || '$0.00',
      change: `${metrics?.annualRevenueCount ?? 0} subscriptions`,
      icon: CalendarDays,
    },
    {
      title: 'New Subscriptions',
      value: String(metrics?.newSubscriptions ?? 0),
      change: metrics?.subChange || '0%',
      icon: TrendingUp,
      trend: parseFloat(metrics?.subChange) >= 0 ? 'up' : 'down',
    },
    {
      title: 'Churn Rate',
      value: metrics?.churnRate || '0%',
      change: null,
      icon: Users,
      trend: 'down',
    },
    {
      title: 'Total Revenue',
      value: metrics?.totalRevenue || '$0.00',
      change: `${metrics?.totalTransactions ?? 0} transactions`,
      icon: Target,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-white text-xl lg:text-2xl font-bold">Revenue & Business Intelligence</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
          <span className="text-gray-300 ml-3">Loading revenue data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-white text-xl lg:text-2xl font-bold">Revenue & Business Intelligence</h2>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => fetchRevenueStats(subPage, payPage, { initial: true })}
            className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl lg:text-2xl font-bold">Revenue & Business Intelligence</h2>
        <button
          onClick={() => fetchRevenueStats(subPage, payPage, { initial: true })}
          className="text-gray-400 hover:text-lime-400 transition-colors p-2 rounded-lg hover:bg-gray-800"
          title="Refresh data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 lg:gap-6">
        {revenueMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Subscription Breakdown */}
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg flex flex-col">
          <h3 className="text-white text-lg font-semibold mb-4">Subscription Breakdown</h3>
          <div className="space-y-3 flex-1">
            {subLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-lime-400 animate-spin" />
              </div>
            ) : stats?.planBreakdown?.length > 0 ? (
              stats.planBreakdown.map((sub, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-300 block text-sm lg:text-base truncate capitalize">
                      {sub.plan === 'manual' ? 'Manual Job Responding' : sub.plan === 'auto' ? 'Auto Responder' : sub.plan}
                    </span>
                    <span className="text-gray-400 text-xs lg:text-sm">{sub.users} users • {sub.count} payments</span>
                  </div>
                  <span className="text-lime-400 font-medium ml-2">${sub.revenue?.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No subscription data yet</p>
            )}
          </div>
          {stats?.planBreakdownPagination?.pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
              <button
                onClick={() => handleSubPageChange(subPage - 1)}
                disabled={subPage <= 1 || subLoading}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-400 text-sm">
                Page {subPage} of {stats.planBreakdownPagination.pages}
              </span>
              <button
                onClick={() => handleSubPageChange(subPage + 1)}
                disabled={subPage >= stats.planBreakdownPagination.pages || subLoading}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg flex flex-col">
          <h3 className="text-white text-lg font-semibold mb-4">Recent Payments</h3>
          <div className="space-y-3 flex-1">
            {payLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-lime-400 animate-spin" />
              </div>
            ) : stats?.recentPayments?.length > 0 ? (
              stats.recentPayments.map((payment, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-300 block text-sm lg:text-base truncate">
                      {payment.userId?.name || payment.userId?.email || 'Unknown User'}
                    </span>
                    <span className="text-gray-400 text-xs lg:text-sm capitalize">
                      {payment.plan} • {new Date(payment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right ml-2">
                    <span className="text-lime-400 font-medium block">${(payment.amount / 100).toFixed(2)}</span>
                    <span className={`text-xs ${payment.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No payments yet</p>
            )}
          </div>
          {stats?.recentPaymentsPagination?.pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
              <button
                onClick={() => handlePayPageChange(payPage - 1)}
                disabled={payPage <= 1 || payLoading}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-400 text-sm">
                Page {payPage} of {stats.recentPaymentsPagination.pages}
              </span>
              <button
                onClick={() => handlePayPageChange(payPage + 1)}
                disabled={payPage >= stats.recentPaymentsPagination.pages || payLoading}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Subscriptions Summary */}
      <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-5 h-5 text-lime-400" />
          <h3 className="text-white text-lg font-semibold">Active Subscriptions</h3>
        </div>
        <p className="text-3xl font-bold text-lime-400">{metrics?.activeSubscriptions ?? 0}</p>
        <p className="text-gray-400 text-sm mt-1">Users with active subscriptions</p>
      </div>
    </div>
  );
};
export default RevenueSection