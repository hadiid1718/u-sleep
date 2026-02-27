import React, { useState, useEffect } from 'react';
import { Briefcase, Search, CheckCircle, XCircle, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { jobAPI } from '../../../utils/api';

const JobManagementSection = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchKeywords, setSearchKeywords] = useState('');
  const [searching, setSearching] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const result = await jobAPI.getFilteredJobs({ page, limit: 10, status: statusFilter });
      if (result.success) {
        setJobs(result.data?.data?.jobs || []);
        setPagination(result.data?.data?.pagination || { total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter]);

  const handleSearch = async () => {
    if (!searchKeywords.trim()) return;
    setSearching(true);
    try {
      const keywords = searchKeywords.split(',').map(k => k.trim()).filter(Boolean);
      const result = await jobAPI.searchJobsWithAI(keywords);
      if (result.success) {
        setJobs(result.data?.data?.jobs || []);
        setPagination({ total: result.data?.data?.totalFound || 0, pages: 1 });
      }
    } catch (err) {
      console.error('Error searching jobs:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleMatch = async (jobId) => {
    const result = await jobAPI.markJobAsMatched(jobId);
    if (result.success) {
      fetchJobs();
    }
  };

  const handleReject = async (jobId) => {
    const result = await jobAPI.markJobAsRejected(jobId, 'Rejected from admin dashboard');
    if (result.success) {
      fetchJobs();
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-600 text-yellow-100',
      matched: 'bg-green-600 text-green-100',
      rejected: 'bg-red-600 text-red-100',
    };
    return colors[status] || 'bg-gray-600 text-gray-200';
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-white text-xl lg:text-2xl font-bold">Job Management</h2>
        <button
          onClick={fetchJobs}
          className="flex items-center gap-2 bg-lime-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-lime-500 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchKeywords}
              onChange={(e) => setSearchKeywords(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search jobs by keywords (comma separated)..."
              className="w-full bg-gray-900 text-white pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 focus:border-lime-400 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="bg-lime-400 text-gray-900 px-6 py-2.5 rounded-lg font-semibold hover:bg-lime-500 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Search size={16} />
            {searching ? 'Searching...' : 'Search with AI'}
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {['pending', 'matched', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === s
                ? 'bg-lime-400 text-gray-900'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-lime-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <Briefcase size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No jobs found</p>
          <p className="text-gray-500 text-sm mt-2">Try searching for jobs using keywords above</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const score = job.aiAnalysis?.matchScore || 0;
            const recommendation = job.aiAnalysis?.recommendation || '';
            const greenFlags = job.aiAnalysis?.greenFlags || [];
            const redFlags = job.aiAnalysis?.redFlags || [];

            return (
              <div key={job._id || job.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  {/* Job Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <h3 className="text-white font-semibold text-lg">{job.title || 'Untitled Job'}</h3>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.matchStatus || 'pending')}`}>
                        {job.matchStatus || 'pending'}
                      </span>
                    </div>

                    <p className="text-gray-400 text-sm line-clamp-2">
                      {job.shortDescription || job.description?.substring(0, 150) || 'No description'}
                    </p>

                    {/* Budget */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="text-lime-400 font-medium">
                        {job.budgetType === 'fixed'
                          ? `$${job.budget?.amount || 0} Fixed`
                          : job.hourlyRate
                            ? `$${job.hourlyRate.min}-$${job.hourlyRate.max}/hr`
                            : 'Budget N/A'}
                      </span>
                      {job.proposalsCount !== undefined && (
                        <span className="text-gray-500">
                          {job.proposalsCount} proposals
                        </span>
                      )}
                      {job.clientInfo?.country && (
                        <span className="text-gray-500">{job.clientInfo.country}</span>
                      )}
                      {job.clientInfo?.paymentVerified && (
                        <span className="text-green-400 text-xs">✓ Verified</span>
                      )}
                    </div>

                    {/* AI Score & Flags */}
                    {score > 0 && (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                          Score: {score}/100
                        </span>
                        {recommendation && (
                          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                            {recommendation}
                          </span>
                        )}
                        {greenFlags.slice(0, 3).map((flag, i) => (
                          <span key={i} className="text-xs bg-green-900/30 text-green-300 px-2 py-0.5 rounded-full">
                            {flag}
                          </span>
                        ))}
                        {redFlags.slice(0, 2).map((flag, i) => (
                          <span key={i} className="text-xs bg-red-900/30 text-red-300 px-2 py-0.5 rounded-full">
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 flex-shrink-0">
                    {job.upworkUrl && (
                      <a
                        href={job.upworkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-600 transition"
                      >
                        <ExternalLink size={14} /> View
                      </a>
                    )}
                    {job.matchStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleMatch(job._id || job.id)}
                          className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-500 transition"
                        >
                          <CheckCircle size={14} /> Match
                        </button>
                        <button
                          onClick={() => handleReject(job._id || job.id)}
                          className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-500 transition"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-400">
            Page {page} of {pagination.pages} ({pagination.total} total)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default JobManagementSection;
