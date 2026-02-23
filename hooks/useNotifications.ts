import { useState, useEffect } from 'react';
import { Notification } from '../notificationTypes';
import { streamNotifications } from '../services/db.notifications';

export const useNotifications = (userId: string | undefined) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    const unsub = streamNotifications(userId, (data) => setNotifications(data));
    return () => unsub();
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isOpen,
    setIsOpen,
    toggle: () => setIsOpen(!isOpen)
  };
};
