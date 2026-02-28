import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader2, AlertCircle, Tag } from 'lucide-react';
import { paymentAPI } from '../../utils/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const PricingSection = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [frequency, setFrequency] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userInfo, setUserInfo] = useState({ userId: null, email: null });
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await fetch(`${API_BASE_URL}/products`);
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          setProducts(result.data);
          // Auto-select the popular plan, or the first one
          const popular = result.data.find((p) => p.isPopular);
          setSelectedPlan(popular ? popular.key : result.data[0].key);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load pricing plans');
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Build PLANS object from products for backward compatibility
  const PLANS = {};
  products.forEach((p) => {
    const displayPrice = frequency === 'annually'
      ? `$${(p.annualPrice / 100).toFixed(2)}/year`
      : `$${(p.monthlyPrice / 100).toFixed(2)}/month`;
    const monthlyEquiv = frequency === 'annually'
      ? `$${(p.annualPrice / 100 / 12).toFixed(2)}/mo`
      : null;
    PLANS[p.key] = {
      name: p.name,
      price: displayPrice,
      monthlyEquiv,
      features: p.features,
      isPopular: p.isPopular,
      tag: p.tag,
    };
  });

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

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await paymentAPI.createCheckoutSession(selectedPlan, frequency);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create checkout session');
      }

      setSuccess('Redirecting to checkout...');

      // Redirect to Stripe Checkout
      if (result.data?.url) {
        setTimeout(() => {
          window.location.href = result.data.url;
        }, 500);
      } else {
        throw new Error('No checkout URL provided');
      }

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!userInfo.userId) {
      setError('Please login first');
      return;
    }
    // Navigate to user dashboard settings
    window.location.href = '/user/dashboard';
  };

  return (
    <section id="pricing" className="bg-black py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-6">
          We have <span className="text-lime-400">{products.length} product{products.length !== 1 ? 's' : ''}</span>
        </h2>

        {/* Frequency Toggle */}
        {!productsLoading && products.length > 0 && (
          <div className="flex justify-center mb-12">
            <div className="bg-gray-900 border border-gray-800 rounded-full p-1 flex items-center gap-1">
              <button
                onClick={() => setFrequency('monthly')}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  frequency === 'monthly'
                    ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setFrequency('annually')}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 relative ${
                  frequency === 'annually'
                    ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Annually
                <span className="absolute -top-2.5 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                  -20%
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Products Loading */}
        {productsLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
            <span className="text-gray-300 ml-3">Loading plans...</span>
          </div>
        )}

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
        
        <div className={`grid gap-8 max-w-4xl mx-auto ${products.length === 1 ? 'md:grid-cols-1 max-w-md' : products.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {products.map((product, index) => (
            <div
              key={product._id || product.key}
              className={`bg-gray-900 p-8 rounded-xl border cursor-pointer transition-all duration-300 relative ${
                selectedPlan === product.key
                  ? 'border-lime-400 shadow-lg shadow-lime-400/20'
                  : product.isPopular
                  ? 'border-lime-400 hover:border-lime-300'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
              onClick={() => handlePlanSelect(product.key)}
            >
              {product.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-lime-400 text-black px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Tag Badge */}
              {product.tag && (
                <div className="absolute top-3 right-3">
                  <span className="flex items-center gap-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    <Tag className="w-3 h-3" />
                    {product.tag}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="text-center flex-1">
                  <h3 className="text-white text-xl font-medium mb-2">
                    {index + 1}. {product.name}
                  </h3>
                  <div className="text-lime-400 text-3xl font-bold">
                    {frequency === 'annually'
                      ? `$${(product.annualPrice / 100).toFixed(2)}`
                      : `$${(product.monthlyPrice / 100).toFixed(2)}`}
                    <span className="text-base font-normal text-gray-400">
                      {frequency === 'annually' ? '/year' : '/month'}
                    </span>
                  </div>
                  {frequency === 'annually' && (
                    <p className="text-gray-500 text-sm mt-1 line-through">
                      ${((product.monthlyPrice / 100) * 12).toFixed(2)}/year
                    </p>
                  )}
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === product.key
                      ? 'border-lime-400 bg-lime-400'
                      : 'border-gray-600'
                  }`}
                >
                  {selectedPlan === product.key && (
                    <div className="w-3 h-3 bg-black rounded-full"></div>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="text-gray-300 flex items-start">
                    <CheckCircle className="w-5 h-5 text-lime-400 mr-3 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanSelect(product.key);
                }}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  selectedPlan === product.key
                    ? 'bg-lime-400 text-black hover:bg-lime-300'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {selectedPlan === product.key ? 'Selected Plan' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>

        {/* Selected Plan Summary & Checkout */}
        {selectedPlan && PLANS[selectedPlan] && (
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-gray-900 p-6 rounded-xl border border-lime-400 mb-6">
              <h3 className="text-white text-lg font-medium mb-4">Selected Plan Summary</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">
                  {PLANS[selectedPlan].name}
                </span>
                <span className="text-lime-400 font-bold">
                  {PLANS[selectedPlan].price}
                </span>
              </div>
              {frequency === 'annually' && PLANS[selectedPlan].monthlyEquiv && (
                <p className="text-gray-500 text-sm mb-2">
                  ≈ {PLANS[selectedPlan].monthlyEquiv} billed annually — <span className="text-lime-400 font-medium">Save 20%</span>
                </p>
              )}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded capitalize">{frequency}</span>
                {PLANS[selectedPlan].tag && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded">{PLANS[selectedPlan].tag}</span>
                )}
              </div>
              
              <div className="bg-gray-800 p-3 rounded text-gray-400 text-sm">
                <p>{frequency === 'annually' ? 'Annual' : 'Monthly'} subscription • Full access for the billing period</p>
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