import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Upload,
  Trash2,
  Edit3,
  CheckCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Play,
  Star,
} from 'lucide-react';
import { LoadingState } from '../utils/LoadingState';
import { Modal } from '../utils/Model';
import MetricCard from '../utils/MatricCard';
import { reviewVideoAPI } from '../../../utils/api';

const ITEMS_PER_PAGE = 6;

const ReviewManagementSection = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    limit: ITEMS_PER_PAGE,
  });

  const [formData, setFormData] = useState({
    title: '',
    videoUrl: '',
    thumbnailUrl: '',
    description: '',
    reviewerName: '',
    reviewerRole: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      videoUrl: '',
      thumbnailUrl: '',
      description: '',
      reviewerName: '',
      reviewerRole: '',
    });
  };

  const fetchVideos = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await reviewVideoAPI.getAll({ page, limit: ITEMS_PER_PAGE });

      if (result.success) {
        const { data, page: currentPage, totalPages, totalCount, limit } = result.data;
        setVideos(data);
        setPagination({ page: currentPage, totalPages, totalCount, limit });
      } else {
        console.error('Error fetching review videos:', result.error?.message);
      }
    } catch (error) {
      console.error('Error fetching review videos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos(1);
  }, [fetchVideos]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchVideos(newPage);
  };

  // Upload new review video
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.videoUrl || !formData.reviewerName) {
      alert('Title, Video URL, and Reviewer Name are required.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await reviewVideoAPI.upload(formData);
      if (result.success) {
        alert('Review video uploaded successfully! It is now the active video shown on the homepage.');
        setIsUploadModalOpen(false);
        resetForm();
        fetchVideos(1);
      } else {
        alert(result.error?.message || 'Error uploading review video');
      }
    } catch (error) {
      console.error('Error uploading review video:', error);
      alert('Error uploading review video');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit review video
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedVideo) return;
    setSubmitting(true);
    try {
      const result = await reviewVideoAPI.update(selectedVideo._id, formData);
      if (result.success) {
        alert('Review video updated successfully!');
        setIsEditModalOpen(false);
        setSelectedVideo(null);
        resetForm();
        fetchVideos(pagination.page);
      } else {
        alert(result.error?.message || 'Error updating review video');
      }
    } catch (error) {
      console.error('Error updating review video:', error);
      alert('Error updating review video');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete review video
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this review video?')) return;
    try {
      const result = await reviewVideoAPI.delete(id);
      if (result.success) {
        alert('Review video deleted successfully!');
        fetchVideos(pagination.page);
      } else {
        alert(result.error?.message || 'Error deleting review video');
      }
    } catch (error) {
      console.error('Error deleting review video:', error);
      alert('Error deleting review video');
    }
  };

  // Set as active
  const handleSetActive = async (id) => {
    try {
      const result = await reviewVideoAPI.setActive(id);
      if (result.success) {
        alert('Video set as active! It will now be displayed on the homepage.');
        fetchVideos(pagination.page);
      } else {
        alert(result.error?.message || 'Error setting video as active');
      }
    } catch (error) {
      console.error('Error setting active video:', error);
      alert('Error setting video as active');
    }
  };

  const openEditModal = (video) => {
    setSelectedVideo(video);
    setFormData({
      title: video.title || '',
      videoUrl: video.videoUrl || '',
      thumbnailUrl: video.thumbnailUrl || '',
      description: video.description || '',
      reviewerName: video.reviewerName || '',
      reviewerRole: video.reviewerRole || '',
    });
    setIsEditModalOpen(true);
  };

  const stats = {
    total: pagination.totalCount,
    active: videos.filter((v) => v.isActive).length,
  };

  const metrics = [
    { title: 'Total Videos', value: String(stats.total ?? 0), icon: Video },
    { title: 'Active (Shown)', value: String(stats.active ?? 0), icon: Eye },
  ];

  const renderFormFields = () => (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-lime-400 focus:outline-none"
          placeholder="Demo Review – March 2026"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Video URL *</label>
        <input
          type="url"
          value={formData.videoUrl}
          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-lime-400 focus:outline-none"
          placeholder="https://youtube.com/watch?v=... or direct .mp4 link"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Thumbnail URL</label>
        <input
          type="url"
          value={formData.thumbnailUrl}
          onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-lime-400 focus:outline-none"
          placeholder="https://example.com/thumb.jpg"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Reviewer Name *</label>
        <input
          type="text"
          value={formData.reviewerName}
          onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-lime-400 focus:outline-none"
          placeholder="John Doe"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Reviewer Role</label>
        <input
          type="text"
          value={formData.reviewerRole}
          onChange={(e) => setFormData({ ...formData, reviewerRole: e.target.value })}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-lime-400 focus:outline-none"
          placeholder="CEO at Acme Inc."
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-lime-400 focus:outline-none resize-none"
          rows={3}
          maxLength={500}
          placeholder="Brief description of the demo review..."
        />
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl lg:text-2xl font-bold">Review Video Management</h2>
        <button
          onClick={() => {
            resetForm();
            setIsUploadModalOpen(true);
          }}
          className="flex items-center gap-2 bg-lime-400 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-lime-500 transition-colors"
        >
          <Upload size={18} />
          <span className="hidden sm:inline">Upload New Video</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Info Banner */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-start gap-3">
        <Star className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
        <p className="text-gray-300 text-sm">
          Only the <span className="text-lime-400 font-medium">active</span> video is displayed in the testimonial section on the homepage.
          Uploading a new video automatically makes it active and hides the previous one.
          You can also manually set any older video as active.
        </p>
      </div>

      {/* Video list */}
      {loading ? (
        <LoadingState />
      ) : videos.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No review videos yet</h3>
          <p className="text-gray-400">Upload your first demo review video to display on the homepage.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {videos.map((video) => (
              <div
                key={video._id}
                className={`bg-gray-800 rounded-lg overflow-hidden border transition-colors ${
                  video.isActive ? 'border-lime-400' : 'border-gray-700'
                }`}
              >
                {/* Thumbnail / Preview */}
                <div className="relative aspect-video bg-gray-950 flex items-center justify-center">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Play className="w-10 h-10 text-gray-600" />
                  )}
                  {video.isActive && (
                    <span className="absolute top-2 right-2 bg-lime-400 text-gray-900 text-xs font-bold px-2 py-1 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="text-white font-semibold truncate">{video.title}</h3>
                  <p className="text-gray-400 text-sm truncate">
                    {video.reviewerName}
                    {video.reviewerRole && ` — ${video.reviewerRole}`}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(video.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    {!video.isActive && (
                      <button
                        onClick={() => handleSetActive(video._id)}
                        title="Set as active"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-lime-400/10 text-lime-400 text-xs font-medium hover:bg-lime-400/20 transition-colors"
                      >
                        <CheckCircle size={14} />
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(video)}
                      title="Edit"
                      className="p-1.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(video._id)}
                      title="Delete"
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open video URL"
                      className="p-1.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors ml-auto"
                    >
                      <Eye size={16} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} videos
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
                  .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('ellipsis-' + p);
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p) =>
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
                  )}

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

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          resetForm();
        }}
        title="Upload Review Video"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          {renderFormFields()}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setIsUploadModalOpen(false); resetForm(); }}
              className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-lime-400 text-gray-900 font-medium hover:bg-lime-500 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Upload & Set Active'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVideo(null);
          resetForm();
        }}
        title="Edit Review Video"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          {renderFormFields()}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setIsEditModalOpen(false); setSelectedVideo(null); resetForm(); }}
              className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-lime-400 text-gray-900 font-medium hover:bg-lime-500 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReviewManagementSection;
