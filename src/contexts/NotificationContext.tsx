import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationService, NotificationDoc } from '../services/NotificationService';
import { useAuth } from '../auth/context/AuthContext';

export interface NotificationContextType {
  notifications: NotificationDoc[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendNotification: (notif: Partial<NotificationDoc>) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id || '';
  const companyId = user?.companyId || user?.empresaId || user?.tenantId || '';

  const refreshNotifications = async () => {
    if (!userId || !companyId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await NotificationService.listForUser(userId, companyId);
      setNotifications(list);
    } catch (err) {
      console.warn('Erro ao carregar notificações no NotificationProvider:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshNotifications();
  }, [userId, companyId]);

  const markAsRead = async (id: string) => {
    await NotificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => NotificationService.markAsRead(n.id)));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const sendNotification = async (notifData: Partial<NotificationDoc>) => {
    if (!companyId) throw new Error('Não foi possível identificar a empresa do usuário.');
    const created = await NotificationService.create({
      ...notifData,
      companyId
    });
    setNotifications(prev => [created, ...prev]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        sendNotification,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
};
