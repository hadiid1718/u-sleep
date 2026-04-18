import React, { useEffect, useState } from 'react';
import { comparisonAPI } from '../../services/comparisonService';

const ComparisonTable = () => {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparisons = async () => {
      const res = await comparisonAPI.getComparisons();
      if (res.success && res.data?.data) {
        setComparisons(res.data.data);
      } else {
        // Fallback to hardcoded defaults if API fails
        setComparisons([
          { feature: 'Average revenue saved', uSleep: '45%', human: '0%' },
          { feature: 'Learning', uSleep: '$0', human: '$0+ per freelance call' },
          { feature: 'Proposal writing', uSleep: '$0', human: '$0+ per opportunity' },
          { feature: 'Client outreach', uSleep: '$0+ per opportunity', human: '$0' },
          { feature: 'Overall work', uSleep: '$0+ per freelance work', human: '$45+ per hour' },
          { feature: 'Work anxiety', uSleep: '$0 resolved', human: 'Panic attacks' },
          { feature: 'Upwork commission', uSleep: '$450 Dollars', human: '$450+ Dollars' },
          { feature: 'Cost per sale', uSleep: '$12.50', human: '$65.97' },
          { feature: 'Pipeline', uSleep: '$12.50', human: '$45.97' },
        ]);
      }
      setLoading(false);
    };
    fetchComparisons();
  }, []);

  return (
    <section className="bg-black py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          Let's count: U  Sleep vs Human
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 rounded-full border-4 border-gray-700 border-t-lime-400 animate-spin"></div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
            <div className="grid grid-cols-3 bg-gray-800 p-4">
              <div className="text-white font-medium">Metric</div>
              <div className="text-lime-400 font-medium text-center">U  Sleep</div>
              <div className="text-white font-medium text-center">Human</div>
            </div>
            
            {comparisons.map((row, index) => (
              <div key={row._id || index} className="grid grid-cols-3 p-4 border-b border-gray-800 last:border-b-0">
                <div className="text-gray-300 text-sm">{row.feature}</div>
                <div className="text-lime-400 text-center font-medium text-sm">{row.uSleep}</div>
                <div className="text-white text-center text-sm">{row.human}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
export default ComparisonTable;