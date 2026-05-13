import React, { useState, useMemo } from 'react';
import { InteractiveCard } from '../ui/InteractiveCard';
import { JobFilters } from './JobFilters';
import { JobCard } from './JobCard';
import { ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';

const JOBS_PER_PAGE = 10;

export const JobsGrid = ({ 
  dashboardJobs, 
  dashboardLoading, 
  formData, 
  handleJobAction 
}) => {
  const [jobFilter, setJobFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filter or search changes
  const handleFilterChange = (f) => { setJobFilter(f); setCurrentPage(1); };
  const handleSearchChange = (s) => { setSearchTerm(s); setCurrentPage(1); };

  const filteredJobs = useMemo(() => {
    if (!dashboardJobs) return [];
    let filtered = [...dashboardJobs];

    if (jobFilter !== 'all') {
      filtered = filtered.filter(job => {
        const status = job.matchStatus || job.status || '';
        return status === jobFilter;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        (job.title || '').toLowerCase().includes(term) ||
        (job.description || '').toLowerCase().includes(term) ||
        (job.shortDescription || '').toLowerCase().includes(term) ||
        (job.skills || []).some(s => s.toLowerCase().includes(term)) ||
        (job.category || '').toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => new Date(b.postedDate || b.createdAt || 0) - new Date(a.postedDate || a.createdAt || 0));
    return filtered;
  }, [dashboardJobs, jobFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE);

  // Generate page numbers to show (max 5 around current)
  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <InteractiveCard className="p-4 md:p-6" hover={false}>
      {dashboardLoading ? (
        <div className="text-center py-16">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-lime-400 animate-spin"></div>
          </div>
          <p className="text-gray-400 text-sm">Loading your jobs...</p>
        </div>
      ) : (
        <>
          <JobFilters
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            jobFilter={jobFilter}
            onFilterChange={handleFilterChange}
            dashboardJobs={dashboardJobs}
          />

          {/* Results summary */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm">
              Showing <span className="text-gray-300 font-medium">{paginatedJobs.length}</span> of{' '}
              <span className="text-gray-300 font-medium">{filteredJobs.length}</span> jobs
            </p>
            {totalPages > 1 && (
              <p className="text-gray-500 text-sm">
                Page <span className="text-gray-300 font-medium">{currentPage}</span> of{' '}
                <span className="text-gray-300 font-medium">{totalPages}</span>
              </p>
            )}
          </div>

          {paginatedJobs.length > 0 ? (
            <div className="space-y-3">
              {paginatedJobs.map((job, index) => (
                <JobCard
                  key={job._id || job.id || job.upworkJobId || job.freelancerJobId || job.sourceJobId || `job-${index}`}
                  job={job}
                  formData={formData}
                  onAction={handleJobAction}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 text-lg font-medium mb-1">No jobs found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters or search terms</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6 pt-4 border-t border-gray-700/50">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700/50"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              {getPageNumbers()[0] > 1 && (
                <>
                  <button onClick={() => setCurrentPage(1)} className="w-9 h-9 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700/50 transition-all">1</button>
                  {getPageNumbers()[0] > 2 && <span className="text-gray-600 px-1">...</span>}
                </>
              )}

              {getPageNumbers().map(num => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === num
                      ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-gray-900 shadow-lg shadow-lime-400/20'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700/50'
                  }`}
                >
                  {num}
                </button>
              ))}

              {getPageNumbers().at(-1) < totalPages && (
                <>
                  {getPageNumbers().at(-1) < totalPages - 1 && <span className="text-gray-600 px-1">...</span>}
                  <button onClick={() => setCurrentPage(totalPages)} className="w-9 h-9 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700/50 transition-all">{totalPages}</button>
                </>
              )}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700/50"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </InteractiveCard>
  );
};