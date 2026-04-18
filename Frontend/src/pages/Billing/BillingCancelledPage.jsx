import React from 'react';
import { Link } from 'react-router-dom';

const BillingCancelledPage = () => {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-3 text-3xl font-bold text-white">Checkout cancelled</h1>
      <p className="mb-6 text-gray-300">
        No changes were made to your subscription. You can retry checkout anytime from the billing page.
      </p>
      <Link
        to="/billing"
        className="rounded-lg bg-lime-400 px-4 py-2 font-semibold text-black hover:bg-lime-300"
      >
        Return to billing
      </Link>
    </div>
  );
};

export default BillingCancelledPage;
