import React from 'react';

interface AvatarProps {
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<string, { dimension: number; fontSize: number }> = {
  xs: { dimension: 24, fontSize: 11 },
  sm: { dimension: 32, fontSize: 13 },
  md: { dimension: 40, fontSize: 16 },
  lg: { dimension: 52, fontSize: 22 },
  xl: { dimension: 72, fontSize: 30 },
};

function getFirstChar(name?: string): string {
  const clean = (name || '').trim();
  return clean ? clean.charAt(0).toUpperCase() : 'U';
}

function getColorFromName(name?: string): string {
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
  const charCode = (name || 'U').trim().charCodeAt(0) || 65;
  return colors[charCode % colors.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  name = 'User',
  size = 'md',
  className = '',
  style = {},
}) => {
  const firstChar = getFirstChar(name);
  const bgColor = getColorFromName(name);

  let dimension = 40;
  let fontSize = 16;

  if (typeof size === 'number') {
    dimension = size;
    fontSize = Math.round(size * 0.45);
  } else if (SIZE_MAP[size]) {
    dimension = SIZE_MAP[size].dimension;
    fontSize = SIZE_MAP[size].fontSize;
  }

  return (
    <div
      className={className}
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        minHeight: dimension,
        borderRadius: '50%',
        backgroundColor: bgColor,
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize,
        lineHeight: 1,
        userSelect: 'none',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        flexShrink: 0,
        ...style,
      }}
      aria-label={name}
      title={name}
    >
      <span>{firstChar}</span>
    </div>
  );
};
