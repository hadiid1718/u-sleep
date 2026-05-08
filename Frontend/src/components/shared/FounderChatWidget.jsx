import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import './FounderChatWidget.css';
import { supportAPI } from '../../services/supportService';
import { useSocket } from '../../context/SocketContext';
import { AppContext } from '../../context/Context';

const FOUNDER_TELEGRAM_URL = import.meta.env.VITE_FOUNDER_TELEGRAM_URL || 'https://t.me/';
const FOUNDER_WHATSAPP_URL = import.meta.env.VITE_FOUNDER_WHATSAPP_URL || 'https://wa.me/';

const FounderAvatar = () => (
  <div className="founder-avatar" aria-hidden="true">
    <span className="founder-avatar-mark">F</span>
  </div>
);

const makeProcessingMessage = () => ({
  _id: `processing-${Date.now()}`,
  sender: 'system',
  message: 'AI is thinking...',
  createdAt: new Date().toISOString(),
  _processing: true,
});

function FounderChatWidget() {
  const { user } = useContext(AppContext);
  const isLoggedIn = useMemo(() => Boolean(user && (user._id || user.id || user.email)), [user]);

  const [isOpen, setIsOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const inputRef = useRef(null);
  const scrollAnchorRef = useRef(null);
  const retentionTimerRef = useRef(null);
  const aiResponseTimeoutRef = useRef(null);
  const { socket } = useSocket();

  const sanitizeMessageText = useCallback((text) => {
    if (!text) return '';
    let t = String(text).replace(/data:image[^\s"']*/gi, '[image removed]');
    t = t.replace(/<img[^>]*>/gi, '');
    t = t.replace(/<[^>]+>/g, '');
    return t.trim();
  }, []);

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
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAnchorRef.current) {
      scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    scheduleExpiryFromMessages(messages);
    return clearRetentionTimer;
  }, [messages, isOpen, scheduleExpiryFromMessages, clearRetentionTimer]);

  useEffect(() => {
    if (!isOpen || !isLoggedIn) {
      return undefined;
    }

    let isMounted = true;
    const load = async () => {
      setIsLoadingHistory(true);
      setErrorMessage('');

      try {
        const res = await supportAPI.getUserChats();
        if (!isMounted) return;

        if (!res?.success) {
          throw new Error(res?.error?.message || 'Unable to load chat history.');
        }

        const raw = res.data?.data?.messages || [];
        setMessages(raw.map(m => ({ ...m, message: sanitizeMessageText(m.message || m.body || '') })));
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error?.message || 'Failed to load chat history.');
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    load();

    if (socket) {
      const onSystemReply = (data) => {
        // Clear the AI response timeout when reply arrives
        if (aiResponseTimeoutRef.current) {
          clearTimeout(aiResponseTimeoutRef.current);
          aiResponseTimeoutRef.current = null;
        }

        setMessages(prev => {
          const withoutProcessing = prev.filter(item => !item._processing);
          return [
            ...withoutProcessing,
            {
              _id: data.messageId || `socket-${Date.now()}`,
              sender: 'system',
              message: sanitizeMessageText(data.message),
              createdAt: data.timestamp || new Date().toISOString(),
            },
          ];
        });
        setIsSending(false);
        setErrorMessage('');
      };

      const onAiError = (data) => {
        // Clear the AI response timeout on error
        if (aiResponseTimeoutRef.current) {
          clearTimeout(aiResponseTimeoutRef.current);
          aiResponseTimeoutRef.current = null;
        }

        setMessages(prev => prev.filter(item => !item._processing));
        setIsSending(false);
        setErrorMessage(data?.message || 'AI response failed. Please try again.');
      };

      socket.on('support-chat:new-system-reply', onSystemReply);
      socket.on('support-chat:ai-error', onAiError);

      return () => {
        isMounted = false;
        socket.off('support-chat:new-system-reply', onSystemReply);
        socket.off('support-chat:ai-error', onAiError);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, isLoggedIn, sanitizeMessageText, socket]);

  const handlePaste = useCallback((event) => {
    const clipboardData = event.clipboardData || window.clipboardData;
    const items = clipboardData?.items || [];

    let hasFiles = false;
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].kind === 'file') {
        hasFiles = true;
        break;
      }
    }

    if (!hasFiles) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const textData = clipboardData?.getData?.('text/plain') || '';
    if (!textData || !inputRef.current) {
      return;
    }

    const currentValue = inputRef.current.value;
    const start = inputRef.current.selectionStart || currentValue.length;
    const end = inputRef.current.selectionEnd || currentValue.length;

    const nextValue = currentValue.slice(0, start) + textData + currentValue.slice(end);
    setDraftMessage(nextValue);
  }, []);

  const handleSendMessage = async (event) => {
    event?.preventDefault();

    const trimmed = sanitizeMessageText(draftMessage);
    if (!trimmed || isSending) return;

    setIsSending(true);
    setErrorMessage('');

    const localId = `local-${Date.now()}`;
    const optimistic = {
      _id: localId,
      sender: 'user',
      message: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimistic, makeProcessingMessage()]);
    setDraftMessage('');

    // Clear any existing AI response timeout
    if (aiResponseTimeoutRef.current) {
      clearTimeout(aiResponseTimeoutRef.current);
      aiResponseTimeoutRef.current = null;
    }

    // Set timeout for AI response (15 seconds) - if no response, clear processing message
    aiResponseTimeoutRef.current = setTimeout(() => {
      setMessages(prev => prev.filter(m => !m._processing));
      setIsSending(false);
      setErrorMessage('AI is taking longer than expected. Please try again.');
    }, 15000);

    try {
      const res = await supportAPI.postUserMessage(trimmed);
      
      if (!res?.success) {
        throw new Error(res?.error?.message || 'Unable to send message.');
      }

      const serverMessages = (res.data?.data?.messages || []).map(m => ({
        ...m,
        message: sanitizeMessageText(m.message || m.body || ''),
      }));

      if (serverMessages.length > 0) {
        // Clear the timeout since we got a response (or processing started)
        if (aiResponseTimeoutRef.current) {
          clearTimeout(aiResponseTimeoutRef.current);
          aiResponseTimeoutRef.current = null;
        }

        // If processing is ongoing (202 response), keep timeout for socket response
        if (res.status === 202 || res.data?.data?.processing) {
          aiResponseTimeoutRef.current = setTimeout(() => {
            setMessages(prev => prev.filter(m => !m._processing));
            setIsSending(false);
            setErrorMessage('AI response delayed. Please try again later.');
          }, 20000);
        } else {
          // Immediate response received, clear the timeout
          if (aiResponseTimeoutRef.current) {
            clearTimeout(aiResponseTimeoutRef.current);
            aiResponseTimeoutRef.current = null;
          }
        }

        setMessages(prev => {
          const filtered = prev.filter(m => m._id !== localId && !m._processing);
          return [...filtered, ...serverMessages];
        });
        setIsSending(false);
      }
    } catch (error) {
      // Clear the timeout on error
      if (aiResponseTimeoutRef.current) {
        clearTimeout(aiResponseTimeoutRef.current);
        aiResponseTimeoutRef.current = null;
      }

      setMessages(prev => prev.filter(m => m._id !== localId && !m._processing));
      setIsSending(false);
      setErrorMessage(error?.message || 'Failed to send message. Please retry.');
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="founder-chat-root" role="complementary" aria-label="Founder chat">
      {isOpen ? (
        <section className="founder-chat-panel" aria-label="Support chat panel">
          <header className="founder-chat-header">
            <div className="founder-chat-title-wrap">
              <h3 className="founder-chat-title">Chat with Founder AI</h3>
              <MessageCircle size={16} className="founder-chat-title-icon" />
            </div>
            <button type="button" className="founder-chat-close" onClick={() => setIsOpen(false)} aria-label="Close support chat">
              <X size={18} />
            </button>
            <p className="founder-chat-subtitle">Ask anything about the product, billing, or troubleshooting.</p>
            <div className="founder-chat-links">
              <a href={FOUNDER_TELEGRAM_URL} target="_blank" rel="noreferrer">Telegram</a>
              <a href={FOUNDER_WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </header>

          <div className="founder-chat-body">
            {isLoadingHistory && <article className="founder-chat-message is-founder"><p>Loading conversation...</p></article>}

            {messages.map((m) => (
              <article key={m._id || `${m.sender}-${m.createdAt}`} className={`founder-chat-message ${m.sender === 'user' ? 'is-user' : 'is-founder'}`}>
                {m.sender !== 'user' && <FounderAvatar />}
                <p>{m.message || m.body}</p>
              </article>
            ))}

            {errorMessage && (
              <article className="founder-chat-message is-founder">
                <FounderAvatar />
                <p>{errorMessage}</p>
              </article>
            )}

            <div ref={scrollAnchorRef} />
          </div>

          <form className="founder-chat-input-row" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              onPaste={handlePaste}
              placeholder={isSending ? 'Waiting for AI response...' : 'Type your message...'}
              aria-label="Type your message"
              disabled={isSending}
            />
            <button type="submit" aria-label="Send message" disabled={isSending || !draftMessage.trim()}>
              <Send size={16} />
            </button>
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
