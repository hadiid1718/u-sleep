import React from 'react';
const ComparisonTable = () => {
  const comparisons = [
    { feature: 'Average revenue saved', uneverSleep: '45%', human: '0%' },
    { feature: 'Learning', uneverSleep: '$0', human: '$0+ per freelance call' },
    { feature: 'Proposal writing', uneverSleep: '$0', human: '$0+ per opportunity' },
    { feature: 'Client outreach', uneverSleep: '$0+ per opportunity', human: '$0' },
    { feature: 'Overall work', uneverSleep: '$0+ per freelance work', human: '$45+ per hour' },
    { feature: 'Work anxiety', uneverSleep: '$0 resolved', human: 'Panic attacks' },
    { feature: 'Upwork commission', uneverSleep: '$450 Dollars', human: '$450+ Dollars' },
    { feature: 'Cost per sale', uneverSleep: '$12.50', human: '$65.97' },
    { feature: 'Pipeline', uneverSleep: '$12.50', human: '$45.97' }
  ];

  return (
    <section className="bg-black py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          Let's count: U Never Sleep vs Human
        </h2>
        
        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
          <div className="grid grid-cols-3 bg-gray-800 p-4">
            <div className="text-white font-medium">Metric</div>
            <div className="text-lime-400 font-medium text-center">U Never Sleep</div>
            <div className="text-white font-medium text-center">Human</div>
          </div>
          
          {comparisons.map((row, index) => (
            <div key={index} className="grid grid-cols-3 p-4 border-b border-gray-800 last:border-b-0">
              <div className="text-gray-300 text-sm">{row.feature}</div>
              <div className="text-lime-400 text-center font-medium text-sm">{row.uneverSleep}</div>
              <div className="text-white text-center text-sm">{row.human}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default ComparisonTable;