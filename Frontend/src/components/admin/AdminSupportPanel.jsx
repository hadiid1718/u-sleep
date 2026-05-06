import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, MessageSquare, Search, Send } from 'lucide-react';
import { supportAPI } from '../../services/supportService';
import { useSocket } from '../../context/SocketContext';
import './AdminSupportPanel.css';

const CHAT_PAGE_SIZE = 10;
const MESSAGE_PAGE_SIZE = 20;
const ADMIN_SUPPORT_STATE_KEY = 'admin-support-panel-state';

function readAdminSupportState() {
  try {
    const raw = window.localStorage.getItem(ADMIN_SUPPORT_STATE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function AdminSupportPanel() {
  const [chats, setChats] = useState([]);
  const [chatPagination, setChatPagination] = useState({ total: 0, page: 1, limit: CHAT_PAGE_SIZE, pages: 1 });
  const persistedState = readAdminSupportState();
  const [chatPage, setChatPage] = useState(() => Number(persistedState.chatPage) || 1);
  const [selectedUserId, setSelectedUserId] = useState(() => persistedState.selectedUserId || null);
  const [selectedChatInfo, setSelectedChatInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagePagination, setMessagePagination] = useState({ total: 0, page: 1, limit: MESSAGE_PAGE_SIZE, pages: 1 });
  const [messagePage, setMessagePage] = useState(() => Number(persistedState.messagePage) || 1);
  const [draftReply, setDraftReply] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollAnchorRef = useRef(null);
  const { socket } = useSocket();

  useEffect(() => {
    try {
      window.localStorage.setItem(
        ADMIN_SUPPORT_STATE_KEY,
        JSON.stringify({ selectedUserId, chatPage, messagePage })
      );
    } catch {
      // ignore persistence errors
    }
  }, [selectedUserId, chatPage, messagePage]);

  const selectedChat = useMemo(
    () => chats.find(chat => String(chat.userId) === String(selectedUserId)) || selectedChatInfo || null,
    [chats, selectedUserId, selectedChatInfo]
  );

  const loadChats = async (page = 1) => {
    setLoadingChats(true);
    const response = await supportAPI.adminListAllChats(page, CHAT_PAGE_SIZE);
    if (response.success) {
      const nextChats = response.data?.data?.chats || [];
      setChats(nextChats);
      setChatPagination(
        response.data?.data?.pagination || {
          total: 0,
          page,
          limit: CHAT_PAGE_SIZE,
          pages: 1,
        }
      );

      if (selectedUserId) {
        const preserved = nextChats.find(chat => String(chat.userId) === String(selectedUserId));
        if (preserved) {
          setSelectedChatInfo(preserved);
        } else if (nextChats.length > 0) {
          handleSelectChat(nextChats[0].userId, nextChats[0]);
        } else {
          setSelectedChatInfo(null);
        }
      } else if (nextChats.length > 0) {
        handleSelectChat(nextChats[0].userId, nextChats[0]);
      }
    }
    setLoadingChats(false);
  };

  const loadMessages = async (userId, page = 1) => {
    if (!userId) return;

    setLoadingMessages(true);
    const response = await supportAPI.adminListUserMessages(userId, page, MESSAGE_PAGE_SIZE);
    if (response.success) {
      setMessages(response.data?.data?.messages || []);
      setMessagePagination(
        response.data?.data?.pagination || {
          total: 0,
          page,
          limit: MESSAGE_PAGE_SIZE,
          pages: 1,
        }
      );
      await supportAPI.adminMarkAsRead(userId);
      setChats(prev =>
        prev.map(chat =>
          String(chat.userId) === String(userId)
            ? { ...chat, unreadCount: 0 }
            : chat
        )
      );
    }
    setLoadingMessages(false);
  };

  useEffect(() => {
    loadChats(chatPage);
  }, [chatPage]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadChats(chatPage);

      if (selectedUserId) {
        loadMessages(selectedUserId, messagePage);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [chatPage, selectedUserId, messagePage]);

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      setMessagePagination({ total: 0, page: 1, limit: MESSAGE_PAGE_SIZE, pages: 1 });
      return;
    }

    loadMessages(selectedUserId, messagePage);
  }, [selectedUserId, messagePage]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewUserMessage = (data) => {
      setChats(prev => {
        const existing = prev.find(chat => String(chat.userId) === String(data.userId));
        if (existing) {
          return prev.map(chat =>
            String(chat.userId) === String(data.userId)
              ? {
                  ...chat,
                  latestMessage: data.message,
                  latestTimestamp: data.timestamp,
                  unreadCount: String(selectedUserId) === String(data.userId) ? 0 : (chat.unreadCount || 0) + 1,
                }
              : chat
          );
        }

        return [
          {
            userId: data.userId,
            userName: data.userName,
            latestMessage: data.message,
            latestTimestamp: data.timestamp,
            unreadCount: String(selectedUserId) === String(data.userId) ? 0 : 1,
          },
          ...prev,
        ];
      });

      if (!selectedUserId || String(selectedUserId) === String(data.userId)) {
        if (!selectedUserId) {
          setSelectedUserId(data.userId);
          setSelectedChatInfo({
            userId: data.userId,
            userName: data.userName,
            latestMessage: data.message,
            latestTimestamp: data.timestamp,
            unreadCount: 0,
          });
        }

        const nextMessage = {
          _id: data.messageId || `socket-${Date.now()}`,
          userId: data.userId,
          sender: 'user',
          message: data.message,
          createdAt: data.timestamp,
        };

        if (messagePage === 1) {
          setMessages(prev => [...prev, nextMessage]);
        } else {
          setMessagePage(1);
        }
      }
    };

    const handleAdminReplySent = (data) => {
      setChats(prev =>
        prev.map(chat =>
          String(chat.userId) === String(data.userId)
            ? {
                ...chat,
                latestMessage: data.message,
                latestTimestamp: data.timestamp,
              }
            : chat
        )
      );
    };

    socket.on('support-chat:new-user-message', handleNewUserMessage);
    socket.on('support-chat:admin-reply-sent', handleAdminReplySent);

    return () => {
      socket.off('support-chat:new-user-message', handleNewUserMessage);
      socket.off('support-chat:admin-reply-sent', handleAdminReplySent);
    };
  }, [socket, selectedUserId, messagePage]);

  useEffect(() => {
    if (scrollAnchorRef.current) {
      scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendReply = async (event) => {
    event.preventDefault();

    const trimmed = String(draftReply || '').trim();
    if (!trimmed || !selectedUserId) return;

    const temporaryId = `local-${Date.now()}`;
    const optimisticMessage = {
      _id: temporaryId,
      userId: selectedUserId,
      sender: 'admin',
      message: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setDraftReply('');

    const response = await supportAPI.adminPostReply(selectedUserId, trimmed);
    if (response.success) {
      const savedMessages = response.data?.data?.messages || [];
      if (savedMessages.length > 0) {
        const [savedMessage] = savedMessages;
        setMessages(prev =>
          prev.map(message =>
            message._id === temporaryId ? savedMessage : message
          )
        );

        if (savedMessages.length > 1) {
          setMessages(prev => [...prev, ...savedMessages.slice(1)]);
        }

        setChats(prev =>
          prev.map(chat =>
            String(chat.userId) === String(selectedUserId)
              ? {
                  ...chat,
                  latestMessage: savedMessage.message,
                  latestTimestamp: savedMessage.createdAt,
                }
              : chat
          )
        );
      }
    }
  };

  const filteredChats = chats.filter(chat => {
    const lowerSearch = searchTerm.toLowerCase();
    const searchTarget = [
      chat.userName,
      chat.userEmail,
      chat.latestMessage,
      chat.latestSender,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return (
      searchTarget.includes(lowerSearch) || !lowerSearch
    );
  });

  const canGoToOlderChatPage = chatPagination.page < chatPagination.pages;
  const canGoToNewerChatPage = chatPagination.page > 1;
  const canGoToOlderMessagePage = messagePagination.page < messagePagination.pages;
  const canGoToNewerMessagePage = messagePagination.page > 1;

  const handleSelectChat = useCallback((userId, chatInfo = null) => {
    setSelectedUserId(userId);
    setSelectedChatInfo(chatInfo || chats.find(chat => String(chat.userId) === String(userId)) || null);
    setMessagePage(1);
  }, [chats]);

  useEffect(() => {
    if (!selectedUserId && chats.length > 0) {
      handleSelectChat(chats[0].userId, chats[0]);
    }
  }, [chats, selectedUserId, handleSelectChat]);

  return (
    <div className="admin-card admin-support-panel p-5 md:p-6">
      <div className="admin-support-layout">
        <aside className="admin-support-sidebar">
          <h2 className="admin-support-title">Support Chats</h2>

          <div className="admin-support-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="admin-support-list">
            {loadingChats ? (
              <div className="admin-support-loading">Loading...</div>
            ) : filteredChats.length === 0 ? (
              <div className="admin-support-empty">
                <MessageSquare size={32} />
                <p>No support chats yet</p>
              </div>
            ) : (
                filteredChats.map(chat => (
                <button
                  key={chat.userId}
                  type="button"
                  className={`admin-support-chat-item ${String(selectedUserId) === String(chat.userId) ? 'is-active' : ''}`}
                  onClick={() => handleSelectChat(chat.userId, chat)}
                >
                  <div className="admin-support-chat-info">
                    <div className="admin-support-chat-header">
                      <h3>{chat.userName || chat.userEmail || 'Support conversation'}</h3>
                      {chat.unreadCount > 0 && <span className="admin-support-badge">{chat.unreadCount}</span>}
                    </div>
                    <p className="admin-support-chat-preview">{chat.latestMessage || 'No message preview available'}</p>
                    <span className="admin-support-chat-time">
                      {chat.latestTimestamp
                        ? new Date(chat.latestTimestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Just now'}
                    </span>
                  </div>
                  {chat.unreadCount > 0 && <AlertCircle size={20} className="admin-support-unread-icon" />}
                </button>
              ))
            )}
          </div>

          <div className="admin-support-pagination admin-support-pagination--sidebar">
            <button
              type="button"
              onClick={() => setChatPage(page => Math.max(page - 1, 1))}
              disabled={!canGoToNewerChatPage}
            >
              <ChevronLeft size={16} />
              Newer
            </button>
            <span>
              Page {chatPagination.page} of {chatPagination.pages || 1}
            </span>
            <button
              type="button"
              onClick={() => setChatPage(page => Math.min(page + 1, chatPagination.pages || 1))}
              disabled={!canGoToOlderChatPage}
            >
              Older
              <ChevronRight size={16} />
            </button>
          </div>
        </aside>

        <section className="admin-support-main">
          {selectedUserId ? (
            <>
              <header className="admin-support-chat-header-panel">
                <div className="admin-support-thread-meta">
                  <div>
                    <h2>{selectedChat?.userName || 'User'}</h2>
                    <p>{selectedChat?.userEmail || 'No email available'}</p>
                  </div>
                  <div className="admin-support-thread-actions">
                    <span>
                      {messagePagination.total} message{messagePagination.total === 1 ? '' : 's'}
                    </span>
                    <div className="admin-support-pagination admin-support-pagination--thread">
                      <button
                        type="button"
                        onClick={() => setMessagePage(page => Math.max(page - 1, 1))}
                        disabled={!canGoToNewerMessagePage || loadingMessages}
                      >
                        <ChevronLeft size={16} />
                        Newer
                      </button>
                      <span>
                        Page {messagePagination.page} of {messagePagination.pages || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMessagePage(page => Math.min(page + 1, messagePagination.pages || 1))}
                        disabled={!canGoToOlderMessagePage || loadingMessages}
                      >
                        Older
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </header>

              <div className="admin-support-messages">
                {loadingMessages ? (
                  <div className="admin-support-loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="admin-support-empty-state">
                    <MessageSquare size={48} />
                    <p>No messages on this page</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <article
                      key={message._id || `${message.sender}-${message.createdAt}`}
                      className={`admin-support-message ${message.sender === 'admin' ? 'is-admin' : 'is-user'}`}
                    >
                      <div className="admin-support-message-badge">
                        {message.sender === 'admin' ? <CheckCircle2 size={14} /> : <MessageSquare size={14} />}
                        <span>{message.sender === 'admin' ? 'You' : 'User'}</span>
                      </div>
                      <p>{message.message || message.body}</p>
                      <time>
                        {message.createdAt
                          ? new Date(message.createdAt).toLocaleString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : ''}
                      </time>
                    </article>
                  ))
                )}
                <div ref={scrollAnchorRef} />
              </div>

              <form className="admin-support-reply" onSubmit={handleSendReply}>
                <input
                  type="text"
                  value={draftReply}
                  onChange={(event) => setDraftReply(event.target.value)}
                  placeholder="Type your reply..."
                />
                <button type="submit" aria-label="Send reply">
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="admin-support-empty-state">
              <MessageSquare size={48} />
              <p>Refresh the tab to load persisted conversations, then select a chat to view messages.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminSupportPanel;