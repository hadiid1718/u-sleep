/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('adminToken') || localStorage.getItem('token'));

  useEffect(() => {
    const syncAuthToken = () => {
      setAuthToken(localStorage.getItem('adminToken') || localStorage.getItem('token'));
    };

    const handleStorage = event => {
      if (event.key === 'adminToken' || event.key === 'token') {
        syncAuthToken();
      }
    };

    window.addEventListener('auth-token-changed', syncAuthToken);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('auth-token-changed', syncAuthToken);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!authToken) {
      setSocket(null);
      setConnected(false);
      return undefined;
    }

    const newSocket = io(
      import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000',
      {
        auth: { token: authToken },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      }
    );

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('[Socket] Error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [authToken]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return ctx;
};

export default SocketContext;
