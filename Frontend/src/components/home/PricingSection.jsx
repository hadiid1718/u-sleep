import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const PricingSection = () => {
  const [selectedPlan, setSelectedPlan] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userInfo, setUserInfo] = useState({ userId: null, email: null });

  // Configuration
  const API_URL = 'http://localhost:8080/api/payment'; // Change for production
  const STRIPE_PUBLIC_KEY = 'pk_test_51PWImTD7s4U8RST425yk4TL9dvDzSxRLXqmEBOs0JuT5OWLUIePMb2tPKnszgZxhLMR4JzJA2kEltFQ7Ga2fRVEj00PucfJxOl';
  
  const PLANS = {
    manual: {
      name: 'Manual job responding',
      price: '$50/month',
      features: [
        'Job hunting and job filtering',
        'AI responds for all prospects',
        'Connect with prospects'
      ]
    },
    auto: {
      name: 'Auto responder',
      price: '$0.5/response',
      features: [
        'Everything from manual',
        'Auto upload to Upwork daily',
        'Advanced filtering options'
      ],
      isPopular: true
    }
  };

  // Get user info from localStorage/context (update as needed)
  useEffect(() => {
    const getUserInfo = () => {
      // Replace this with your actual user data retrieval
      // For example, from Redux, Context API, or localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        try {
          const user = JSON.parse(storedUser);
          setUserInfo({
            userId: user.id || user._id,
            email: user.email
          });
        } catch (e) {
          console.error('Error parsing user data:', e);
          localStorage.removeItem('user');
        }
      }
    };
    getUserInfo();
  }, []);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setError(null);
    setSuccess(null);
  };

  const handleCheckout = async () => {
    // Validate user info
    if (!userInfo.userId) {
      setError('Please login first to proceed with checkout');
      return;
    }

    if (!userInfo.email) {
      setError('Email is required to proceed with checkout');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Creating checkout session for plan:', selectedPlan);
      console.log('Calling API:', `${API_URL}/create-checkout-session`);
      
      // Call backend to create checkout session
      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          userId: userInfo.userId,
          email: userInfo.email
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Checkout session created:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      setSuccess('Redirecting to checkout...');

      // Redirect to Stripe Checkout
      if (data.url) {
        setTimeout(() => {
          window.location.href = data.url;
        }, 500);
      } else {
        throw new Error('No checkout URL provided');
      }

    } catch (err) {
      console.error('Checkout error:', err);
      
      let errorMessage = 'Failed to start checkout. Please try again.';
      
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Make sure your backend is running on ' + API_URL;
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!userInfo.userId) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: userInfo.userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to access subscription portal');
      }

      window.location.href = data.url;

    } catch (err) {
      console.error('Portal error:', err);
      setError(err.message || 'Failed to access subscription portal');
      setLoading(false);
    }
  };

  return (
    <section className="bg-black py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          We have <span className="text-lime-400">2 products</span>
        </h2>

        {/* Error Alert */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="max-w-2xl mx-auto mb-8 bg-green-900/20 border border-green-500 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300">{success}</p>
          </div>
        )}

        {/* Login Prompt */}
        {!userInfo.userId && (
          <div className="max-w-2xl mx-auto mb-8 bg-amber-900/20 border border-amber-500 rounded-lg p-4">
            <p className="text-amber-300 text-sm">
               Please login to your account to proceed with checkout
            </p>
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Manual Plan */}
          <div 
            className={`bg-gray-900 p-8 rounded-xl border cursor-pointer transition-all duration-300 ${
              selectedPlan === 'manual' 
                ? 'border-lime-400 shadow-lg shadow-lime-400/20' 
                : 'border-gray-800 hover:border-gray-700'
            }`}
            onClick={() => handlePlanSelect('manual')}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="text-center flex-1">
                <h3 className="text-white text-xl font-medium mb-2">1. {PLANS.manual.name}</h3>
                <div className="text-lime-400 text-3xl font-bold">{PLANS.manual.price}</div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === 'manual' 
                  ? 'border-lime-400 bg-lime-400' 
                  : 'border-gray-600'
              }`}>
                {selectedPlan === 'manual' && (
                  <div className="w-3 h-3 bg-black rounded-full"></div>
                )}
              </div>
            </div>
            
            <ul className="space-y-4 mb-8">
              {PLANS.manual.features.map((feature, idx) => (
                <li key={idx} className="text-gray-300 flex items-start">
                  <CheckCircle className="w-5 h-5 text-lime-400 mr-3 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handlePlanSelect('manual');
              }}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                selectedPlan === 'manual'
                  ? 'bg-lime-400 text-black hover:bg-lime-300'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {selectedPlan === 'manual' ? 'Selected Plan' : 'Select Plan'}
            </button>
          </div>

          {/* Auto Plan */}
          <div 
            className={`bg-gray-900 p-8 rounded-xl border cursor-pointer transition-all duration-300 relative ${
              selectedPlan === 'auto' 
                ? 'border-lime-400 shadow-lg shadow-lime-400/20' 
                : 'border-lime-400 hover:border-lime-300'
            }`}
            onClick={() => handlePlanSelect('auto')}
          >
            {PLANS.auto.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-lime-400 text-black px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div className="text-center flex-1">
                <h3 className="text-white text-xl font-medium mb-2">2. {PLANS.auto.name}</h3>
                <div className="text-lime-400 text-3xl font-bold">{PLANS.auto.price}</div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === 'auto' 
                  ? 'border-lime-400 bg-lime-400' 
                  : 'border-gray-600'
              }`}>
                {selectedPlan === 'auto' && (
                  <div className="w-3 h-3 bg-black rounded-full"></div>
                )}
              </div>
            </div>
            
            <ul className="space-y-4 mb-8">
              {PLANS.auto.features.map((feature, idx) => (
                <li key={idx} className="text-gray-300 flex items-start">
                  <CheckCircle className="w-5 h-5 text-lime-400 mr-3 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handlePlanSelect('auto');
              }}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                selectedPlan === 'auto'
                  ? 'bg-lime-400 text-black hover:bg-lime-300'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {selectedPlan === 'auto' ? 'Selected Plan' : 'Select Plan'}
            </button>
          </div>
        </div>

        {/* Selected Plan Summary & Checkout */}
        {selectedPlan && (
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-gray-900 p-6 rounded-xl border border-lime-400 mb-6">
              <h3 className="text-white text-lg font-medium mb-4">Selected Plan Summary</h3>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-300">
                  {selectedPlan === 'manual' ? PLANS.manual.name : PLANS.auto.name}
                </span>
                <span className="text-lime-400 font-bold">
                  {selectedPlan === 'manual' ? PLANS.manual.price : PLANS.auto.price}
                </span>
              </div>
              
              <div className="bg-gray-800 p-3 rounded text-gray-400 text-sm">
                {selectedPlan === 'manual' ? (
                  <p> Recurring monthly charge</p>
                ) : (
                  <p> Pay per response - Buy credits as needed</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleCheckout}
                disabled={loading || !userInfo.userId}
                className="w-full bg-lime-400 text-black py-4 rounded-lg font-bold text-lg hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Proceed to Checkout'
                )}
              </button>

              <button
                onClick={handleManageSubscription}
                disabled={loading || !userInfo.userId}
                className="w-full bg-gray-700 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Manage Subscription
              </button>
            </div>
            
            <p className="text-gray-400 text-sm text-center mt-4">
               Secure payment powered by Stripe
            </p>
          </div>
        )}

      </div>
    </section>
  );
};

export default PricingSection;