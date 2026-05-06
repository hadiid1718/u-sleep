import { useEffect, useMemo, useRef, useState } from 'react';

const formatDateTime = value => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const createEmptyForm = () => ({
  title: '',
  videoUrl: '',
  thumbnailUrl: '',
  description: '',
  reviewerName: '',
  reviewerRole: '',
  isActive: true,
});

const AdminReviewVideoPanel = ({
  videos,
  loading,
  pagination,
  onFetch,
  onCreate,
  onUpdate,
  onDelete,
  onSetActive,
}) => {
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(createEmptyForm());
  const fetchRef = useRef(onFetch);

  useEffect(() => {
    fetchRef.current = onFetch;
  }, [onFetch]);

  useEffect(() => {
    fetchRef.current({ page, limit: 10 });
  }, [page]);

  const totalVideos = pagination?.total || videos.length;
  const activeVideo = useMemo(() => videos.find(item => item.isActive) || null, [videos]);

  const resetForm = () => {
    setEditingId(null);
    setFormData(createEmptyForm());
  };

  const handleEdit = video => {
    setEditingId(video._id);
    setFormData({
      title: video.title || '',
      videoUrl: video.videoUrl || '',
      thumbnailUrl: video.thumbnailUrl || '',
      description: video.description || '',
      reviewerName: video.reviewerName || '',
      reviewerRole: video.reviewerRole || '',
      isActive: Boolean(video.isActive),
    });
  };

  const handleSubmit = async event => {
    event.preventDefault();

    const payload = {
      title: formData.title.trim(),
      videoUrl: formData.videoUrl.trim(),
      thumbnailUrl: formData.thumbnailUrl.trim(),
      description: formData.description.trim(),
      reviewerName: formData.reviewerName.trim(),
      reviewerRole: formData.reviewerRole.trim(),
      isActive: formData.isActive,
    };

    if (editingId) {
      await onUpdate(editingId, payload);
    } else {
      await onCreate(payload);
    }

    resetForm();
  };

  const handleDelete = async videoId => {
    if (window.confirm('Delete this review video?')) {
      await onDelete(videoId);
      if (editingId === videoId) {
        resetForm();
      }
    }
  };

  const canGoPrevious = (pagination?.page || page) > 1;
  const canGoNext = (pagination?.page || page) < (pagination?.pages || 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="admin-card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Review Videos</p>
          <h3 className="admin-title mt-2 text-2xl">{totalVideos}</h3>
          <p className="text-xs text-slate-500 mt-1">Total testimonial assets</p>
        </div>
        <div className="admin-card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active item</p>
          <h3 className="admin-title mt-2 text-2xl">{activeVideo ? '1' : '0'}</h3>
          <p className="text-xs text-slate-500 mt-1">Currently published clip</p>
        </div>
        <div className="admin-card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Latest upload</p>
          <h3 className="admin-title mt-2 text-lg leading-tight">{videos[0]?.title || 'None yet'}</h3>
          <p className="text-xs text-slate-500 mt-1">Newest record in the library</p>
        </div>
      </div>

      <div className="admin-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="admin-title text-xl">Review Video Library</h3>
            <p className="text-xs text-slate-500">Create, update, and switch the testimonial video shown publicly.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setPage(1);
            }}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-sm text-slate-500">
            Loading review videos...
          </div>
        ) : (
          <>
            <div className="mt-6 admin-card p-6">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">Featured review</p>
                    <h4 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                      {activeVideo?.title || 'No active review video'}
                    </h4>
                    <p className="mt-3 max-w-2xl text-sm text-slate-600">
                      {activeVideo?.description || 'Use the form below to upload a new testimonial clip or mark an existing record as active.'}
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reviewer</p>
                      <p className="mt-1 font-semibold text-slate-900">{activeVideo?.reviewerName || '—'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Source</p>
                      <p className="mt-1 font-semibold text-slate-900">{activeVideo?.uploadedByLabel || 'Admin'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Preview details</p>
                  <dl className="mt-4 space-y-4 text-sm text-slate-700">
                    <div>
                      <dt className="text-slate-500">Video URL</dt>
                      <dd className="mt-1 break-all font-medium text-slate-900">{activeVideo?.videoUrl || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Uploaded at</dt>
                      <dd className="mt-1 font-medium text-slate-900">{formatDateTime(activeVideo?.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Role</dt>
                      <dd className="mt-1 font-medium text-slate-900">{activeVideo?.reviewerRole || '—'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Reviewer</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3">Uploaded by</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {videos.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                        No review videos have been added yet.
                      </td>
                    </tr>
                  ) : (
                    videos.map(video => (
                      <tr key={video._id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{video.title}</p>
                          <p className="mt-1 break-all text-xs text-slate-500">{video.videoUrl}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          <p className="font-medium text-slate-800">{video.reviewerName}</p>
                          <p className="text-xs text-slate-500">{video.reviewerRole || 'No role set'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              video.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {video.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{video.uploadedByLabel || 'Admin'}</td>
                        <td className="px-4 py-4 text-slate-600">{formatDateTime(video.createdAt)}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {!video.isActive && (
                              <button
                                type="button"
                                onClick={() => onSetActive(video._id)}
                                className="rounded-full border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                              >
                                Set active
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleEdit(video)}
                              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(video._id)}
                              className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <p>
                Page {pagination?.page || page} of {pagination?.pages || 1}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(value => Math.max(1, value - 1))}
                  disabled={!canGoPrevious}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage(value => value + 1)}
                  disabled={!canGoNext}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="admin-card p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="admin-title text-xl">{editingId ? 'Edit Review Video' : 'Add Review Video'}</h3>
            <p className="text-xs text-slate-500">Upload a new clip or update the metadata shown on the public testimonial section.</p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2 text-sm xl:col-span-2">
            <span className="font-semibold text-slate-700">Title</span>
            <input
              type="text"
              value={formData.title}
              onChange={event => setFormData(current => ({ ...current, title: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-emerald-400"
              placeholder="Customer story title"
              required
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-semibold text-slate-700">Reviewer name</span>
            <input
              type="text"
              value={formData.reviewerName}
              onChange={event => setFormData(current => ({ ...current, reviewerName: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-emerald-400"
              placeholder="Jane Doe"
              required
            />
          </label>

          <label className="space-y-2 text-sm xl:col-span-2">
            <span className="font-semibold text-slate-700">Video URL</span>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={event => setFormData(current => ({ ...current, videoUrl: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-emerald-400"
              placeholder="https://..."
              required
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-semibold text-slate-700">Reviewer role</span>
            <input
              type="text"
              value={formData.reviewerRole}
              onChange={event => setFormData(current => ({ ...current, reviewerRole: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-emerald-400"
              placeholder="CEO, Founder, etc."
            />
          </label>

          <label className="space-y-2 text-sm xl:col-span-2">
            <span className="font-semibold text-slate-700">Thumbnail URL</span>
            <input
              type="url"
              value={formData.thumbnailUrl}
              onChange={event => setFormData(current => ({ ...current, thumbnailUrl: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-emerald-400"
              placeholder="https://..."
            />
          </label>

          <label className="space-y-2 text-sm xl:col-span-3">
            <span className="font-semibold text-slate-700">Description</span>
            <textarea
              value={formData.description}
              onChange={event => setFormData(current => ({ ...current, description: event.target.value }))}
              className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-400"
              placeholder="Short summary for the testimonial section"
              rows={4}
            />
          </label>

          <div className="flex flex-wrap items-center gap-4 md:col-span-2 xl:col-span-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={event => setFormData(current => ({ ...current, isActive: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              Make active
            </label>
          </div>

          <div className="flex gap-3 md:col-span-2 xl:col-span-3">
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              {editingId ? 'Save changes' : 'Create video'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminReviewVideoPanel;
