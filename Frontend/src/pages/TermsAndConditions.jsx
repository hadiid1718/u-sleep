import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Context';
import { fetchActiveTerms, acceptTerms, checkTermsAcceptance } from '../services/suspensionService';
import './TermsAndConditions.css';

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [terms, setTerms] = useState(null);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [fromSignUp, setFromSignUp] = useState(false);

  useEffect(() => {
    const fetchTermsData = async () => {
      try {
        setLoading(true);
        
        // Check if this is from sign-up flow
        const params = new URLSearchParams(window.location.search);
        if (params.get('fromSignUp') === 'true') {
          setFromSignUp(true);
        }

        // Fetch active terms
        const termsResponse = await fetchActiveTerms();
        setTerms(termsResponse.terms);

        // Check if user already accepted
        if (user) {
          const checkResponse = await checkTermsAcceptance();
          setHasAccepted(checkResponse.hasAccepted);
        }
      } catch (err) {
        setError(err.message || 'Failed to load terms and conditions');
        console.error('Error fetching terms:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTermsData();
  }, [user]);

  const handleAccept = async () => {
    if (!agreeChecked) {
      setError('You must agree to the terms and conditions');
      return;
    }

    try {
      setAccepting(true);
      await acceptTerms(terms.version);
      setHasAccepted(true);
      
      // Redirect based on where they came from
      if (fromSignUp) {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Failed to accept terms');
      console.error('Error accepting terms:', err);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="terms-container">
        <div className="terms-loading">
          <p>Loading Terms and Conditions...</p>
        </div>
      </div>
    );
  }

  if (error && !terms) {
    return (
      <div className="terms-container">
        <div className="terms-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Go Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="terms-container">
      <div className="terms-wrapper">
        <div className="terms-header">
          <h1>{terms?.title || 'Terms and Conditions'}</h1>
          <p className="terms-version">Version: {terms?.version}</p>
        </div>

        {error && <div className="terms-error-banner">{error}</div>}

        <div className="terms-content">
          <div 
            className="terms-text"
            dangerouslySetInnerHTML={{
              __html: terms?.content || '<p>Terms and conditions content goes here.</p>',
            }}
          />

          {/* Violation Rules Section */}
          {terms?.violationRules && terms.violationRules.length > 0 && (
            <div className="violation-rules-section">
              <h2>Prohibited Conduct & Violation Rules</h2>
              <div className="rules-grid">
                {terms.violationRules.map((rule, index) => (
                  <div key={index} className={`rule-card severity-${rule.severity}`}>
                    <div className="rule-header">
                      <h3>{rule.ruleName}</h3>
                      <span className={`severity-badge severity-${rule.severity}`}>
                        {rule.severity.toUpperCase()}
                      </span>
                    </div>
                    <p>{rule.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suspension Policy */}
          {terms?.suspensionPolicy && (
            <div className="suspension-policy-section">
              <h2>Suspension & Account Violation Policy</h2>
              <div className="policy-details">
                <div className="policy-item">
                  <h3>⚠️ Warning Threshold</h3>
                  <p>
                    First violation triggers: {terms.suspensionPolicy.warningCount} warning
                    {terms.suspensionPolicy.warningCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="policy-item">
                  <h3>🚫 Suspension Threshold</h3>
                  <p>
                    Account suspension occurs after: {terms.suspensionPolicy.suspensionThreshold}{' '}
                    violations
                  </p>
                </div>
                <div className="policy-item">
                  <h3>⏱️ Suspension Duration</h3>
                  <p>
                    Initial suspension duration: {terms.suspensionPolicy.suspensionDuration} days
                  </p>
                </div>
              </div>

              <div className="policy-explanation">
                <h3>How It Works:</h3>
                <ol>
                  <li>
                    <strong>1st & 2nd Violations:</strong> You will receive 2 warning messages
                    (via in-app notification and email) explaining the violation.
                  </li>
                  <li>
                    <strong>3rd Violation:</strong> Your account will be automatically suspended
                    without warning.
                  </li>
                  <li>
                    <strong>While Suspended:</strong> You can only access the suspension appeal
                    page to request reinstatement.
                  </li>
                  <li>
                    <strong>Appeal Process:</strong> Submit an appeal with your explanation, and
                    our admin team will review and make a decision.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Agreement Section */}
        <div className="terms-agreement">
          <div className="agreement-checkbox">
            <input
              type="checkbox"
              id="agree"
              checked={agreeChecked}
              onChange={(e) => {
                setAgreeChecked(e.target.checked);
                if (error) setError(null);
              }}
              disabled={hasAccepted}
            />
            <label htmlFor="agree">
              I agree to the Terms and Conditions and understand the violation policy and
              suspension rules.
            </label>
          </div>

          {hasAccepted ? (
            <div className="terms-accepted-message">
              <p>✅ You have already accepted these terms and conditions.</p>
            </div>
          ) : (
            <div className="terms-actions">
              <button
                className="btn-decline"
                onClick={() => navigate('/')}
                disabled={accepting}
              >
                Decline
              </button>
              <button
                className="btn-accept"
                onClick={handleAccept}
                disabled={!agreeChecked || accepting}
              >
                {accepting ? 'Accepting...' : 'Accept Terms'}
              </button>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="terms-info-box">
          <h3>Important Information</h3>
          <ul>
            <li>
              By using this service, you agree to comply with these terms and conditions.
            </li>
            <li>
              Any violation of these terms may result in warnings, account suspension, or
              permanent account termination.
            </li>
            <li>
              You can appeal your suspension through the dedicated appeal form if your account
              is suspended.
            </li>
            <li>
              Last updated: {terms?.updatedAt ? new Date(terms.updatedAt).toLocaleDateString() : 'N/A'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
