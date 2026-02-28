import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { AppContext } from '../context/Context';
import { paymentAPI } from '../utils/api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUser } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('No session ID found');
        setLoading(false);
        return;
      }

      try {
        const result = await paymentAPI.verifySession(sessionId);
        if (result.success) {
          setPaymentData(result.data?.data);

          // Update user context with subscription
          if (result.data?.data && user) {
            const updatedUser = {
              ...user,
              subscription: result.data.data.subscription,
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } else {
          setError(result.error?.message || 'Failed to verify payment');
        }
      } catch (err) {
        setError(err.message || 'Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-lime-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl border border-red-500/30 p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-red-400 text-3xl">!</span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-3">Verification Issue</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/user/dashboard')}
            className="bg-lime-400 text-black px-6 py-3 rounded-lg font-medium hover:bg-lime-300 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Success Animation Card */}
        <div className="bg-gray-900 rounded-2xl border border-lime-400/30 p-8 text-center relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-lime-400/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-12 h-12 text-lime-400" />
            </div>

            <h1 className="text-white text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-gray-400 mb-8">Your subscription has been activated</p>

            {/* Plan Details */}
            {paymentData?.payment && (
              <div className="bg-gray-800/50 rounded-xl p-6 mb-6 text-left space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Plan</span>
                  <span className="text-white font-medium capitalize">
                    {paymentData.payment.plan === 'manual' ? 'Manual Job Responding' : 'Auto Responder'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Amount Paid</span>
                  <span className="text-lime-400 font-bold">
                    ${(paymentData.payment.amount / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status</span>
                  <span className="bg-lime-400/20 text-lime-400 px-3 py-1 rounded-full text-sm font-medium">
                    {paymentData.payment.status}
                  </span>
                </div>
              </div>
            )}


            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/user/dashboard')}
                className="w-full bg-lime-400 text-black py-4 rounded-lg font-bold text-lg hover:bg-lime-300 transition-colors flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-800 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
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

export default PaymentSuccess;
