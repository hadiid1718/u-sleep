import { CheckCircle, Clock, TrendingUp, Users, ChevronLeft, ChevronRight, Search, X, Flag, ShieldAlert } from "lucide-react";
import MetricCard from "../utils/MatricCard";
import { useState, useEffect, useCallback } from "react";
import { Modal } from "../utils/Model";
import DataTable from "../utils/DataTable";
import UserForm from "../utils/UserForm";
import { userAPI } from "../../../utils/api";
import { LoadingState } from "../utils/LoadingState";
import { EmptyState } from "../utils/EmptyState";

const ITEMS_PER_PAGE = 10;

const UserManagementSection = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0, limit: ITEMS_PER_PAGE });
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flagTarget, setFlagTarget] = useState(null);
  const [flagReason, setFlagReason] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchEmail);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchEmail]);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await userAPI.getAllUsers({ page, limit: ITEMS_PER_PAGE, search: debouncedSearch });
      if (result.success) {
        const responseData = result.data;
        // Support both paginated and non-paginated backend responses
        const usersData = Array.isArray(responseData.data) ? responseData.data : [];
        const total = responseData.totalCount ?? usersData.length;
        const pages = responseData.totalPages ?? 1;
        const currentPg = responseData.page ?? page;
        const lim = responseData.limit ?? ITEMS_PER_PAGE;

        setUsers(usersData);
        setPagination({ page: currentPg, totalPages: pages, totalCount: total, limit: lim });
      } else {
        console.error('Error fetching users:', result.error?.message);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [fetchUsers, currentPage]);

  const totalPages = pagination.totalPages;

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to delete user "${user.name || user.email}"? This action cannot be undone.`)) return;
    try {
      const result = await userAPI.deleteUser(user._id);
      if (result.success) {
        fetchUsers(currentPage);
        alert('User deleted successfully!');
      } else {
        alert(result.error?.message || 'Error deleting user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const openFlagModal = (user) => {
    setFlagTarget(user);
    setFlagReason('');
    setIsFlagModalOpen(true);
  };

  const handleFlagUser = async () => {
    if (!flagTarget) return;
    try {
      const result = await userAPI.flagUser(flagTarget._id, flagReason || 'Terms & conditions violation');
      if (result.success) {
        fetchUsers(currentPage);
        setIsFlagModalOpen(false);
        setFlagTarget(null);
        setFlagReason('');
        alert('User account flagged successfully!');
      } else {
        alert(result.error?.message || 'Error flagging user');
      }
    } catch (error) {
      console.error('Error flagging user:', error);
      alert('Error flagging user');
    }
  };

  const handleUnflagUser = async (user) => {
    if (!confirm(`Remove flag from user "${user.name || user.email}"?`)) return;
    try {
      const result = await userAPI.unflagUser(user._id);
      if (result.success) {
        fetchUsers(currentPage);
        alert('User account unflagged successfully!');
      } else {
        alert(result.error?.message || 'Error unflagging user');
      }
    } catch (error) {
      console.error('Error unflagging user:', error);
      alert('Error unflagging user');
    }
  };

  // Format data for DataTable
  const tableData = users.map(user => ({
    name: user.name || '—',
    email: user.email,
    role: user.jobPreferences?.userRole || 'freelancer',
    status: user.isFlagged ? 'Flagged' : 'Active',
    proposals: String(user.stats?.proposalsSent ?? 0),
    joined: new Date(user.createdAt).toLocaleDateString(),
    _id: user._id,
    _isFlagged: user.isFlagged,
  }));

  const userActions = [
    {
      label: 'Flag',
      className: 'bg-amber-600 text-white hover:bg-amber-700',
      onClick: (row) => row._isFlagged ? handleUnflagUser(row) : openFlagModal(row),
      dynamicLabel: (row) => row._isFlagged ? 'Unflag' : 'Flag',
      dynamicClassName: (row) => row._isFlagged
        ? 'bg-green-600 text-white hover:bg-green-700'
        : 'bg-amber-600 text-white hover:bg-amber-700',
    },
    {
      label: 'Delete',
      className: 'bg-red-600 text-white hover:bg-red-700',
      onClick: (row) => handleDeleteUser(row),
    },
  ];

  // Metrics from real data
  const totalCount = pagination.totalCount ?? 0;
  const activeCount = users.filter(u => !u.isFlagged).length;
  const flaggedCount = users.filter(u => u.isFlagged).length;
  const activeProposals = users.reduce((sum, u) => sum + (u.stats?.proposalsSent || 0), 0);

  const userMetrics = [
    { title: 'Total Users', value: String(totalCount), change: '', icon: Users },
    { title: 'Active', value: String(activeCount), change: '', icon: CheckCircle },
    { title: 'Flagged', value: String(flaggedCount), change: '', icon: ShieldAlert },
    { title: 'Proposals Sent', value: String(activeProposals), change: '', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">User Management</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {userMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
          <h3 className="text-white text-lg font-semibold">
            All Users
            {debouncedSearch && (
              <span className="text-sm text-gray-400 font-normal ml-2">({pagination.totalCount} found)</span>
            )}
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full bg-gray-700 text-white pl-10 pr-9 py-2 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
            {searchEmail && (
              <button
                onClick={() => setSearchEmail('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : tableData.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <DataTable
              headers={['Name', 'Email', 'Role', 'Status', 'Proposals', 'Joined']}
              data={tableData}
              actions={userActions}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-400">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('ellipsis-' + p);
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
                            p === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Flag User Modal */}
      <Modal
        isOpen={isFlagModalOpen}
        onClose={() => {
          setIsFlagModalOpen(false);
          setFlagTarget(null);
          setFlagReason('');
        }}
        title="Flag User Account"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-amber-900/30 border border-amber-700 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-amber-200 text-sm">
              You are about to flag <strong className="text-white">{flagTarget?.name || flagTarget?.email}</strong> for terms &amp; conditions violation.
            </p>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Reason for flagging</label>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Describe the violation (e.g., spam, abuse, policy violation)..."
              rows={3}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setIsFlagModalOpen(false);
                setFlagTarget(null);
                setFlagReason('');
              }}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleFlagUser}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm flex items-center gap-2"
            >
              <Flag className="w-4 h-4" />
              Flag Account
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New User"
      >
        <UserForm
          onClose={() => setIsModalOpen(false)}
          onSubmit={(data) => {
            console.log('Adding user:', data);
            setIsModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
};
export default UserManagementSection;