import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { LoadingState } from '../utils/LoadingState';
import { EmptyState } from '../utils/EmptyState';
import DemoFilters from '../utils/DemoFilter';
import DemoCard from '../utils/DemoCard';
import { Modal } from '../utils/Model';
import DemoStatusForm from '../utils/DemoStatusform';
import MetricCard from '../utils/MatricCard';
import { demoAPI } from '../../../utils/api';

const ITEMS_PER_PAGE = 9;

const DemoManagementSection = () => {
  const [demos, setDemos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    email: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    limit: ITEMS_PER_PAGE,
  });

  const fetchDemos = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await demoAPI.getAllDemos({
        page,
        limit: ITEMS_PER_PAGE,
        status: filters.status,
        date: filters.date,
        email: filters.email,
      });

      if (result.success) {
        const { data, page: currentPage, totalPages, totalCount, limit } = result.data;
        setDemos(data);
        setPagination({ page: currentPage, totalPages, totalCount, limit });
      } else {
        console.error('Error fetching demos:', result.error?.message);
      }
    } catch (error) {
      console.error('Error fetching demos:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDemos(1);
  }, [fetchDemos]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchDemos(newPage);
  };

  const updateDemoStatus = async (id, status, notes = '') => {
    try {
      const result = await demoAPI.updateDemoStatus(id, status, notes);

      if (result.success) {
        fetchDemos();
        setIsStatusModalOpen(false);
        setSelectedDemo(null);
        alert('Demo updated successfully!');
      } else {
        alert(result.error?.message || 'Error updating demo');
      }
    } catch (error) {
      console.error('Error updating demo:', error);
      alert('Error updating demo');
    }
  };

  const cancelDemo = async (id) => {
    if (!confirm('Are you sure you want to cancel this demo?')) return;

    try {
      const result = await demoAPI.cancelDemo(id);

      if (result.success) {
        fetchDemos();
        alert('Demo cancelled successfully!');
      } else {
        alert(result.error?.message || 'Error cancelling demo');
      }
    } catch (error) {
      console.error('Error cancelling demo:', error);
      alert('Error cancelling demo');
    }
  };

  const handleUpdateStatus = (demo) => {
    setSelectedDemo(demo);
    setIsStatusModalOpen(true);
  };

  const stats = {
    total: pagination.totalCount,
    scheduled: demos.filter(d => d.status === 'scheduled').length,
    completed: demos.filter(d => d.status === 'completed').length,
    cancelled: demos.filter(d => d.status === 'cancelled').length,
  };

  const demoMetrics = [
    { title: 'Total Demos', value: String(stats.total ?? 0), change: '+12', icon: Calendar },
    { title: 'Scheduled', value: String(stats.scheduled ?? 0), change: '+5', icon: Clock },
    { title: 'Completed', value: String(stats.completed ?? 0), change: '+8', icon: CheckCircle },
    { title: 'Cancelled', value: String(stats.cancelled ?? 0), change: '-2', icon: XCircle, trend: 'down' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">Demo Management</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {demoMetrics.map((metric, index) => (
          <MetricCard API_BASE_URL key={index} {...metric} />
        ))}
      </div>

      <DemoFilters filters={filters} setFilters={setFilters} />

      {loading ? (
        <LoadingState />
      ) : demos.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {demos.map(demo => (
              <DemoCard 
                key={demo._id} 
                demo={demo}
                onUpdateStatus={handleUpdateStatus}
                onCancel={cancelDemo}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} demos
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => {
                    // Show first, last, current, and neighbors
                    return p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1;
                  })
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      acc.push('ellipsis-' + p);
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p) => (
                    typeof p === 'string' ? (
                      <span key={p} className="px-2 text-gray-500">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          p === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  ))}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal 
        isOpen={isStatusModalOpen} 
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedDemo(null);
        }} 
        title="Update Demo Status"
      >
        {selectedDemo && (
          <DemoStatusForm 
            demo={selectedDemo}
            onClose={() => {
              setIsStatusModalOpen(false);
              setSelectedDemo(null);
            }} 
            onSubmit={updateDemoStatus}
          />
        )}
      </Modal>
    </div>
  );
};
export default DemoManagementSection