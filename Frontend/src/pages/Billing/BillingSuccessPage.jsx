import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useSubscription from '../../hooks/useSubscription';

const BillingSuccessPage = () => {
  const { refreshSubscription } = useSubscription();

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-3 text-3xl font-bold text-white">Payment successful</h1>
      <p className="mb-6 text-gray-300">
        Your subscription has been updated. You can now continue with higher limits and premium features.
      </p>
      <div className="flex gap-3">
        <Link
          to="/billing"
          className="rounded-lg bg-lime-400 px-4 py-2 font-semibold text-black hover:bg-lime-300"
        >
          View billing
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
