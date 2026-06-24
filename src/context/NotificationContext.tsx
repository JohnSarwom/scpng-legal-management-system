import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { notificationService } from '@/services';
import type { Notification, NotificationEntityType, NotificationType } from '@/types';

export interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  push: (payload: {
    recipientId: string;
    type: NotificationType;
    title: string;
    body: string;
    entityType: NotificationEntityType;
    entityId: string;
    linkTo: string;
  }) => void;
  refresh: () => void;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const load = useCallback(async () => {
    const data = await notificationService.getForUser(userIdRef.current);
    setNotifications(data);
  }, []);

  // Reload whenever the logged-in user switches
  useEffect(() => { void load(); }, [load, userId]);

  const markRead = useCallback(async (id: string) => {
    await notificationService.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead(userIdRef.current);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const push = useCallback((payload: Parameters<NotificationContextValue['push']>[0]) => {
    notificationService.push(payload);
    void load();
  }, [load]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, push, refresh: load }}>
      {children}
    </NotificationContext.Provider>
  );
}
