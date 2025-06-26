import type React from 'react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  enabled: boolean;
}

const NotificationItem: React.FC<{
  notification: Notification;
  onRemove: (id: string) => void;
  index: number;
}> = ({ notification, onRemove, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(notification.id), 200);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-400/30 bg-green-500/20';
      case 'warning':
        return 'border-yellow-400/30 bg-yellow-500/20';
      case 'error':
        return 'border-red-400/30 bg-red-500/20';
      default:
        return 'border-blue-400/30 bg-blue-500/20';
    }
  };

  const getProgressColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-400';
      case 'warning':
        return 'bg-yellow-400';
      case 'error':
        return 'bg-red-400';
      default:
        return 'bg-blue-400';
    }
  };

  return (
    <div
      className={`
        notification backdrop-blur border rounded-lg p-4 mb-3 cursor-pointer group
        transition-all duration-300 hover:scale-102 hover:bg-white/10
        ${getColorClasses()}
        ${isVisible && !isLeaving ? 'show translate-x-0' : 'translate-x-full'}
        ${isLeaving ? 'opacity-0 scale-95' : ''}
      `}
      onClick={handleRemove}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRemove();
        }
      }}
      aria-label="Dismiss notification"
    >
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-lg overflow-hidden">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-5000 ease-linear`}
          style={{
            width: isVisible ? '0%' : '100%',
            transition: isVisible ? 'width 5s linear' : 'none',
          }}
        />
      </div>

      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="text-xl group-hover:scale-110 transition-transform duration-200 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-white font-semibold text-sm truncate">{notification.title}</h4>
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors ml-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Close notification</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>

          <p className="text-white/80 text-sm leading-relaxed mb-2">{notification.message}</p>

          <div className="text-white/50 text-xs">{notification.timestamp.toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
};

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onRemove,
  enabled,
}) => {
  if (!enabled) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full pointer-events-none">
      <div className="pointer-events-auto">
        {notifications.map((notification, index) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={onRemove}
            index={index}
          />
        ))}
      </div>

      {/* Global notification indicator */}
      {notifications.length > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
          {notifications.length}
        </div>
      )}
    </div>
  );
};
