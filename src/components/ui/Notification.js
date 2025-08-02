import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Notification = ({ 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose,
  show = true 
}) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  const typeStyles = {
    success: {
      bg: 'bg-green-500/20 border-green-400/30',
      text: 'text-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-400'
    },
    error: {
      bg: 'bg-red-500/20 border-red-400/30',
      text: 'text-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-400'
    },
    info: {
      bg: 'bg-blue-500/20 border-blue-400/30',
      text: 'text-blue-200',
      icon: Info,
      iconColor: 'text-blue-400'
    }
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`${style.bg} backdrop-blur-sm rounded-lg border p-4 shadow-lg`}>
        <div className="flex items-start space-x-3">
          <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={`font-medium ${style.text} mb-1`}>{title}</h4>
            )}
            <p className={`text-sm ${style.text}`}>{message}</p>
          </div>
          <button
            onClick={handleClose}
            className={`${style.text} hover:opacity-70 transition-opacity flex-shrink-0`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Notification Context for global notifications
import { createContext, useContext, useReducer, useCallback } from 'react';

const NotificationContext = createContext();

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return [...state, { ...action.payload, id: Date.now() }];
    case 'REMOVE_NOTIFICATION':
      return state.filter(notification => notification.id !== action.payload);
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, dispatch] = useReducer(notificationReducer, []);

  const addNotification = useCallback((notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, []);

  const removeNotification = useCallback((id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const showSuccess = useCallback((message, title) => {
    addNotification({ type: 'success', message, title });
  }, [addNotification]);

  const showError = useCallback((message, title) => {
    addNotification({ type: 'error', message, title });
  }, [addNotification]);

  const showInfo = useCallback((message, title) => {
    addNotification({ type: 'info', message, title });
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      showSuccess,
      showError,
      showInfo
    }}>
      {children}
      {/* Render notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default Notification;
