import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import './FounderChatWidget.css';
import { supportAPI } from '../../services/supportService';
import { useSocket } from '../../context/SocketContext';

const FOUNDER_TELEGRAM_URL = import.meta.env.VITE_FOUNDER_TELEGRAM_URL || 'https://t.me/';
const FOUNDER_WHATSAPP_URL = import.meta.env.VITE_FOUNDER_WHATSAPP_URL || 'https://wa.me/';

const FounderAvatar = () => (
  <div className="founder-avatar" aria-hidden="true">
    <span className="founder-avatar-mark">F</span>
  </div>
);

function FounderChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);
  const scrollAnchorRef = useRef(null);
  const retentionTimerRef = useRef(null);
  const { socket } = useSocket();

  const clearRetentionTimer = useCallback(() => {
    if (retentionTimerRef.current) {
      clearTimeout(retentionTimerRef.current);
      retentionTimerRef.current = null;
    }
  }, []);

  const scheduleExpiryFromMessages = useCallback((nextMessages) => {
    clearRetentionTimer();

    if (!isOpen || !nextMessages.length) {
      return;
    }

    const latestMessage = nextMessages.reduce((latest, current) => {
      const latestTime = latest?.createdAt ? new Date(latest.createdAt).getTime() : 0;
      const currentTime = current?.createdAt ? new Date(current.createdAt).getTime() : 0;
      return currentTime >= latestTime ? current : latest;
    }, null);

    if (!latestMessage?.createdAt) {
      return;
    }

    const expiresAt = new Date(new Date(latestMessage.createdAt).getTime() + 10 * 60 * 1000);
    const remainingMs = expiresAt.getTime() - Date.now();

    if (remainingMs <= 0) {
      setMessages([]);
      return;
    }

    retentionTimerRef.current = window.setTimeout(() => {
      setMessages([]);
    }, remainingMs);
  }, [clearRetentionTimer, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (scrollAnchorRef.current) scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    scheduleExpiryFromMessages(messages);

    return clearRetentionTimer;
  }, [messages, isOpen, scheduleExpiryFromMessages, clearRetentionTimer]);

  // Fetch history when opened and set up Socket.IO listeners
  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      const res = await supportAPI.getUserChats();
      if (res.success) setMessages(res.data?.data?.messages || []);
    };

    load();

    // Listen for new admin replies via Socket.IO
    if (socket) {
      socket.on('support-chat:new-admin-reply', (data) => {
        setMessages(prev => [
          ...prev,
          {
            _id: `socket-${Date.now()}`,
            sender: data.sender,
            message: data.message,
            createdAt: data.timestamp,
          },
        ]);
      });

      socket.on('support-chat:new-system-reply', (data) => {
        setMessages(prev => [
          ...prev,
          {
            _id: data.messageId || `socket-${Date.now()}`,
            sender: 'system',
            message: data.message,
            createdAt: data.timestamp,
          },
        ]);
      });

      return () => {
        socket.off('support-chat:new-admin-reply');
        socket.off('support-chat:new-system-reply');
      };
    }

    return clearRetentionTimer;
  }, [isOpen, socket, clearRetentionTimer]);

  const handleSendMessage = async (event) => {
    event?.preventDefault();
    const trimmed = String(draftMessage || '').trim();
    if (!trimmed) return;

    // Optimistic UI: append the user message locally
    const optimistic = {
      _id: `local-${Date.now()}`,
      userId: null,
      sender: 'user',
      message: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setDraftMessage('');

    const res = await supportAPI.postUserMessage(trimmed);
    if (res.success) {
      // Replace local optimistic with server-saved messages (user + auto-reply)
      const serverMessages = res.data?.data?.messages || [];
      setMessages(prev => {
        // Drop optimistic markers and merge server messages
        const withoutLocal = prev.filter(m => !String(m._id || m.id).startsWith('local-'));
        return [...withoutLocal, ...serverMessages];
      });
    }
  };

  return (
    <div className="founder-chat-root" role="complementary" aria-label="Founder chat">
      {isOpen ? (
        <section className="founder-chat-panel" aria-label="Support chat panel">
          <header className="founder-chat-header">
            <div className="founder-chat-title-wrap">
              <h3 className="founder-chat-title">Support Chat</h3>
              <MessageCircle size={16} className="founder-chat-title-icon" />
            </div>
            <button type="button" className="founder-chat-close" onClick={() => setIsOpen(false)} aria-label="Close support chat">
              <X size={18} />
            </button>
            <p className="founder-chat-subtitle">Hi, the founder here! How can I help?</p>
            <div className="founder-chat-links">
              <a href={FOUNDER_TELEGRAM_URL} target="_blank" rel="noreferrer">Telegram</a>
              <a href={FOUNDER_WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </header>

          <div className="founder-chat-body">
            {messages.map((m) => (
              <article key={m._id || m.id || `${m.sender}-${m.createdAt}`} className={`founder-chat-message ${m.sender === 'user' ? 'is-user' : 'is-founder'}`}>
                {m.sender !== 'user' && <FounderAvatar />}
                <p>{m.message || m.body}</p>
              </article>
            ))}
            <div ref={scrollAnchorRef} />
          </div>

          <form className="founder-chat-input-row" onSubmit={handleSendMessage}>
            <input ref={inputRef} type="text" value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} placeholder="Type your message..." aria-label="Type your message" />
            <button type="submit" aria-label="Send message"><Send size={16} /></button>
          </form>
        </section>
      ) : (
        <div className="founder-chat-collapsed" aria-label="Open founder chat">
          <button type="button" className="founder-chat-collapsed-input" onClick={() => setIsOpen(true)} onFocus={() => setIsOpen(true)} aria-label="Chat with founder">
            <span>Chat with founder</span>
            <Send size={16} />
          </button>
          <button type="button" className="founder-chat-avatar-button" onClick={() => setIsOpen(true)} aria-label="Open founder support chat">
            <FounderAvatar />
          </button>
        </div>
      )}
    </div>
  );
}

export default FounderChatWidget;
