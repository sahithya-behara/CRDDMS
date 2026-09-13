// context/RealtimeContext.jsx — Authentic Real-Time Synchronization Engine (SSE)
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import RealtimeToast from '../components/RealtimeToast';

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const { user, token } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('jntugv_live_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const listenersRef = useRef(new Map());
  const eventSourceRef = useRef(null);

  // Persist notifications
  useEffect(() => {
    try {
      localStorage.setItem('jntugv_live_notifications', JSON.stringify(notifications.slice(0, 30)));
    } catch {
      // ignore
    }
  }, [notifications]);

  // Subscribe to specific real-time event types
  const subscribe = useCallback((eventType, handler) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType).add(handler);

    return () => {
      const set = listenersRef.current.get(eventType);
      if (set) {
        set.delete(handler);
        if (set.size === 0) listenersRef.current.delete(eventType);
      }
    };
  }, []);

  const addToast = useCallback((toastData) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast = { id, ...toastData };

    setToasts((prev) => [newToast, ...prev].slice(0, 4));

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Handle incoming real-time SSE payloads
  const dispatchRealtimeEvent = useCallback((eventName, payload) => {
    // Notify all registered component listeners
    if (listenersRef.current.has(eventName)) {
      listenersRef.current.get(eventName).forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`Error in realtime subscriber for [${eventName}]:`, err);
        }
      });
    }

    // Determine visual toast and notification payload
    let toastConfig = null;
    let notifCategory = 'default';

    switch (eventName) {
      case 'DOCUMENT_CREATED':
        toastConfig = {
          title: 'Document Uploaded',
          message: payload.message || `New record: "${payload.title}"`,
          type: 'success',
          category: 'document',
        };
        notifCategory = 'document';
        break;

      case 'DOCUMENT_STATUS_CHANGED':
        toastConfig = {
          title: 'Workflow Status Updated',
          message: payload.message || `Document "${payload.title}" is now ${payload.status}`,
          type: payload.status === 'approved' ? 'success' : payload.status === 'rejected' ? 'error' : 'warning',
          category: 'approval',
        };
        notifCategory = 'approval';
        break;

      case 'DOCUMENT_DELETED':
        toastConfig = {
          title: 'Record Removed',
          message: payload.message || 'An institutional record was deleted.',
          type: 'warning',
          category: 'document',
        };
        break;

      case 'COMPLIANCE_UPDATED':
        toastConfig = {
          title: 'Compliance Log Updated',
          message: payload.message || 'Accreditation criteria record was modified.',
          type: 'info',
          category: 'compliance',
        };
        notifCategory = 'compliance';
        break;

      case 'USER_UPDATED':
        toastConfig = {
          title: 'Institutional Directory Updated',
          message: payload.message || 'User permissions or account status changed.',
          type: 'info',
          category: 'user',
        };
        break;

      default:
        if (payload.message) {
          toastConfig = {
            title: 'System Notice',
            message: payload.message,
            type: 'info',
            category: 'default',
          };
        }
        break;
    }

    if (toastConfig) {
      addToast(toastConfig);
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: toastConfig.title,
          text: toastConfig.message,
          time: 'Just now',
          category: notifCategory,
          read: false,
          color: toastConfig.type === 'success' ? '#16a34a' : toastConfig.type === 'error' ? '#dc2626' : '#0B3D91',
        },
        ...prev,
      ]);
    }
  }, [addToast]);

  // Connect to SSE stream whenever token is valid
  useEffect(() => {
    if (!token || !user) {
      setIsLive(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    // Determine backend API host
    const defaultBase = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000/api'
      : '/api';
    const apiBase = import.meta.env.VITE_API_URL || defaultBase;
    const sseUrl = `${apiBase.replace(/\/$/, '')}/realtime/stream?token=${encodeURIComponent(token)}`;

    let es = null;
    try {
      es = new EventSource(sseUrl, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsLive(true);
      };

      es.addEventListener('connected', () => {
        setIsLive(true);
      });

      const events = [
        'DOCUMENT_CREATED',
        'DOCUMENT_STATUS_CHANGED',
        'DOCUMENT_DELETED',
        'COMPLIANCE_UPDATED',
        'USER_UPDATED',
        'NOTIFICATION_NEW',
      ];

      events.forEach((evtName) => {
        es.addEventListener(evtName, (e) => {
          try {
            const data = JSON.parse(e.data);
            dispatchRealtimeEvent(evtName, data);
          } catch (parseErr) {
            console.error('Failed parsing realtime SSE event data:', parseErr);
          }
        });
      });

      es.onerror = () => {
        setIsLive(false);
      };
    } catch (err) {
      console.warn('EventSource initialization warning:', err.message);
      setIsLive(false);
    }

    return () => {
      if (es) {
        es.close();
        eventSourceRef.current = null;
      }
      setIsLive(false);
    };
  }, [token, user, dispatchRealtimeEvent]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <RealtimeContext.Provider
      value={{
        isLive,
        toasts,
        notifications,
        unreadCount,
        dismissToast,
        markAllAsRead,
        clearNotifications,
        subscribe,
      }}
    >
      {children}
      <RealtimeToast toasts={toasts} onDismiss={dismissToast} />
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return ctx;
}

/**
 * Convenient React hook to re-fetch or execute code on specific realtime events
 */
export function useRealtimeSubscription(eventNames, callback) {
  const { subscribe } = useRealtime();

  useEffect(() => {
    const list = Array.isArray(eventNames) ? eventNames : [eventNames];
    const unsubs = list.map((evt) => subscribe(evt, callback));

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [eventNames, callback, subscribe]);
}
