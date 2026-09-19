import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function getFirstChar(name: string): string {
  const clean = name.trim();
  return clean ? clean.charAt(0).toUpperCase() : 'U';
}

function getColorFromName(name: string): string {
  const colors = [
    '#2563EB', // Blue
    '#7C3AED', // Purple
    '#059669', // Emerald
    '#D97706', // Amber
    '#DC2626', // Red
    '#0891B2', // Cyan
    '#4F46E5', // Indigo
    '#DB2777', // Pink
  ];
  const charCode = (name.trim().charCodeAt(0) || 65);
  return colors[charCode % colors.length];
}

export function Avatar({ name = 'User', size = 'md', className = '' }: AvatarProps) {
  const firstChar = getFirstChar(name);
  const bgColor = getColorFromName(name);

  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${className}`}
      style={{ backgroundColor: bgColor }}
      aria-label={name}
      title={name}
    >
      <span className={styles.initials}>{firstChar}</span>
    </div>
  );
}

