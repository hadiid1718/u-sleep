import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Context';
import {
  submitSuspensionAppeal,
  fetchUserAppeals,
  fetchAppealDetails,
  addAppealReply,
} from '../services/suspensionService';
import './SuspensionAppeal.css';

const SuspensionAppeal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('submit');
  const [appeals, setAppeals] = useState([]);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state for submitting appeal
  const [formData, setFormData] = useState({
    appealMessage: '',
    phone: '',
    preferredContact: 'email',
  });

  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    // Check if user is suspended
    if (!user) {
      navigate('/signin');
      return;
    }

    if (user.accountStatus !== 'suspended' && user.accountStatus !== 'blocked') {
      navigate('/dashboard');
      return;
    }

    fetchAppeals();
  }, [user, navigate]);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      const response = await fetchUserAppeals();
      setAppeals(response.appeals || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch appeals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.appealMessage.trim() || formData.appealMessage.length < 10) {
      setError('Appeal message must be at least 10 characters long');
      return;
    }

    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError('Please provide a valid phone number');
      return;
    }

    try {
      setLoading(true);
      await submitSuspensionAppeal(formData);
      setSuccess('Your suspension appeal has been submitted successfully!');
      setFormData({
        appealMessage: '',
        phone: '',
        preferredContact: 'email',
      });
      
      // Refresh appeals list
      await fetchAppeals();
      setActiveTab('appeals');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit appeal');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async (appealId) => {
    if (!replyMessage.trim() || replyMessage.length < 10) {
      setError('Reply message must be at least 10 characters long');
      return;
    }

    try {
      setLoading(true);
      await addAppealReply(appealId, replyMessage);
      setSuccess('Your reply has been added successfully!');
      setReplyMessage('');
      
      // Refresh selected appeal
      const updated = await fetchAppealDetails(appealId);
      setSelectedAppeal(updated.appeal);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const viewAppealDetails = async (appeal) => {
    try {
      setLoading(true);
      const response = await fetchAppealDetails(appeal._id);
      setSelectedAppeal(response.appeal);
    } catch (err) {
      console.error(err);
      setError('Failed to load appeal details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="suspension-appeal-container">
      <div className="appeal-wrapper">
        <div className="appeal-header">
          <h1>🚫 Account Suspension Appeal</h1>
          <p>Request to have your suspension reviewed by our admin team</p>
        </div>

        {/* Account Status Info */}
        <div className="account-status-info">
          <div className={`status-badge status-${user?.accountStatus}`}>
            {user?.accountStatus === 'suspended' ? 'Account Suspended' : 'Account Blocked'}
          </div>
          <div className="status-details">
            <p>
              <strong>Status:</strong> {user?.accountStatus === 'suspended' ? 'Suspended' : 'Blocked'}
            </p>
            <p>
              <strong>Reason:</strong> {user?.statusReason || 'Multiple violations detected'}
            </p>
            {user?.statusUpdatedAt && (
              <p>
                <strong>Since:</strong> {new Date(user.statusUpdatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Tabs */}
        <div className="appeal-tabs">
          <button
            className={`tab-button ${activeTab === 'submit' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('submit');
              setError(null);
              setSuccess(null);
            }}
          >
            📝 Submit Appeal
          </button>
          <button
            className={`tab-button ${activeTab === 'appeals' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('appeals');
              setSelectedAppeal(null);
              setError(null);
              setSuccess(null);
            }}
          >
            📋 Your Appeals ({appeals.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Submit Appeal Tab */}
          {activeTab === 'submit' && (
            <div className="submit-appeal-form">
              <h2>Submit Your Appeal</h2>
              <p className="form-intro">
                Please provide a detailed explanation of why you believe your account was
                suspended in error, or why you believe you deserve a second chance.
              </p>

              <form onSubmit={handleSubmitAppeal}>
                <div className="form-group">
                  <label htmlFor="appealMessage">Appeal Message *</label>
                  <textarea
                    id="appealMessage"
                    value={formData.appealMessage}
                    onChange={(e) =>
                      setFormData({ ...formData, appealMessage: e.target.value })
                    }
                    placeholder="Please explain why you believe your account should be unsuspended..."
                    rows="8"
                    disabled={loading}
                    required
                  />
                  <small>
                    {formData.appealMessage.length}/2000 characters
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Your contact phone number"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="preferredContact">Preferred Contact Method *</label>
                  <select
                    id="preferredContact"
                    value={formData.preferredContact}
                    onChange={(e) =>
                      setFormData({ ...formData, preferredContact: e.target.value })
                    }
                    disabled={loading}
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>

                <div className="form-info">
                  <h4>📌 Tips for a Successful Appeal:</h4>
                  <ul>
                    <li>Be honest and respectful in your explanation</li>
                    <li>Explain what happened and why it won't happen again</li>
                    <li>Provide any relevant context or evidence</li>
                    <li>Our admin team typically responds within 24-48 hours</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Appeal'}
                </button>
              </form>
            </div>
          )}

          {/* Appeals History Tab */}
          {activeTab === 'appeals' && (
            <div className="appeals-list">
              {loading ? (
                <div className="loading-state">
                  <p>Loading appeals...</p>
                </div>
              ) : appeals.length === 0 ? (
                <div className="empty-state">
                  <p>📋 You haven't submitted any appeals yet.</p>
                  <button
                    className="btn-primary"
                    onClick={() => setActiveTab('submit')}
                  >
                    Submit Your First Appeal
                  </button>
                </div>
              ) : (
                <>
                  {selectedAppeal ? (
                    <div className="appeal-detail-view">
                      <button
                        className="btn-back"
                        onClick={() => setSelectedAppeal(null)}
                      >
                        ← Back to Appeals
                      </button>

                      <div className="appeal-detail">
                        <div className="detail-header">
                          <h3>Appeal Details</h3>
                          <span className={`status-badge status-${selectedAppeal.currentStatus}`}>
                            {selectedAppeal.currentStatus.toUpperCase().replace('_', ' ')}
                          </span>
                        </div>

                        <div className="detail-info">
                          <p>
                            <strong>Submitted:</strong>{' '}
                            {new Date(selectedAppeal.submittedAt).toLocaleString()}
                          </p>
                          <p>
                            <strong>Violation Count:</strong> {selectedAppeal.violationCount}
                          </p>
                          <p>
                            <strong>Suspension Reason:</strong> {selectedAppeal.suspensionReason}
                          </p>
                        </div>

                        {/* Appeal History */}
                        <div className="appeal-history">
                          <h4>📝 Appeal History</h4>
                          {selectedAppeal.appealsHistory?.map((appeal, index) => (
                            <div key={index} className="history-item">
                              <div className="history-header">
                                <span className="appeal-number">Appeal #{appeal.appealNumber}</span>
                                <span className="history-date">
                                  {new Date(appeal.submittedAt).toLocaleString()}
                                </span>
                                <span className={`history-status status-${appeal.status}`}>
                                  {appeal.status.toUpperCase()}
                                </span>
                              </div>
                              <p className="history-message">{appeal.message}</p>
                            </div>
                          ))}
                        </div>

                        {/* Admin Response */}
                        {selectedAppeal.adminReview?.decision && (
                          <div className="admin-response">
                            <h4>✅ Admin Response</h4>
                            <div className={`response-content decision-${selectedAppeal.adminReview.decision}`}>
                              <p>
                                <strong>Decision:</strong>{' '}
                                {selectedAppeal.adminReview.decision
                                  .replace('_', ' ')
                                  .toUpperCase()}
                              </p>
                              {selectedAppeal.adminReview.adminResponse && (
                                <p>
                                  <strong>Response:</strong> {selectedAppeal.adminReview.adminResponse}
                                </p>
                              )}
                              <p>
                                <strong>Reviewed:</strong>{' '}
                                {new Date(
                                  selectedAppeal.adminReview.reviewedAt
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Add Reply (if still under review) */}
                        {(selectedAppeal.currentStatus === 'pending' ||
                          selectedAppeal.currentStatus === 'under_review') && (
                          <div className="add-reply-section">
                            <h4>📨 Add Reply</h4>
                            <div className="reply-form">
                              <textarea
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Add additional information or reply to admin feedback..."
                                rows="4"
                                disabled={loading}
                              />
                              <button
                                onClick={() => handleAddReply(selectedAppeal._id)}
                                disabled={!replyMessage.trim() || loading}
                                className="btn-add-reply"
                              >
                                {loading ? 'Adding...' : 'Add Reply'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="appeals-summary">
                      {appeals.map((appeal) => (
                        <div key={appeal._id} className="appeal-card">
                          <div className="card-header">
                            <h4>Appeal #{appeal.appealsHistory?.length || 1}</h4>
                            <span className={`status-badge status-${appeal.currentStatus}`}>
                              {appeal.currentStatus.toUpperCase().replace('_', ' ')}
                            </span>
                          </div>
                          <div className="card-body">
                            <p>
                              <strong>Submitted:</strong>{' '}
                              {new Date(appeal.submittedAt).toLocaleDateString()}
                            </p>
                            <p>
                              <strong>Reason:</strong> {appeal.suspensionReason.substring(0, 100)}
                              ...
                            </p>
                            {appeal.adminReview?.decision && (
                              <p>
                                <strong>Decision:</strong>{' '}
                                {appeal.adminReview.decision
                                  .replace('_', ' ')
                                  .toUpperCase()}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => viewAppealDetails(appeal)}
                            className="btn-view-details"
                          >
                            View Details →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="appeal-help-section">
          <h3>❓ Need Help?</h3>
          <p>
            If you have questions about your suspension or the appeal process, please contact
            our support team at <strong>support@jobfinderai.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuspensionAppeal;
