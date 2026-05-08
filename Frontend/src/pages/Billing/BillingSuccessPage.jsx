import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useSubscription from '../../hooks/useSubscription';
import billingService from '../../services/billingService';

const BillingSuccessPage = () => {
  const { refreshSubscription } = useSubscription();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Finalizing your subscription...');
  const [isFinalizing, setIsFinalizing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const finalize = async () => {
      const sessionId = searchParams.get('session_id');

      if (sessionId) {
        const response = await billingService.finalizeCheckoutSession(sessionId);

        if (!response.success) {
          setError(response.error?.message || 'Unable to finalize checkout session');
          setMessage('Your payment was received, but syncing the subscription is still pending.');
        } else {
          setMessage('Your subscription has been synced successfully.');
        }
      } else {
        setMessage('Payment completed. Syncing your subscription...');
      }

      await refreshSubscription();
      setIsFinalizing(false);
    };

    finalize();
  }, [refreshSubscription, searchParams]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-3 text-3xl font-bold text-white">Payment successful</h1>
      <p className="mb-6 text-gray-300">
        {message}
      </p>
      {error && (
        <p className="mb-6 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Link
          to="/billing"
          className="rounded-lg bg-lime-400 px-4 py-2 font-semibold text-black hover:bg-lime-300"
        >
          {isFinalizing ? 'Syncing...' : 'View billing'}
        </Link>
        <Link
          to="/user/dashboard"
          className="rounded-lg border border-gray-500 px-4 py-2 font-semibold text-gray-200 hover:bg-gray-800"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
};

export default BillingSuccessPage;
