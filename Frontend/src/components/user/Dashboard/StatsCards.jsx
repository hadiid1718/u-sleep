import React from 'react';
import { InteractiveCard } from '../ui/InteractiveCard';

export const StatsCards = ({ dashboardJobs, user }) => {
  const stats = [
    {
      value: dashboardJobs?.length || 0,
      label: 'All Jobs',
      gradient: 'from-yellow-500/10 to-yellow-600/5',
      border: 'border-yellow-500/20',
      textColor: 'text-yellow-400'
    },
    {
      value: dashboardJobs?.filter(job => job.status === 'matched')?.length || 0,
      label: 'Matched Jobs',
      gradient: 'from-green-500/10 to-green-600/5',
      border: 'border-green-500/20',
      textColor: 'text-green-400'
    },
    {
      value: dashboardJobs?.filter(job => job.status === 'applied')?.length || 0,
      label: 'Responses Sent',
      gradient: 'from-red-500/10 to-red-600/5',
      border: 'border-red-500/20',
      textColor: 'text-red-400'
    },
    {
      value: user?.coins || 0,
      label: 'U-coins Left',
      gradient: 'from-orange-500/10 to-orange-600/5',
      border: 'border-orange-500/20',
      textColor: 'text-orange-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {stats.map((stat, index) => (
        <InteractiveCard 
          key={index}
          className={`p-4 md:p-6 bg-gradient-to-br ${stat.gradient} ${stat.border}`}
        >
          <h3 className={`${stat.textColor} text-2xl md:text-3xl font-bold mb-1`}>
            {stat.value}
          </h3>
          <p className="text-gray-300 text-sm md:text-base">{stat.label}</p>
        </InteractiveCard>
      ))}
    </div>
  );
};