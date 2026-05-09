import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, DollarSign, Eye, Trash2 } from 'lucide-react';

const AdminSubscriptionTab = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // pending, active, refunds
  const [actionModal, setActionModal] = useState(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
    fetchRefundRequests();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/v1/admin/subscriptions');
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
    setLoading(false);
  };

  const fetchRefundRequests = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/v1/admin/refund-requests');
      const data = await response.json();
      setRefundRequests(data.refundRequests || []);
    } catch (error) {
      console.error('Error fetching refund requests:', error);
    }
  };

  const approveSubscription = async (userId, subscriptionId) => {
    try {
      await fetch(`/api/v1/admin/subscriptions/${subscriptionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setActionModal(null);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error approving subscription:', error);
    }
  };

  const declineSubscription = async (userId, subscriptionId, reason = '') => {
    try {
      await fetch(`/api/v1/admin/subscriptions/${subscriptionId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason }),
      });
      setActionModal(null);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error declining subscription:', error);
    }
  };

  const approveRefund = async (refundId, userId) => {
    try {
      await fetch(`/api/v1/admin/refund-requests/${refundId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setActionModal(null);
      fetchRefundRequests();
    } catch (error) {
      console.error('Error approving refund:', error);
    }
  };

  const declineRefund = async (refundId, userId, reason = '') => {
    try {
      await fetch(`/api/v1/admin/refund-requests/${refundId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason }),
      });
      setActionModal(null);
      fetchRefundRequests();
    } catch (error) {
      console.error('Error declining refund:', error);
    }
  };

  const pendingSubscriptions = subscriptions.filter(s => s.status === 'pending_approval');
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {[
          { id: 'pending', label: 'Pending Approvals', count: pendingSubscriptions.length },
          { id: 'active', label: 'Active Subscriptions', count: activeSubscriptions.length },
          { id: 'refunds', label: 'Refund Requests', count: refundRequests.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab.id
                ? 'border-lime-400 text-lime-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
            <span className="ml-2 bg-gray-700 px-2 py-0.5 rounded text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Pending Approvals Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-400">Loading...</div>
          ) : pendingSubscriptions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No pending approvals</div>
          ) : (
            pendingSubscriptions.map(sub => (
              <div
                key={sub._id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">{sub.userEmail}</h3>
                      <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded">
                        {sub.plan?.name || 'Unknown'} Plan
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                      <div>User ID: <span className="text-gray-400">{sub.userId}</span></div>
                      <div>Amount: <span className="text-gray-400">${sub.plan?.monthlyPrice}</span></div>
                      <div>Requested: <span className="text-gray-400">{new Date(sub.createdAt).toLocaleDateString()}</span></div>
                      <div>Payment Status: <span className="text-green-400">{sub.paymentStatus}</span></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActionModal({ type: 'approve', sub })}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => setActionModal({ type: 'decline', sub })}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition"
                    >
                      <XCircle className="w-4 h-4 inline mr-1" />
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Active Subscriptions Tab */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-400">Loading...</div>
          ) : activeSubscriptions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No active subscriptions</div>
          ) : (
            activeSubscriptions.map(sub => (
              <div
                key={sub._id}
                className="bg-gray-800 border border-green-500/30 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <h3 className="font-semibold text-white">{sub.userEmail}</h3>
                      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                        Active - {sub.plan?.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                      <div>Monthly: <span className="text-gray-400">${sub.plan?.monthlyPrice}</span></div>
                      <div>Proposal Limit: <span className="text-gray-400">{sub.plan?.proposalLimit}</span></div>
                      <div>Activated: <span className="text-gray-400">{new Date(sub.activatedAt).toLocaleDateString()}</span></div>
                      <div>Next Billing: <span className="text-gray-400">{new Date(sub.nextBillingDate).toLocaleDateString()}</span></div>
                    </div>
                  </div>
                  <button
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Refund Requests Tab */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          {refundRequests.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No refund requests</div>
          ) : (
            refundRequests.map(refund => (
              <div
                key={refund._id}
                className={`bg-gray-800 border rounded-lg p-4 ${
                  refund.status === 'pending' ? 'border-orange-500/30' : 'border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-orange-400" />
                      <h3 className="font-semibold text-white">{refund.userEmail}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        refund.status === 'pending' 
                          ? 'bg-orange-500/20 text-orange-400'
                          : refund.status === 'approved'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {refund.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-300 mb-3">
                      <div>Refund Amount: <span className="text-gray-400">${refund.amount}</span></div>
                      <div>Plan: <span className="text-gray-400">{refund.planName}</span></div>
                      <div>Requested: <span className="text-gray-400">{new Date(refund.createdAt).toLocaleDateString()}</span></div>
                      <div>Days Since Purchase: <span className="text-gray-400">{refund.daysSincePurchase}/5</span></div>
                    </div>
                    {refund.reason && (
                      <div className="bg-gray-900 rounded p-2 mb-3">
                        <p className="text-xs text-gray-400">Reason:</p>
                        <p className="text-sm text-gray-300">{refund.reason}</p>
                      </div>
                    )}
                  </div>
                  {refund.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActionModal({ type: 'approve-refund', refund })}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'decline-refund', refund })}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition"
                      >
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            {actionModal.type === 'approve' && (
              <>
                <h3 className="text-lg font-bold text-white mb-4">
                  Approve {actionModal.sub.plan?.name} Plan?
                </h3>
                <p className="text-gray-300 mb-6">
                  Grant access to {actionModal.sub.userEmail} for the {actionModal.sub.plan?.name} plan
                  (${actionModal.sub.plan?.monthlyPrice}/month)
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActionModal(null)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => approveSubscription(actionModal.sub.userId, actionModal.sub._id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded transition font-medium"
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}

            {actionModal.type === 'decline' && (
              <>
                <h3 className="text-lg font-bold text-white mb-4">
                  Decline {actionModal.sub.plan?.name} Plan?
                </h3>
                <textarea
                  placeholder="Reason for declining (optional)"
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-gray-200 text-sm mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setActionModal(null)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => declineSubscription(actionModal.sub.userId, actionModal.sub._id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded transition font-medium"
                  >
                    Decline
                  </button>
                </div>
              </>
            )}

            {actionModal.type === 'approve-refund' && (
              <>
                <h3 className="text-lg font-bold text-white mb-4">
                  Approve Refund?
                </h3>
                <p className="text-gray-300 mb-6">
                  Refund ${actionModal.refund.amount} to {actionModal.refund.userEmail}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActionModal(null)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => approveRefund(actionModal.refund._id, actionModal.refund.userId)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded transition font-medium"
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}

            {actionModal.type === 'decline-refund' && (
              <>
                <h3 className="text-lg font-bold text-white mb-4">
                  Decline Refund?
                </h3>
                <textarea
                  placeholder="Reason for declining (optional)"
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-gray-200 text-sm mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setActionModal(null)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => declineRefund(actionModal.refund._id, actionModal.refund.userId)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded transition font-medium"
                  >
                    Decline
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionTab;
