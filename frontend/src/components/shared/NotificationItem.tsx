import { BookOpen, Users, ShoppingBag, Bot, Bell } from 'lucide-react';
import type { Notification } from '../../types';
import styles from './NotificationItem.module.css';

interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'new_resource':
        return <BookOpen size={16} />;
      case 'group_activity':
        return <Users size={16} />;
      case 'purchase':
        return <ShoppingBag size={16} />;
      case 'ai_usage':
        return <Bot size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const getIconClass = () => {
    switch (notification.type) {
      case 'new_resource': return styles.icon_new_resource;
      case 'group_activity': return styles.icon_group_activity;
      case 'purchase': return styles.icon_purchase;
      case 'ai_usage': return styles.icon_ai_usage;
      default: return styles.icon_default;
    }
  };

  const timeAgo = () => {
    const diff = Date.now() - new Date(notification.createdAt).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div
      className={`${styles.item} ${!notification.isRead ? styles.unread : ''}`}
      onClick={() => onClick?.(notification)}
      role="button"
      tabIndex={0}
    >
      <div className={`${styles.iconWrapper} ${getIconClass()}`}>
        {getIcon()}
      </div>

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{notification.title}</span>
          <span className={styles.time}>{timeAgo()}</span>
        </div>
        <p className={styles.message}>{notification.message}</p>
      </div>

      {!notification.isRead && <span className={styles.unreadDot} />}
    </div>
  );
}
