import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-gray-900 rounded-2xl border border-red-500/30 p-8 text-center relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* Cancel Icon */}
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>

            <h1 className="text-white text-3xl font-bold mb-2">Payment Cancelled</h1>
            <p className="text-gray-400 mb-8">
              Your payment was not processed. No charges were made to your account.
            </p>

            {/* Info Box */}
            <div className="bg-gray-800/50 rounded-xl p-6 mb-8 text-left">
              <h3 className="text-white font-medium mb-3">What happened?</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-gray-500 mt-1">•</span>
                  You cancelled the checkout process
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500 mt-1">•</span>
                  No money has been deducted from your card
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500 mt-1">•</span>
                  You can try again anytime
                </li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Navigate to home and scroll to pricing section
                  navigate('/');
                  setTimeout(() => {
                    const pricingSection = document.getElementById('pricing');
                    if (pricingSection) {
                      pricingSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 300);
                }}
                className="w-full bg-lime-400 text-black py-4 rounded-lg font-bold text-lg hover:bg-lime-300 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              <button
                onClick={() => navigate('/user/dashboard')}
                className="w-full bg-gray-800 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full text-gray-500 py-2 text-sm hover:text-gray-400 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
