import React from 'react';
import { StatusButton } from '../ui/StatusButton';

export const JobCard = ({ job, formData, onAction }) => {
  return (
    <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 rounded-xl border border-gray-600 hover:border-gray-500 hover:shadow-lg transition-all duration-200 group">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div className="flex-1 lg:pr-4">
          <h4 className="text-white font-medium text-base mb-1 group-hover:text-yellow-400 transition-colors cursor-pointer">
            {job.title}
          </h4>
          <p className="text-gray-400 text-sm">{formData.feedName}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center lg:space-x-6 space-y-2 sm:space-y-0">
          <div className="text-yellow-400 font-semibold text-center lg:min-w-[120px]">
            {job.budget}
          </div>
          <div className="text-gray-400 text-sm text-center lg:min-w-[140px]">
            {job.time}
          </div>
          <div className="flex items-center justify-center lg:min-w-[100px]">
            <StatusButton
              isComplete={job.status === 'applied'}
              label={job.status === 'applied' ? "Applied" : "Apply"}
              onClick={() => onAction(job.id)}
            />
          </div>
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-sm shadow-lg">
              {job.score}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};