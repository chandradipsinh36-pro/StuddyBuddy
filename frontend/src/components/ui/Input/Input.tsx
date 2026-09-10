import React from 'react';
import { AlertCircle } from 'lucide-react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label, error, helper, leftIcon, rightIcon,
  className = '', id, ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label} htmlFor={inputId}>{label}</label>}
      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={`${styles.input} ${leftIcon ? styles.withLeft : ''} ${rightIcon ? styles.withRight : ''} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
          {...props}
        />
        {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </div>
      {error && (
        <p id={`${inputId}-error`} className={styles.error} role="alert">
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </p>
      )}
      {helper && !error && <p id={`${inputId}-helper`} className={styles.helper}>{helper}</p>}
    </div>
  );
});

Input.displayName = 'Input';
