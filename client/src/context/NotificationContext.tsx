import React, { createContext, useState } from 'react';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type?: 'info' | 'success' | 'warning') => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const newNotif: Notification = {
      id: Math.random().toString(),
      message,
      type,
    };
    setNotifications((prev) => [...prev, newNotif]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
    }, 4000);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification }}>
      {children}
      {/* Toast Render Panel */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 w-80">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-3 rounded-xl border text-sm shadow-premium flex items-center justify-between transition-all duration-300 select-none animate-slide-in ${
              n.type === 'success' ? 'bg-accent-successBg border-accent-success/20 text-neutral-900' :
              n.type === 'warning' ? 'bg-accent-warningBg border-accent-warning/20 text-neutral-900' :
              'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <span className="font-medium">{n.message}</span>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

