import React from 'react';
import styles from './ResourceFormatBadge.module.css';

export type DetectedFormat = 'pdf' | 'image' | 'ppt' | 'video' | 'youtube' | 'audio' | 'test_paper' | 'default';

/**
 * Intelligent file type normalizer checking type string, filename, and URL.
 */
export function normalizeResourceType(rawType?: string, filenameOrUrl?: string): DetectedFormat {
  const t = (rawType || '').toLowerCase().trim();
  const f = (filenameOrUrl || '').toLowerCase().trim();

  if (t === 'pdf' || f.endsWith('.pdf')) return 'pdf';
  if (
    t === 'image' ||
    t === 'img' ||
    t === 'png' ||
    t === 'jpg' ||
    t === 'jpeg' ||
    t === 'webp' ||
    f.endsWith('.png') ||
    f.endsWith('.jpg') ||
    f.endsWith('.jpeg') ||
    f.endsWith('.webp') ||
    f.endsWith('.gif') ||
    f.endsWith('.svg')
  ) {
    return 'image';
  }
  if (t === 'ppt' || t === 'pptx' || t === 'presentation' || t === 'slides' || f.endsWith('.ppt') || f.endsWith('.pptx')) {
    return 'ppt';
  }
  if (t === 'youtube' || f.includes('youtube.com') || f.includes('youtu.be')) {
    return 'youtube';
  }
  if (t === 'video' || t === 'mp4' || f.endsWith('.mp4') || f.endsWith('.mov') || f.endsWith('.webm') || f.endsWith('.mkv')) {
    return 'video';
  }
  if (t === 'audio' || t === 'mp3' || t === 'podcast' || f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a')) {
    return 'audio';
  }
  if (t === 'test_paper' || t === 'test' || t === 'quiz' || t === 'exam') {
    return 'test_paper';
  }
  return 'pdf'; // Default resource type in StudyBuddy
}

// ── COLORFUL ICON SVGS ─────────────────────────────────────────────

export function PdfIcon({ size = 20, color = '#dc2626' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path
        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
        fill="#fee2e2"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2V8H20" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6.5" y="11.5" width="11" height="7" rx="1.5" fill={color} />
      <text x="12" y="16.5" fill="#ffffff" fontSize="4.6" fontWeight="bold" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle">
        PDF
      </text>
    </svg>
  );
}

export function ImageIcon({ size = 20, color = '#0284c7' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="18" height="18" rx="4" fill="#e0f2fe" stroke={color} strokeWidth="1.75" />
      <circle cx="8.5" cy="8.5" r="1.8" fill={color} />
      <path d="M21 15L16 10L6 20" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 17L17 14L21 17.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PptIcon({ size = 20, color = '#ea580c' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path
        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
        fill="#ffedd5"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2V8H20" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6.5" y="11.5" width="11" height="7" rx="1.5" fill={color} />
      <text x="12" y="16.5" fill="#ffffff" fontSize="4.6" fontWeight="bold" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle">
        PPT
      </text>
    </svg>
  );
}

export function VideoIcon({ size = 20, color = '#dc2626' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="3.5" fill="#fee2e2" stroke={color} strokeWidth="1.75" />
      <polygon points="10,8.5 16,12 10,15.5" fill={color} />
    </svg>
  );
}

export function AudioIcon({ size = 20, color = '#7c3aed' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="18" height="18" rx="4" fill="#ede9fe" stroke={color} strokeWidth="1.75" />
      <path d="M6 14C6 10.6863 8.68629 8 12 8C15.3137 8 18 10.6863 18 14" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
      <rect x="5" y="13" width="3" height="5" rx="1" fill={color} />
      <rect x="16" y="13" width="3" height="5" rx="1" fill={color} />
    </svg>
  );
}

export function TestPaperIcon({ size = 20, color = '#2563eb' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path
        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
        fill="#dbeafe"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2V8H20" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 14.5L10.5 16.5L15.5 11.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── FORMAT METADATA ────────────────────────────────────────────────

interface FormatConfig {
  label: string;
  badgeClass: string;
  thumbClass: string;
  renderIcon: (size: number) => React.ReactNode;
}

const FORMAT_CONFIG: Record<DetectedFormat, FormatConfig> = {
  pdf: {
    label: 'PDF',
    badgeClass: styles.themePdf,
    thumbClass: styles.thumbPdf,
    renderIcon: (size) => <PdfIcon size={size} color="#dc2626" />,
  },
  image: {
    label: 'IMAGE',
    badgeClass: styles.themeImage,
    thumbClass: styles.thumbImage,
    renderIcon: (size) => <ImageIcon size={size} color="#0284c7" />,
  },
  ppt: {
    label: 'PPT / SLIDES',
    badgeClass: styles.themePpt,
    thumbClass: styles.thumbPpt,
    renderIcon: (size) => <PptIcon size={size} color="#ea580c" />,
  },
  video: {
    label: 'VIDEO',
    badgeClass: styles.themeVideo,
    thumbClass: styles.thumbVideo,
    renderIcon: (size) => <VideoIcon size={size} color="#dc2626" />,
  },
  youtube: {
    label: 'YOUTUBE',
    badgeClass: styles.themeVideo,
    thumbClass: styles.thumbVideo,
    renderIcon: (size) => <VideoIcon size={size} color="#dc2626" />,
  },
  audio: {
    label: 'AUDIO',
    badgeClass: styles.themeAudio,
    thumbClass: styles.thumbAudio,
    renderIcon: (size) => <AudioIcon size={size} color="#7c3aed" />,
  },
  test_paper: {
    label: 'TEST PAPER',
    badgeClass: styles.themeTestPaper,
    thumbClass: styles.thumbTestPaper,
    renderIcon: (size) => <TestPaperIcon size={size} color="#2563eb" />,
  },
  default: {
    label: 'DOCUMENT',
    badgeClass: styles.themeDefault,
    thumbClass: styles.thumbDefault,
    renderIcon: (size) => <PdfIcon size={size} color="#475569" />,
  },
};

// ── EXPORTED COMPONENTS ────────────────────────────────────────────

interface ResourceFormatProps {
  type?: string;
  filename?: string;
  url?: string;
  size?: number;
  className?: string;
}

/**
 * 1. Plain colorful standalone icon (e.g. for pills, headers, lists)
 */
export function ResourceFormatIcon({ type, filename, url, size = 18 }: ResourceFormatProps) {
  const detected = normalizeResourceType(type, filename || url);
  const cfg = FORMAT_CONFIG[detected] || FORMAT_CONFIG.default;
  return <>{cfg.renderIcon(size)}</>;
}

/**
 * 2. Visual colorful thumbnail icon box (44x44) for table lists & cards
 */
export function ResourceThumbnailIcon({ type, filename, url, size = 26, className }: ResourceFormatProps) {
  const detected = normalizeResourceType(type, filename || url);
  const cfg = FORMAT_CONFIG[detected] || FORMAT_CONFIG.default;

  return (
    <div className={`${styles.thumbBox} ${cfg.thumbClass} ${className || ''}`} title={`Format: ${cfg.label}`}>
      {cfg.renderIcon(size)}
    </div>
  );
}

/**
 * 3. Eye-catching colorful pill badge for the "FORMAT" column in tables
 */
export function ResourceFormatBadge({ type, filename, url, size = 15, className }: ResourceFormatProps) {
  const detected = normalizeResourceType(type, filename || url);
  const cfg = FORMAT_CONFIG[detected] || FORMAT_CONFIG.default;

  return (
    <span className={`${styles.badge} ${cfg.badgeClass} ${className || ''}`}>
      {cfg.renderIcon(size)}
      <span>{cfg.label}</span>
    </span>
  );
}
