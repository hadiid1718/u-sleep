import { useState, useEffect } from "react";
import { DollarSign, Target, TrendingUp, Users, Loader2, RefreshCw, CreditCard } from "lucide-react";
import MetricCard from "../utils/MatricCard";
import { paymentAPI } from "../../../utils/api";

const RevenueSection = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const fetchRevenueStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentAPI.getRevenueStats();
      if (result.success) {
        setStats(result.data?.data);
      } else {
        setError(result.error?.message || 'Failed to load revenue data');
      }
    } catch (err) {
      setError(err.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueStats();
  }, []);

  const metrics = stats?.metrics;

  const revenueMetrics = [
    {
      title: 'Monthly Revenue',
      value: metrics?.monthlyRevenue || '$0.00',
      change: metrics?.revenueChange || '0%',
      icon: DollarSign,
      trend: parseFloat(metrics?.revenueChange) >= 0 ? 'up' : 'down',
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
            onClick={fetchRevenueStats}
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
          onClick={fetchRevenueStats}
          className="text-gray-400 hover:text-lime-400 transition-colors p-2 rounded-lg hover:bg-gray-800"
          title="Refresh data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {revenueMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Subscription Breakdown */}
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Subscription Breakdown</h3>
          <div className="space-y-3">
            {stats?.planBreakdown?.length > 0 ? (
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
        </div>

        {/* Recent Payments */}
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {stats?.recentPayments?.length > 0 ? (
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