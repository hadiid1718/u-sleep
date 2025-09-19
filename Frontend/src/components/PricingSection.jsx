import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
const PricingSection = () => {
  const [selectedPlan, setSelectedPlan] = useState('auto'); // default to auto plan

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  return (
    <section className="bg-black py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          We have <span className="text-lime-400">2 products</span>
        </h2>
        
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
                <h3 className="text-white text-xl font-medium mb-2">1. Manual job responding</h3>
                <div className="text-lime-400 text-3xl font-bold">$50/month</div>
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
              <li className="text-gray-300 flex items-start">
                <CheckCircle className="w-5 h-5 text-lime-400 mr-3 mt-0.5 flex-shrink-0" />
                Job hunting and job filtering
              </li>
              <li className="text-gray-300 flex items-start">
                <CheckCircle className="w-5 h-5 text-lime-400 mr-3 mt-0.5 flex-shrink-0" />
                AI responds for all prospects
              </li>
              <li className="text-gray-300 flex items-start">
                <CheckCircle className="w-5 h-5 text-lime-400 mr-3 mt-0.5 flex-shrink-0" />
                Connect with prospects
              </li>
            </ul>
            
            <button 
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                selectedPlan === 'manual'
                  ? 'bg-lime-400 text-black hover:bg-lime-300'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {selectedPlan === 'manual' ? 'Selected Plan' : 'Start trial'}
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
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-lime-400 text-black px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="text-center flex-1">
                <h3 className="text-white text-xl font-medium mb-2">2. Auto responder</h3>
                <div className="text-lime-400 text-3xl font-bold">Fix $0.5/response</div>
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
              <li className="text-gray-300 flex items-start">
                <CheckCircle className="w-5 h-5 text-lime-400 mr-3 mt-0.5 flex-shrink-0" />
                Everything from manual
              </li>
              <li className="text-gray-300 flex items-start">
                <CheckCircle className="w-5 h-5 text-lime-400 mr-3 mt-0.5 flex-shrink-0" />
                Auto upload to Upwork daily
              </li>
              <li className="text-gray-300 flex items-start">
                <CheckCircle className="w-5 h-5 text-lime-400 mr-3 mt-0.5 flex-shrink-0" />
                Advanced filtering options
              </li>
            </ul>
            
            <button 
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                selectedPlan === 'auto'
                  ? 'bg-lime-400 text-black hover:bg-lime-300'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {selectedPlan === 'auto' ? 'Selected Plan' : 'Start trial'}
            </button>
          </div>
        </div>

        {/* Selected Plan Summary */}
        {selectedPlan && (
          <div className="mt-12 max-w-2xl mx-auto bg-gray-900 p-6 rounded-xl border border-lime-400">
            <h3 className="text-white text-lg font-medium mb-2">Selected Plan Summary</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">
                {selectedPlan === 'manual' ? 'Manual job responding' : 'Auto responder'}
              </span>
              <span className="text-lime-400 font-bold">
                {selectedPlan === 'manual' ? '$50/month' : 'Fix $0.5/response'}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
export default PricingSection;