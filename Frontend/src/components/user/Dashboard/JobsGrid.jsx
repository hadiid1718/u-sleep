import React, { useState } from 'react';
import { InteractiveCard } from '../ui/InteractiveCard';
import { JobFilters } from './JobFilters';
import { JobCard } from './JobCard';

export const JobsGrid = ({ 
  dashboardJobs, 
  dashboardLoading, 
  formData, 
  handleJobAction 
}) => {
  const [jobFilter, setJobFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getFilteredJobs = () => {
    if (!dashboardJobs) return [];
    let filtered = [...dashboardJobs];

    if (jobFilter === 'matched') {
      filtered = filtered.filter(job => job.status === 'matched');
    } else if (jobFilter === 'applied') {
      filtered = filtered.filter(job => job.status === 'applied');
    }

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    return filtered;
  };

  return (
    <InteractiveCard className="p-4 md:p-6">
      {dashboardLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading jobs...</p>
        </div>
      ) : (
        <>
          <JobFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            jobFilter={jobFilter}
            onFilterChange={setJobFilter}
            dashboardJobs={dashboardJobs}
          />

          {getFilteredJobs().length > 0 ? (
            <div className="space-y-3">
              {getFilteredJobs().map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  formData={formData}
                  onAction={handleJobAction}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No jobs found matching your criteria</p>
            </div>
          )}
        </>
      )}
    </InteractiveCard>
  );
};