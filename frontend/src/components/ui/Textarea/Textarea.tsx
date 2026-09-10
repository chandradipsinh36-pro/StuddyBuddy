import React from 'react';
import { AlertCircle } from 'lucide-react';
import styles from '../Input/Input.module.css';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helper, id, className = '', ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2)}`;
    return (
      <div className={styles.wrapper}>
        {label && <label className={styles.label} htmlFor={textareaId}>{label}</label>}
        <div className={error ? styles.hasError : ''}>
          <textarea
            ref={ref}
            id={textareaId}
            className={`${styles.input} ${styles.textarea} ${className}`}
            aria-invalid={!!error}
            {...props}
          />
        </div>
        {error && (
          <p className={styles.error} role="alert">
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </p>
        )}
        {helper && !error && <p className={styles.helper}>{helper}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
