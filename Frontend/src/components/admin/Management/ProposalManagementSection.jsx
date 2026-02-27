import React, { useState, useEffect } from 'react';
import { FileText, Send, CheckCircle, XCircle, Clock, Trash2, Eye, RefreshCw } from 'lucide-react';
import { proposalAPI } from '../../../utils/api';

const ProposalManagementSection = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const result = await proposalAPI.getUserProposals({ page, limit: 10, status: statusFilter });
      if (result.success) {
        setProposals(result.data?.data?.proposals || []);
        setPagination(result.data?.data?.pagination || { total: 0, pages: 1 });
        setStats(result.data?.data?.stats || null);
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await proposalAPI.getProposalStats();
      if (result.success) {
        setStats(result.data?.data?.stats || null);
      }
    } catch (err) {
      console.error('Error fetching proposal stats:', err);
    }
  };

  useEffect(() => {
    fetchProposals();
    fetchStats();
  }, [page, statusFilter]);

  const handleStatusUpdate = async (proposalId, newStatus) => {
    const result = await proposalAPI.updateProposalStatus(proposalId, newStatus);
    if (result.success) {
      fetchProposals();
      fetchStats();
    }
  };

  const handleDelete = async (proposalId) => {
    if (!confirm('Are you sure you want to delete this proposal?')) return;
    const result = await proposalAPI.deleteProposal(proposalId);
    if (result.success) {
      fetchProposals();
      fetchStats();
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-600 text-gray-200',
      sent: 'bg-blue-600 text-blue-100',
      received: 'bg-purple-600 text-purple-100',
      viewed: 'bg-yellow-600 text-yellow-100',
      accepted: 'bg-green-600 text-green-100',
      rejected: 'bg-red-600 text-red-100',
      withdrawn: 'bg-orange-600 text-orange-100',
    };
    return colors[status] || 'bg-gray-600 text-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: Clock,
      sent: Send,
      accepted: CheckCircle,
      rejected: XCircle,
    };
    return icons[status] || FileText;
  };

  const statCards = stats ? [
    { label: 'Total', value: stats.total || 0, icon: FileText, color: 'text-white' },
    { label: 'Draft', value: stats.draft || 0, icon: Clock, color: 'text-gray-400' },
    { label: 'Sent', value: stats.sent || 0, icon: Send, color: 'text-blue-400' },
    { label: 'Accepted', value: stats.accepted || 0, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Rejected', value: stats.rejected || 0, icon: XCircle, color: 'text-red-400' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-white text-xl lg:text-2xl font-bold">Proposal Management</h2>
        <button
          onClick={() => { fetchProposals(); fetchStats(); }}
          className="flex items-center gap-2 bg-lime-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-lime-500 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className={stat.color} />
                  <span className="text-gray-400 text-sm">{stat.label}</span>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['', 'draft', 'sent', 'accepted', 'rejected', 'viewed', 'withdrawn'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === s
                ? 'bg-lime-400 text-gray-900'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Proposals Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-lime-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading proposals...</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <FileText size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No proposals found</p>
          <p className="text-gray-500 text-sm mt-2">Proposals will appear here once generated</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Job</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Status</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">AI Model</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Created</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((proposal) => {
                  const StatusIcon = getStatusIcon(proposal.status);
                  return (
                    <tr key={proposal._id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition">
                      <td className="px-4 py-3">
                        <p className="text-white text-sm font-medium truncate max-w-[200px]">
                          {proposal.jobId?.title || 'Untitled Job'}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {proposal.jobId?.budgetType === 'fixed'
                            ? `$${proposal.jobId?.budget?.amount || 0}`
                            : `$${proposal.jobId?.hourlyRate?.min || 0}-$${proposal.jobId?.hourlyRate?.max || 0}/hr`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                          <StatusIcon size={12} />
                          {proposal.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-300 text-sm">{proposal.aiService || proposal.aiModel || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-400 text-sm">
                          {proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedProposal(selectedProposal?._id === proposal._id ? null : proposal)}
                            className="text-blue-400 hover:text-blue-300 transition"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          {proposal.status === 'draft' && (
                            <button
                              onClick={() => handleStatusUpdate(proposal._id, 'sent')}
                              className="text-lime-400 hover:text-lime-300 transition"
                              title="Mark as Sent"
                            >
                              <Send size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(proposal._id)}
                            className="text-red-400 hover:text-red-300 transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-700">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50 hover:bg-gray-600 transition"
              >
                Prev
              </button>
              <span className="px-3 py-1 text-gray-400">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50 hover:bg-gray-600 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Selected Proposal Detail Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-bold">Proposal Details</h3>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Job Title</p>
                <p className="text-white">{selectedProposal.jobId?.title || 'Untitled'}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProposal.status)}`}>
                  {selectedProposal.status}
                </span>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-2">Content</p>
                <div className="bg-gray-900 rounded-lg p-4 text-gray-300 text-sm whitespace-pre-line max-h-60 overflow-y-auto">
                  {selectedProposal.content || 'No content generated yet.'}
                </div>
              </div>

              {selectedProposal.userRating && (
                <div>
                  <p className="text-gray-400 text-sm">User Rating</p>
                  <p className="text-yellow-400">{'★'.repeat(selectedProposal.userRating)}{'☆'.repeat(5 - selectedProposal.userRating)}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {selectedProposal.status === 'draft' && (
                  <button
                    onClick={() => { handleStatusUpdate(selectedProposal._id, 'sent'); setSelectedProposal(null); }}
                    className="bg-lime-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-lime-500 transition"
                  >
                    Mark as Sent
                  </button>
                )}
                {selectedProposal.status === 'sent' && (
                  <>
                    <button
                      onClick={() => { handleStatusUpdate(selectedProposal._id, 'accepted'); setSelectedProposal(null); }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-500 transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => { handleStatusUpdate(selectedProposal._id, 'rejected'); setSelectedProposal(null); }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-500 transition"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalManagementSection;
