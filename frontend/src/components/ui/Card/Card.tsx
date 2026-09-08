import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ hover = false, padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`${styles.card} ${hover ? styles.hover : ''} ${styles[`padding_${padding}`]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
