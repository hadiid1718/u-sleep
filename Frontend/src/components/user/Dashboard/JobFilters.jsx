import React from 'react';
import { Search } from 'lucide-react';

export const JobFilters = ({ 
  searchTerm, 
  onSearchChange, 
  jobFilter, 
  onFilterChange,
  dashboardJobs 
}) => {
  const getCount = (filter) => {
    if (!dashboardJobs) return 0;
    if (filter === 'all') return dashboardJobs.length;
    return dashboardJobs.filter(job => {
      const status = job.matchStatus || job.status || '';
      return status === filter;
    }).length;
  };

  const filterOptions = [
    { id: 'all', label: 'All', color: 'from-gray-500 to-gray-600' },
    { id: 'matched', label: 'Matched', color: 'from-green-500 to-emerald-600' },
    { id: 'applied', label: 'Applied', color: 'from-blue-500 to-blue-600' },
    { id: 'accepted', label: 'Accepted', color: 'from-emerald-500 to-teal-600' },
    { id: 'rejected', label: 'Rejected', color: 'from-red-500 to-rose-600' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Top row: Title + Search */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-white text-lg md:text-xl font-semibold">Recent Jobs</h3>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by title, description, skills..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-gray-800/80 text-white pl-10 pr-4 py-2.5 rounded-xl border border-gray-600/50 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 text-sm placeholder-gray-500 transition-all duration-300 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map(option => {
          const count = getCount(option.id);
          const isActive = jobFilter === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onFilterChange(option.id)}
              className={`group relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-r ${option.color} text-white shadow-lg shadow-${option.color.split('-')[1]}-500/20 scale-105`
                  : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700/80 border border-gray-700/50 hover:border-gray-500'
              }`}
            >
              <span className="flex items-center gap-2">
                {option.label}
                <span className={`inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-xs font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600 group-hover:text-gray-300'
                }`}>
                  {count}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};