import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  CheckCheck,
  CreditCard,
  FileText,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import { notificationAPI } from '../../services/notificationService';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'new_jobs', label: 'New Jobs' },
  { key: 'proposals', label: 'Proposals' },
  { key: 'billing', label: 'Billing' },
];

const iconByGroup = {
  new_jobs: Briefcase,
  proposals: FileText,
  billing: CreditCard,
};

const formatRelativeTime = value => {
  if (!value) return 'Just now';

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';

  const diff = Date.now() - timestamp;
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const priorityClass = priority => {
  if (priority === 'high') {
    return 'bg-red-500/20 text-red-300 border border-red-500/40';
  }

  if (priority === 'medium') {
    return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
  }

  return 'bg-gray-700 text-gray-200 border border-gray-600';
};

const NotificationDrawer = ({ user }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({ unreadCount: 0, grouped: {} });
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState('');

  const unreadCount = Number(summary?.unreadCount || 0);

  const hasUnread = useMemo(
    () => notifications.some(item => !item.read),
    [notifications]
  );

  const refreshSummary = async () => {
    const response = await notificationAPI.getSummary();
    if (!response.success) return;

    const data = response.data?.data || {};
    setSummary({
      unreadCount: Number(data.unreadCount || 0),
      grouped: data.grouped || {},
    });
  };

  const fetchNotifications = async filterKey => {
    setLoading(true);
    setError('');

    const response = await notificationAPI.getNotifications({
      page: 1,
      limit: 30,
      group: filterKey === 'all' ? undefined : filterKey,
    });

    if (!response.success) {
      setLoading(false);
      setError(response.error?.message || 'Failed to load notifications');
      return;
    }

    const data = response.data?.data || {};
    setNotifications(Array.isArray(data.items) ? data.items : []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return undefined;

    refreshSummary();

    const interval = setInterval(() => {
      refreshSummary();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!isOpen || !user) return;

    fetchNotifications(activeFilter);
    refreshSummary();
  }, [isOpen, activeFilter, user]);

  const openDrawer = () => {
    setIsOpen(true);
  };

  const closeDrawer = () => {
    setIsOpen(false);
  };

  const handleCardClick = async item => {
    if (!item || item.read) return;

    setNotifications(prev =>
      prev.map(notification =>
        notification.id === item.id ? { ...notification, read: true } : notification
      )
    );

    await notificationAPI.markAsRead(item.id);
    refreshSummary();
  };

  const handleMarkAllRead = async () => {
    setMutating(true);

    const response = await notificationAPI.markAllRead(
      activeFilter === 'all' ? undefined : activeFilter
    );

    if (response.success) {
      setNotifications(prev => prev.map(item => ({ ...item, read: true })));
      await refreshSummary();
    }

    setMutating(false);
  };

  const handleDeleteOne = async (event, notificationId) => {
    event.stopPropagation();
    if (!notificationId) return;

    setMutating(true);
    const response = await notificationAPI.deleteOne(notificationId);

    if (response.success) {
      setNotifications(prev => prev.filter(item => item.id !== notificationId));
      await refreshSummary();
    }

    setMutating(false);
  };

  const handleDeleteAll = async () => {
    setMutating(true);

    const response = await notificationAPI.deleteAll(
      activeFilter === 'all' ? undefined : activeFilter
    );

    if (response.success) {
      setNotifications([]);
      await refreshSummary();
    }

    setMutating(false);
  };

  const handleAction = (event, action) => {
    event.stopPropagation();

    if (!action) return;

    const normalizeRoute = route => {
      if (route === '/dashboard') return '/user/dashboard';
      return route;
    };

    if (/^https?:\/\//i.test(action)) {
      try {
        const parsed = new URL(action);

        if (parsed.origin === window.location.origin) {
          const internalRoute = normalizeRoute(
            `${parsed.pathname}${parsed.search}${parsed.hash}`
          );
          navigate(internalRoute);
          closeDrawer();
          return;
        }
      } catch {
        window.open(action, '_blank', 'noopener,noreferrer');
        return;
      }

      window.open(action, '_blank', 'noopener,noreferrer');
      return;
    }

    navigate(normalizeRoute(action));
    closeDrawer();
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={openDrawer}
        className="relative border border-lime-400 text-white rounded-md p-2 hover:bg-lime-400 hover:text-black"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-lime-400 text-black text-xs font-semibold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          <aside className="fixed right-0 top-0 h-screen w-full max-w-md bg-zinc-900 border-l border-lime-400/50 shadow-2xl flex flex-col z-50 pt-20">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
              <div>
                <h3 className="text-white font-semibold text-lg">Notifications</h3>
                <p className="text-sm text-gray-300">
                  {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
                </p>
              </div>

              <button
                onClick={closeDrawer}
                className="text-gray-300 hover:text-white p-1"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-zinc-700 flex flex-wrap gap-2">
              {FILTERS.map(filter => {
                const groupedCount =
                  filter.key === 'all'
                    ? unreadCount
                    : Number(summary?.grouped?.[filter.key] || 0);

                return (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      activeFilter === filter.key
                        ? 'bg-lime-400 text-black border-lime-400'
                        : 'bg-zinc-800 text-gray-200 border-zinc-600 hover:border-lime-400/60'
                    }`}
                  >
                    {filter.label}
                    {groupedCount > 0 && ` (${groupedCount})`}
                  </button>
                );
              })}
            </div>

            <div className="px-4 py-3 border-b border-zinc-700 flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                disabled={mutating || !hasUnread}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-600 text-gray-200 disabled:opacity-50 hover:border-lime-400"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>

              <button
                onClick={handleDeleteAll}
                disabled={mutating || notifications.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-600 text-gray-200 disabled:opacity-50 hover:border-red-400"
              >
                <Trash2 className="w-4 h-4" />
                Delete all
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loading && (
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading notifications...
                </div>
              )}

              {!loading && error && (
                <div className="text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-md p-3">
                  {error}
                </div>
              )}

              {!loading && !error && notifications.length === 0 && (
                <div className="text-center text-gray-400 py-10 border border-dashed border-zinc-700 rounded-lg">
                  <Bell className="w-8 h-8 mx-auto mb-3 text-zinc-500" />
                  No notifications yet.
                </div>
              )}

              {!loading &&
                !error &&
                notifications.map(item => {
                  const GroupIcon = iconByGroup[item.group] || Bell;
                  const firstAction = Array.isArray(item.cta) ? item.cta[0] : null;

                  return (
                    <article
                      key={item.id}
                      onClick={() => handleCardClick(item)}
                      className={`rounded-lg border p-3 cursor-pointer transition ${
                        item.read
                          ? 'border-zinc-700 bg-zinc-800/70'
                          : 'border-lime-400/40 bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-lime-300">
                          <GroupIcon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm text-white font-medium leading-5">
                              {item.title}
                            </h4>

                            <button
                              onClick={event => handleDeleteOne(event, item.id)}
                              className="text-zinc-400 hover:text-red-300 p-1"
                              aria-label="Delete notification"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-sm text-gray-300 mt-1 leading-5">{item.body}</p>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${priorityClass(item.priority)}`}>
                              {item.priority}
                            </span>

                            {item.statusBadge && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-gray-200 border border-zinc-600">
                                {item.statusBadge}
                              </span>
                            )}

                            <span className="text-xs text-zinc-400">
                              {formatRelativeTime(item.timestamp)}
                            </span>
                          </div>

                          {firstAction && (
                            <button
                              onClick={event => handleAction(event, firstAction.action)}
                              className="mt-3 text-xs px-3 py-1.5 rounded-md bg-lime-400 text-black hover:bg-lime-500"
                            >
                              {firstAction.label}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default NotificationDrawer;
