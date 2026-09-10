export type VideoSourceType = 'youtube' | 'vimeo' | 'googledrive' | 'direct' | 'none';

export interface VideoInfo {
  type: VideoSourceType;
  embedUrl: string;
  originalUrl: string;
  videoId?: string;
  providerLabel: string;
}

/**
 * Parses any video URL string (YouTube, Vimeo, Google Drive, direct mp4/webm/etc.)
 * and extracts embed URLs and source metadata.
 */
export function parseVideoUrl(url?: string | null): VideoInfo {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return {
      type: 'none',
      embedUrl: '',
      originalUrl: '',
      providerLabel: 'No Video',
    };
  }

  const trimmed = url.trim();

  // 1. YouTube detection & extraction
  const ytMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?.*?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`,
      originalUrl: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
      videoId,
      providerLabel: 'YouTube',
    };
  }

  // 2. Vimeo detection & extraction
  const vimeoMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      originalUrl: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
      videoId,
      providerLabel: 'Vimeo',
    };
  }

  // 3. Google Drive preview link
  const gDriveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gDriveMatch && gDriveMatch[1]) {
    const videoId = gDriveMatch[1];
    return {
      type: 'googledrive',
      embedUrl: `https://drive.google.com/file/d/${videoId}/preview`,
      originalUrl: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
      videoId,
      providerLabel: 'Google Drive',
    };
  }

  // 4. Direct video file stream or other web URL
  let original = trimmed;
  if (trimmed.startsWith('/')) {
    original = `http://localhost:5000${trimmed}`;
  } else if (!trimmed.startsWith('http') && !trimmed.startsWith('blob:') && !trimmed.startsWith('data:')) {
    original = `https://${trimmed}`;
  }

  return {
    type: 'direct',
    embedUrl: original,
    originalUrl: original,
    providerLabel: 'Direct Video',
  };
}
