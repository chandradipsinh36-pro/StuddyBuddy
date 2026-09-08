import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export function Avatar({ src, name = 'User', size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${className}`}
      style={!src ? { background: getColorFromName(name) } : undefined}
    >
      {src
        ? <img src={src} alt={name} className={styles.img} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        : <span className={styles.initials}>{getInitials(name)}</span>
      }
    </div>
  );
}
