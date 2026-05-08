import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const PaymentCancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Cancel Card */}
        <div className="bg-gray-800 border border-red-500/30 rounded-2xl p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-red-500/10 rounded-full p-4">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-2">
            Payment Cancelled
          </h1>

          {/* Description */}
          <p className="text-gray-300 mb-6">
            Your payment has been cancelled. Your subscription was not processed.
          </p>

          {/* Reasons */}
          <div className="bg-gray-900/50 rounded-lg p-4 mb-6 text-left space-y-2">
            <h3 className="text-sm font-semibold text-white mb-3">Why this might have happened:</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>You cancelled the payment process</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>The payment failed or was declined</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Your payment method encountered an issue</span>
              </li>
            </ul>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-900/50 rounded-lg p-4 mb-6 text-left space-y-2">
            <h3 className="text-sm font-semibold text-white mb-3">What you can do:</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">→</span>
                <span>Try the payment again with a different payment method</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">→</span>
                <span>Contact support if you need help</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">→</span>
                <span>Review your account settings and preferences</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/user/billing')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <button
              onClick={() => navigate('/user/dashboard')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Support Box */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-yellow-200">
          <p>
            Need help? <a href="mailto:support@jobfinder.ai" className="font-semibold hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
