import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AlertCircle, CheckCircle, Clock, DollarSign, TrendingUp, X, Send
} from 'lucide-react';
import useSubscription from '../../hooks/useSubscription';

const UserSubscriptionTab = () => {
  const { subscription, proposalsUsed, proposalLimit } = useSubscription();
  const [usageData, setUsageData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
    fetchAnalyticsData();
  }, [subscription?.plan]);

  const fetchUsageData = async () => {
    try {
      // Replace with actual API endpoint
      const response = await fetch('/api/v1/user/subscription/usage');
      const data = await response.json();
      setUsageData(data);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Replace with actual API endpoint
      const response = await fetch('/api/v1/user/subscription/analytics');
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
    setLoading(false);
  };

  const submitRefundRequest = async () => {
    try {
      await fetch('/api/v1/user/refund-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription?._id,
          reason: refundReason,
        }),
      });
      setShowRefundModal(false);
      setRefundReason('');
      fetchUsageData();
    } catch (error) {
      console.error('Error submitting refund request:', error);
    }
  };

  const declinePlan = async () => {
    try {
      await fetch('/api/v1/user/subscription/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription?._id }),
      });
      setShowDeclineModal(false);
      fetchUsageData();
    } catch (error) {
      console.error('Error declining plan:', error);
    }
  };

  if (!subscription) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
        <p className="text-blue-200">No active subscription. Visit the Billing page to upgrade.</p>
      </div>
    );
  }

  const usagePercentage = (proposalsUsed / proposalLimit) * 100;
  const daysRemaining = subscription?.currentPeriodEnd 
    ? Math.ceil((new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const plan = subscription?.plan || 'Unknown';
  const status = subscription?.status || 'inactive';

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Active Plan Card */}
        <div className="bg-gray-800 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-xs font-semibold text-gray-400">ACTIVE PLAN</span>
          </div>
          <h3 className="text-2xl font-bold text-white">{plan}</h3>
          <p className="text-sm text-green-400 mt-1">Active</p>
        </div>

        {/* Status Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-semibold text-gray-400">STATUS</span>
          </div>
          <h3 className="text-2xl font-bold text-white capitalize">{status}</h3>
          <p className="text-sm text-blue-400 mt-1">Pending admin approval</p>
        </div>

        {/* Days Remaining */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-semibold text-gray-400">DAYS REMAINING</span>
          </div>
          <h3 className="text-2xl font-bold text-white">{daysRemaining}</h3>
          <p className="text-sm text-purple-400 mt-1">Until renewal</p>
        </div>

        {/* Price Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-yellow-400" />
            <span className="text-xs font-semibold text-gray-400">MONTHLY PRICE</span>
          </div>
          <h3 className="text-2xl font-bold text-white">${subscription?.plan?.monthlyPrice || 0}</h3>
          <p className="text-sm text-yellow-400 mt-1">Per month</p>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Proposal Usage</h2>
        
        {/* Usage Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-300">
              {proposalsUsed} of {proposalLimit} proposals used
            </span>
            <span className="text-sm font-semibold text-white">
              {Math.round(usagePercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all ${
                usagePercentage > 90
                  ? 'bg-red-500'
                  : usagePercentage > 70
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </div>

        {/* Usage Details Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Proposals Remaining</p>
            <p className="text-3xl font-bold text-lime-400">
              {Math.max(0, proposalLimit - proposalsUsed)}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Reset Date</p>
            <p className="text-lg font-bold text-white">
              {subscription?.nextResetDate
                ? new Date(subscription.nextResetDate).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      {loading ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center text-gray-400">
          Loading analytics...
        </div>
      ) : analyticsData ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Daily Proposals Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Daily Proposals</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.dailyProposals || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={{ fill: '#22C55E' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Usage by Category */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Usage by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.usageByCategory || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.usageByCategory?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#22C55E', '#3B82F6', '#F59E0B'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Distribution */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Platform Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.platformDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="platform" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Features Available */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Available Features</h3>
            <div className="space-y-3">
              {subscription?.plan?.features?.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowRefundModal(true)}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium transition"
        >
          Request Refund
        </button>
        <button
          onClick={() => setShowDeclineModal(true)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition"
        >
          Decline Plan
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          <strong>Note:</strong> Refund requests are valid only within 5 days of admin approval. 
          Declining a plan will cancel your subscription immediately.
        </p>
      </div>

      {/* Refund Request Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Request Refund</h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mb-4">
              <p className="text-sm text-yellow-200">
                Refunds are only available within 5 days of your plan activation.
              </p>
            </div>

            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Tell us why you'd like a refund..."
              className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-gray-200 text-sm mb-4 resize-none"
              rows={4}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={submitRefundRequest}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded transition font-medium flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Plan Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-bold text-white">Decline Plan?</h3>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to decline this plan? This action will:
            </p>

            <ul className="space-y-2 mb-6 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Cancel your subscription immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Remove access to premium features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Disable proposal generation</span>
              </li>
            </ul>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition"
              >
                Keep Plan
              </button>
              <button
                onClick={declinePlan}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded transition font-medium"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSubscriptionTab;
