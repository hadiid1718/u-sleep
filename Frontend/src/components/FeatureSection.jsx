import React from 'react';
import {  Users, Shield, TrendingUp, Calendar, Star, CheckCircle } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: <Shield className='text-gray-100'/>,
      title: 'Free time collections and analysis',
      description: 'Automatically tracks and analyzes your available working hours to optimize job applications timing.'
    },
    {
      icon: <Users className='text-gray-100'/>,
      title: 'Background',
      description: 'Runs seamlessly in the background, continuously monitoring for new opportunities without interruption.'
    },
    {
      icon: <Calendar className='text-gray-100'/>,
      title: 'Auto scheduler',
      description: 'Automatically schedules interviews and client calls based on your availability and preferences.'
    },
    {
      icon:  <CheckCircle className='text-gray-100'/>,
      title: 'Quality control',
      description: 'Ensures all proposals meet high-quality standards and client requirements before submission.'
    },
    {
      icon: <Star className='text-gray-100'/>,
      title: 'Winner quotes',
      description: 'Uses AI to generate competitive quotes and pricing strategies that win more projects consistently.'
    },
    {
      icon: <TrendingUp className='text-gray-100'/>,
      title: 'Revenue tracking',
      description: 'Tracks your earnings and provides detailed insights to maximize revenue potential and growth.'
    }
  ];

  return (
    <section className="bg-black py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          How it works under the hood
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <div className="text-2xl mb-4">{feature.icon}</div>
              <h3 className="text-white text-lg font-medium mb-3">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default FeaturesSection;
