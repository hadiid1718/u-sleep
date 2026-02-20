import React from 'react';
import { InteractiveCard } from '../ui/InteractiveCard';
import { StatusButton } from '../ui/StatusButton';
import { StatsCards } from './StatsCards';
import { JobsGrid } from './JobsGrid';

export const DashboardView = ({ 
  dashboardJobs, 
  dashboardLoading, 
  formStates, 
  user,
  onMenuClick,
  handleJobAction,
  formData
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Jobs Dashboard
        </h2>
        <div className="flex flex-wrap gap-2">
          <StatusButton
            isComplete={formStates.feedSaved}
            label="Feed Status"
            onClick={() => onMenuClick('prompts')}
            size="lg"
          />
          <StatusButton
            isComplete={formStates.proposalsSaved}
            label="Proposals"
            onClick={() => onMenuClick('prompts')}
            size="lg"
          />
        </div>
      </div>

      <StatsCards dashboardJobs={dashboardJobs} user={user} />
      
      <JobsGrid 
        dashboardJobs={dashboardJobs}
        dashboardLoading={dashboardLoading}
        formData={formData}
        handleJobAction={handleJobAction}
      />
    </div>
  );
};