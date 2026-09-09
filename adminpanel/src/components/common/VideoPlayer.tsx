import React, { useRef, useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  VideoOff,
  AlertTriangle,
  Tv,
} from 'lucide-react';
import { parseVideoUrl } from '../../utils/videoUtils';

const YoutubeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#EF4444' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

interface VideoPlayerProps {
  src?: string | null;
  title?: string;
  poster?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title = 'Mandatory 5-Minute Trial Video',
  poster,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [copied, setCopied] = useState(false);

  const videoInfo = useMemo(() => parseVideoUrl(src), [src]);

  const handleCopyLink = () => {
    if (!videoInfo.originalUrl) return;
    navigator.clipboard.writeText(videoInfo.originalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Direct HTML5 Video Handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setHasVideoError(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. EMPTY / NO VIDEO STATE
  if (videoInfo.type === 'none') {
    return (
      <div
        style={{
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          backgroundColor: '#0F172A',
          border: '1px solid var(--color-gray-800)',
          padding: 'var(--space-10) var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 'var(--space-3)',
          color: 'var(--color-gray-400)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-gray-400)',
          }}
        >
          <VideoOff size={28} />
        </div>
        <h4 style={{ color: '#F8FAFC', fontSize: 'var(--font-size-base)', fontWeight: 700, margin: 0 }}>
          No Trial Video Provided
        </h4>
        <p style={{ fontSize: 'var(--font-size-xs)', maxWidth: 420, margin: 0, color: 'var(--color-gray-400)' }}>
          The applicant has not submitted a trial video URL or file with this application.
        </p>
      </div>
    );
  }

  // 2. EMBEDDED PLATFORM VIDEO (YouTube / Vimeo / Google Drive)
  const isEmbedPlatform = ['youtube', 'vimeo', 'googledrive'].includes(videoInfo.type);

  if (isEmbedPlatform) {
    const badgeColor =
      videoInfo.type === 'youtube'
        ? '#EF4444'
        : videoInfo.type === 'vimeo'
        ? '#0EA5E9'
        : '#10B981';

    return (
      <div
        ref={containerRef}
        style={{
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          backgroundColor: '#0F172A',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-gray-800)',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-gray-700)',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
            {videoInfo.type === 'youtube' ? (
              <YoutubeIcon size={16} color="#EF4444" />
            ) : (
              <Tv size={16} color={badgeColor} style={{ flexShrink: 0 }} />
            )}
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                color: '#F8FAFC',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 320,
              }}
              title={title}
            >
              {title}
            </span>
            <span
              style={{
                backgroundColor: badgeColor,
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                flexShrink: 0,
              }}
            >
              {videoInfo.providerLabel}
            </span>
          </div>

          <a
            href={videoInfo.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 'var(--font-size-xs)',
              color: '#94A3B8',
              textDecoration: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <span>Open on {videoInfo.providerLabel}</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Responsive 16:9 Iframe Embed */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
          <iframe
            src={videoInfo.embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0,
            }}
          />
        </div>

        {/* Bottom Helper & Link Bar */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--color-gray-800)',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
            <span style={{ color: 'var(--color-gray-400)', whiteSpace: 'nowrap' }}>Submitted URL:</span>
            <span
              style={{
                color: '#38BDF8',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.72rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 280,
              }}
              title={videoInfo.originalUrl}
            >
              {videoInfo.originalUrl}
            </span>
            <button
              onClick={handleCopyLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'transparent',
                border: 'none',
                color: copied ? '#34D399' : 'var(--color-gray-400)',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: '0.7rem',
              }}
              title="Copy video link"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <span style={{ color: 'var(--color-gray-400)', fontSize: '0.72rem' }}>
            Use the player controls inside the video to adjust volume, speed, or quality.
          </span>
        </div>
      </div>
    );
  }

  // 3. DIRECT HTML5 VIDEO (MP4, WebM, Local File)
  return (
    <div
      ref={containerRef}
      style={{
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        backgroundColor: '#0F172A',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-gray-800)',
      }}
    >
      {/* Video Title Header */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: '#1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-gray-700)',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: hasVideoError ? 'var(--color-warning)' : 'var(--color-success)',
            }}
          />
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#F8FAFC', letterSpacing: '0.02em' }}>
            {title}
          </span>
          <span
            style={{
              backgroundColor: '#6366F1',
              color: '#fff',
              fontSize: '0.62rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
            }}
          >
            Direct Video
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          {videoInfo.originalUrl && (
            <a
              href={videoInfo.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: '#94A3B8',
                fontSize: 'var(--font-size-xs)',
                textDecoration: 'none',
              }}
              title="Open video in new tab"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      {/* Video Element */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
        <video
          ref={videoRef}
          src={videoInfo.embedUrl}
          poster={poster}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => setHasVideoError(true)}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
          preload="metadata"
        />

        {/* Video Load Error Overlay */}
        {hasVideoError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-6)',
              textAlign: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <AlertTriangle size={36} color="#F59E0B" />
            <h5 style={{ color: '#F8FAFC', margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>
              Unable to stream video directly in browser
            </h5>
            <p style={{ color: '#94A3B8', margin: 0, fontSize: 'var(--font-size-xs)', maxWidth: 360 }}>
              The video source may require external playback or direct link access.
            </p>
            {videoInfo.originalUrl && (
              <a
                href={videoInfo.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{ marginTop: 'var(--space-2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>Open Video in New Tab</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}

        {/* Big play button overlay when paused & no error */}
        {!isPlaying && !hasVideoError && (
          <button
            onClick={togglePlay}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(37, 99, 235, 0.9)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              cursor: 'pointer',
              border: 'none',
              transition: 'transform var(--transition-fast)',
            }}
            aria-label="Play video"
          >
            <Play size={28} style={{ marginLeft: 4 }} />
          </button>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: '#1E293B',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {/* Scrubber */}
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          style={{
            width: '100%',
            cursor: 'pointer',
            accentColor: 'var(--color-primary-500)',
          }}
          aria-label="Seek video time"
        />

        {/* Buttons Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              onClick={togglePlay}
              style={{ color: '#fff', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  setCurrentTime(0);
                }
              }}
              style={{ color: 'var(--color-gray-400)', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
              title="Restart"
              aria-label="Restart video"
            >
              <RotateCcw size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginLeft: 'var(--space-2)' }}>
              <button
                onClick={toggleMute}
                style={{ color: '#fff', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{ width: 60, accentColor: 'var(--color-primary-500)', cursor: 'pointer' }}
                aria-label="Adjust volume"
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <button
              onClick={toggleFullscreen}
              style={{ color: '#fff', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
              title="Fullscreen"
              aria-label="Toggle fullscreen"
            >
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
