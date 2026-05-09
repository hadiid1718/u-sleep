import React from 'react';
import { Search, Target, Zap, Bell, Layers } from 'lucide-react';
const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      icon: <Layers className='text-gray-100' />,
      title: 'Choose your platform',
      description: 'Start by selecting Upwork or Freelancer.com. The rest of the workflow adapts to your selected marketplace.'
    },
    {
      number: '02',
      icon: <Search  className='text-gray-100'/>,
      title: 'AI scans project feed',
      description: 'The engine searches marketplace projects using your keywords, rates, and role settings.'
    },
    {
      number: '03',
      icon: <Zap className='text-gray-100'/>,
      title: 'Relevant jobs filtering',
      description: 'Smart filtering removes irrelevant opportunities and focuses only on high-quality jobs that match your criteria perfectly.'
    },
    {
      number: '04',
       icon: <Target className='text-gray-100'/>,
      title: 'Bid-ready proposal drafts',
      description: 'AI drafts personalized cover letters and bid-ready text so you can submit quickly with confidence.'
    },
    {
      number: '05',
      icon: <Bell className='text-gray-100'/>,
      title: 'Real-time notifications',
      description: 'Get instant alerts about new opportunities, proposal statuses, and client responses directly to your preferred channels.'
    }
  ];

  return (
    <section className="bg-black py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          How U sleep works
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <div className="text-lime-400 text-xl font-bold mb-3">{step.number}</div>
              <div className="text-2xl mb-3">{step.icon}</div>
              <h3 className="text-white text-lg font-medium mb-3">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default HowItWorks;