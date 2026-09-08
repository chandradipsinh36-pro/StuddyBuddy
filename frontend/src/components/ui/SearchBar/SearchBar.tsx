import { Search } from 'lucide-react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SearchBar({ value, onChange, placeholder = 'Search...', className = '', size = 'md' }: SearchBarProps) {
  return (
    <div className={`${styles.wrapper} ${styles[size]} ${className}`}>
      <Search className={styles.icon} size={size === 'lg' ? 20 : 16} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
        aria-label={placeholder}
      />
    </div>
  );
}
