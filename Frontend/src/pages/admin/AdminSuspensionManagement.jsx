import React, { useEffect, useState } from 'react';
import { fetchAllAppeals, reviewAppeal } from '../../services/suspensionService';
import './AdminSuspensionManagement.css';

const AdminSuspensionManagement = () => {
  const [appeals, setAppeals] = useState([]);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Review form state
  const [reviewData, setReviewData] = useState({
    decision: 'lift_suspension',
    adminResponse: '',
    adminNotes: '',
  });

  const fetchAppealsData = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchAllAppeals(filterStatus, currentPage, 20);
      setAppeals(response.appeals || []);
      setPagination(response.pagination || {});
    } catch (err) {
      setError(err.message || 'Failed to fetch appeals');
      console.error('Error fetching appeals:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, currentPage]);

  useEffect(() => {
    fetchAppealsData();
  }, [fetchAppealsData]);

  const handleReviewAppeal = async () => {
    if (!selectedAppeal) return;

    if (!reviewData.decision) {
      setError('Please select a decision');
      return;
    }

    try {
      setLoading(true);
      await reviewAppeal(selectedAppeal._id, reviewData);
      setSuccess('Appeal reviewed successfully!');
      setSelectedAppeal(null);
      setReviewData({
        decision: 'lift_suspension',
        adminResponse: '',
        adminNotes: '',
      });
      await fetchAppealsData();
    } catch (err) {
      setError(err.message || 'Failed to review appeal');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'under_review':
        return 'status-under-review';
      case 'accepted':
        return 'status-accepted';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const getDecisionColor = (decision) => {
    switch (decision) {
      case 'lift_suspension':
        return 'decision-lift';
      case 'maintain_suspension':
        return 'decision-maintain';
      case 'permanent_block':
        return 'decision-block';
      default:
        return '';
    }
  };

  return (
    <div className="admin-suspension-management">
      <div className="admin-header">
        <h1>🔍 Suspension Appeals Management</h1>
        <p>Review and manage user suspension appeals</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="management-layout">
        {/* Left Panel - Appeals List */}
        <div className="appeals-list-panel">
          <div className="filter-controls">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
                setSelectedAppeal(null);
              }}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loading && appeals.length === 0 ? (
            <div className="loading-state">Loading appeals...</div>
          ) : appeals.length === 0 ? (
            <div className="empty-state">No appeals found.</div>
          ) : (
            <div className="appeals-list">
              {appeals.map((appeal) => (
                <div
                  key={appeal._id}
                  className={`appeal-list-item ${
                    selectedAppeal?._id === appeal._id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedAppeal(appeal)}
                >
                  <div className="list-item-header">
                    <h4>{appeal.userEmail}</h4>
                    <span className={`status-badge ${getStatusColor(appeal.currentStatus)}`}>
                      {appeal.currentStatus.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>
                  <p className="list-item-date">
                    {new Date(appeal.submittedAt).toLocaleDateString()}
                  </p>
                  <p className="list-item-violation">
                    Violations: {appeal.violationCount}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Appeal Details */}
        <div className="appeal-detail-panel">
          {selectedAppeal ? (
            <div className="appeal-detail-content">
              <button
                className="btn-close-detail"
                onClick={() => setSelectedAppeal(null)}
              >
                ✕
              </button>

              {/* User Info */}
              <div className="detail-section user-info">
                <h3>User Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Email</label>
                    <p>{selectedAppeal.userEmail}</p>
                  </div>
                  <div className="info-item">
                    <label>Phone</label>
                    <p>{selectedAppeal.contactInfo?.phone || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Violations Count</label>
                    <p>{selectedAppeal.violationCount}</p>
                  </div>
                  <div className="info-item">
                    <label>Preferred Contact</label>
                    <p>{selectedAppeal.contactInfo?.preferredContact || 'Email'}</p>
                  </div>
                </div>
              </div>

              {/* Suspension Info */}
              <div className="detail-section suspension-info">
                <h3>Suspension Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Suspended At</label>
                    <p>{new Date(selectedAppeal.suspendedAt).toLocaleString()}</p>
                  </div>
                  <div className="info-item">
                    <label>Reason</label>
                    <p>{selectedAppeal.suspensionReason}</p>
                  </div>
                </div>
              </div>

              {/* Appeal Message */}
              <div className="detail-section appeal-message">
                <h3>Appeal Message</h3>
                <div className="message-box">
                  {selectedAppeal.appealMessage}
                </div>
              </div>

              {/* Appeal History */}
              {selectedAppeal.appealsHistory?.length > 0 && (
                <div className="detail-section appeal-history">
                  <h3>Appeal History</h3>
                  {selectedAppeal.appealsHistory.map((item, index) => (
                    <div key={index} className="history-item">
                      <div className="history-header">
                        <span className="history-number">Appeal #{item.appealNumber}</span>
                        <span className="history-date">
                          {new Date(item.submittedAt).toLocaleString()}
                        </span>
                      </div>
                      <p>{item.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Current Status */}
              <div className="detail-section current-status">
                <h3>Current Status</h3>
                <div className="status-display">
                  <span className={`status-large ${getStatusColor(selectedAppeal.currentStatus)}`}>
                    {selectedAppeal.currentStatus.toUpperCase().replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Review Section (if not already reviewed) */}
              {selectedAppeal.currentStatus === 'pending' ||
              selectedAppeal.currentStatus === 'under_review' ? (
                <div className="detail-section review-section">
                  <h3>📋 Review Appeal</h3>

                  <div className="form-group">
                    <label htmlFor="decision">Decision *</label>
                    <select
                      id="decision"
                      value={reviewData.decision}
                      onChange={(e) =>
                        setReviewData({ ...reviewData, decision: e.target.value })
                      }
                      disabled={loading}
                    >
                      <option value="lift_suspension">✅ Lift Suspension</option>
                      <option value="maintain_suspension">⏳ Maintain Suspension</option>
                      <option value="permanent_block">❌ Permanent Block</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="adminResponse">Admin Response *</label>
                    <textarea
                      id="adminResponse"
                      value={reviewData.adminResponse}
                      onChange={(e) =>
                        setReviewData({ ...reviewData, adminResponse: e.target.value })
                      }
                      placeholder="Explain your decision to the user..."
                      rows="4"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="adminNotes">Internal Notes</label>
                    <textarea
                      id="adminNotes"
                      value={reviewData.adminNotes}
                      onChange={(e) =>
                        setReviewData({ ...reviewData, adminNotes: e.target.value })
                      }
                      placeholder="Internal notes (not visible to user)..."
                      rows="3"
                      disabled={loading}
                    />
                  </div>

                  <button
                    onClick={handleReviewAppeal}
                    disabled={loading}
                    className="btn-submit-review"
                  >
                    {loading ? 'Submitting Review...' : 'Submit Review'}
                  </button>
                </div>
              ) : (
                <div className="detail-section review-result">
                  <h3>✅ Already Reviewed</h3>
                  {selectedAppeal.adminReview && (
                    <div className="review-info">
                      <div className="review-item">
                        <label>Decision</label>
                        <p
                          className={`decision-badge ${getDecisionColor(
                            selectedAppeal.adminReview.decision
                          )}`}
                        >
                          {selectedAppeal.adminReview.decision
                            .replace('_', ' ')
                            .toUpperCase()}
                        </p>
                      </div>
                      <div className="review-item">
                        <label>Response</label>
                        <p>{selectedAppeal.adminReview.adminResponse}</p>
                      </div>
                      <div className="review-item">
                        <label>Reviewed By</label>
                        <p>{selectedAppeal.adminReview.reviewedBy || 'System'}</p>
                      </div>
                      <div className="review-item">
                        <label>Reviewed At</label>
                        <p>
                          {new Date(selectedAppeal.adminReview.reviewedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-detail-panel">
              <p>Select an appeal to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSuspensionManagement;
