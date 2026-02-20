import React from 'react';
import { Search, Filter } from 'lucide-react';

export const JobFilters = ({ 
  searchTerm, 
  onSearchChange, 
  jobFilter, 
  onFilterChange,
  dashboardJobs 
}) => {
  const filterOptions = [
    { id: 'all', label: 'All', count: dashboardJobs?.length || 0 },
    { id: 'matched', label: 'Matched', count: dashboardJobs?.filter(job => job.status === 'matched')?.length || 0 },
    { id: 'applied', label: 'Applied', count: dashboardJobs?.filter(job => job.status === 'applied')?.length || 0 }
  ];

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-6">
      <h3 className="text-white text-lg md:text-xl font-semibold">Recent Jobs</h3>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-gradient-to-r from-gray-700 to-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-sm w-full sm:w-auto transition-all duration-200"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {filterOptions.map(option => (
            <button
              key={option.id}
              onClick={() => onFilterChange(option.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                jobFilter === option.id
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};