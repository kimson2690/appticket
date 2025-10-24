import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  hideNotification: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

// Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider Props
interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
  defaultPosition?: Notification['position'];
}

// Provider Component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  defaultDuration = 4000,
  defaultPosition = 'top-right'
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate unique ID
  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Show notification
  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification: Notification = {
      id,
      duration: defaultDuration,
      position: defaultPosition,
      ...notification
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limit number of notifications
      return updated.slice(0, maxNotifications);
    });

    // Auto dismiss
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        hideNotification(id);
      }, newNotification.duration);
    }
  }, [defaultDuration, defaultPosition, maxNotifications]);

  // Hide notification
  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Shortcut methods
  const success = useCallback((title: string, message?: string, duration?: number) => {
    showNotification({ type: 'success', title, message, duration });
  }, [showNotification]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    showNotification({ type: 'error', title, message, duration });
  }, [showNotification]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    showNotification({ type: 'warning', title, message, duration });
  }, [showNotification]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    showNotification({ type: 'info', title, message, duration });
  }, [showNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        hideNotification,
        success,
        error,
        warning,
        info
      }}
    >
      {children}
      <NotificationContainer notifications={notifications} onDismiss={hideNotification} />
    </NotificationContext.Provider>
  );
};

// Hook
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// Notification Container Component
interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onDismiss }) => {
  // Group notifications by position
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const position = notification.position || 'top-right';
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <>
      {Object.entries(groupedNotifications).map(([position, notifs]) => (
        <div
          key={position}
          className={`fixed z-[100] flex flex-col gap-3 pointer-events-none ${getPositionClasses(position as Notification['position'])}`}
        >
          {notifs.map((notification) => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      ))}
    </>
  );
};

// Get position classes
const getPositionClasses = (position?: Notification['position']): string => {
  switch (position) {
    case 'top-left':
      return 'top-4 left-4';
    case 'top-center':
      return 'top-4 left-1/2 -translate-x-1/2';
    case 'top-right':
      return 'top-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    case 'bottom-center':
      return 'bottom-4 left-1/2 -translate-x-1/2';
    case 'bottom-right':
      return 'bottom-4 right-4';
    default:
      return 'top-4 right-4';
  }
};

// Notification Toast Component
interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
  const config = getNotificationConfig(notification.type);

  return (
    <div
      className={`
        pointer-events-auto w-96 max-w-full rounded-2xl border-2 p-4 shadow-2xl backdrop-blur-xl
        animate-slide-down transition-all duration-300
        ${config.bgColor} ${config.borderColor}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${config.iconBg}`}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold mb-1 ${config.titleColor}`}>
            {notification.title}
          </h3>
          {notification.message && (
            <p className={`text-sm ${config.messageColor}`}>
              {notification.message}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => onDismiss(notification.id)}
          className={`flex-shrink-0 p-1 rounded-lg transition-colors ${config.closeHover}`}
          aria-label="Fermer la notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Get notification config
const getNotificationConfig = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        bgColor: 'bg-green-50/95',
        borderColor: 'border-green-200',
        iconBg: 'bg-green-100',
        titleColor: 'text-green-900',
        messageColor: 'text-green-700',
        closeHover: 'hover:bg-green-100'
      };
    case 'error':
      return {
        icon: <XCircle className="w-5 h-5 text-red-600" />,
        bgColor: 'bg-red-50/95',
        borderColor: 'border-red-200',
        iconBg: 'bg-red-100',
        titleColor: 'text-red-900',
        messageColor: 'text-red-700',
        closeHover: 'hover:bg-red-100'
      };
    case 'warning':
      return {
        icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
        bgColor: 'bg-orange-50/95',
        borderColor: 'border-orange-200',
        iconBg: 'bg-orange-100',
        titleColor: 'text-orange-900',
        messageColor: 'text-orange-700',
        closeHover: 'hover:bg-orange-100'
      };
    case 'info':
      return {
        icon: <Info className="w-5 h-5 text-blue-600" />,
        bgColor: 'bg-blue-50/95',
        borderColor: 'border-blue-200',
        iconBg: 'bg-blue-100',
        titleColor: 'text-blue-900',
        messageColor: 'text-blue-700',
        closeHover: 'hover:bg-blue-100'
      };
  }
};
