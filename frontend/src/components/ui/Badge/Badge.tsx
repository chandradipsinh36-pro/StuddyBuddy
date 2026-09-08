import React from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'premium' | 'ai' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ variant = 'default', children, className = '', style }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`} style={style}>
      {children}
    </span>
  );
}
