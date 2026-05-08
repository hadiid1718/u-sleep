import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Optionally verify session on backend
    if (sessionId) {
      // You can add verification logic here if needed
      console.log('Payment verified with session:', sessionId);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Success Card */}
        <div className="bg-gray-800 border border-green-500/30 rounded-2xl p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-500/10 rounded-full p-4">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-2">
            Payment Successful!
          </h1>

          {/* Description */}
          <p className="text-gray-300 mb-6">
            Your subscription has been activated. Your new plan is now active and ready to use.
          </p>

          {/* Session Info */}
          {sessionId && (
            <div className="bg-gray-900 rounded-lg p-3 mb-6 text-left">
              <p className="text-xs text-gray-400 mb-1">Session ID</p>
              <p className="text-sm text-gray-200 break-all font-mono">{sessionId}</p>
            </div>
          )}

          {/* Features */}
          <div className="bg-gray-900/50 rounded-lg p-4 mb-6 text-left space-y-2">
            <h3 className="text-sm font-semibold text-white mb-3">What's next?</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Your plan will be reviewed and activated by our admin team</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>You'll receive a notification once approved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Access premium features immediately after approval</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/user/dashboard')}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/user/billing')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition"
            >
              View Billing
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-200">
          <p>
            <strong>Note:</strong> Your plan requires admin approval before full activation. 
            Check your email for updates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
