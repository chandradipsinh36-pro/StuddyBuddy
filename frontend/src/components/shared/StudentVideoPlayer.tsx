import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Sliders,
  Gauge,
  Check,
  Shield,
  Loader2,
} from 'lucide-react';
import { parseVideoUrl } from '../../utils/videoUtils';
import { loadYouTubeIframeApi } from '../../utils/youtubeApi';
import styles from './StudentVideoPlayer.module.css';

export interface StudentVideoPlayerProps {
  videoUrl?: string | null;
  title?: string;
  autoPlay?: boolean;
  onPlay?: () => void;
  onEnded?: () => void;
  onProgress?: (data: { currentTime: number; duration: number; percent: number }) => void;
  className?: string;
  isStudentSide?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

const QUALITY_OPTIONS = [
  { label: 'Auto (Recommended)', ytCode: 'default', badge: 'Auto' },
  { label: '1080p HD', ytCode: 'hd1080', badge: '1080p' },
  { label: '720p HD', ytCode: 'hd720', badge: '720p' },
  { label: '480p', ytCode: 'large', badge: '480p' },
  { label: '360p', ytCode: 'medium', badge: '360p' },
  { label: '240p', ytCode: 'small', badge: '240p' },
];

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const StudentVideoPlayer: React.FC<StudentVideoPlayerProps> = ({
  videoUrl,
  title,
  autoPlay = false,
  onPlay,
  onEnded,
  onProgress,
  className = '',
  isStudentSide = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ytSlotRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const hideControlsTimerRef = useRef<number | null>(null);
  const progressPollRef = useRef<number | null>(null);
  const clickTimeoutRef = useRef<number | null>(null);

  const videoInfo = parseVideoUrl(videoUrl);
  const isYouTube = videoInfo.type === 'youtube' && Boolean(videoInfo.videoId);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeQuality, setActiveQuality] = useState(QUALITY_OPTIONS[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Menus and hover tooltips
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [centerIcon, setCenterIcon] = useState<'play' | 'pause' | 'rw' | 'ff' | null>(null);

  // Keep a stable ref for callbacks
  const onPlayRef = useRef(onPlay);
  onPlayRef.current = onPlay;
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  // Trigger brief center indicator animation
  const triggerCenterIndicator = (type: 'play' | 'pause' | 'rw' | 'ff') => {
    setCenterIcon(type);
    window.setTimeout(() => setCenterIcon(null), 700);
  };

  // Auto-hide controls management
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying && !speedMenuOpen && !qualityMenuOpen) {
      hideControlsTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, [isPlaying, speedMenuOpen, qualityMenuOpen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 1. YouTube Player Initializer
  useEffect(() => {
    if (!isYouTube || !videoInfo.videoId) return;

    let destroyed = false;

    loadYouTubeIframeApi().then((YT) => {
      if (destroyed || !ytSlotRef.current) return;

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
      }

      // Create new player
      ytPlayerRef.current = new YT.Player(ytSlotRef.current, {
        videoId: videoInfo.videoId,
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          controls: 0,          // HIDES ALL DEFAULT YOUTUBE CONTROLS
          rel: 0,               // NO UNRELATED RECOMMENDATIONS
          modestbranding: 1,    // MINIMAL BRANDING
          showinfo: 0,          // NO TITLE/INFO OVERLAY
          iv_load_policy: 3,    // NO ANNOTATIONS
          disablekb: 1,         // NO YOUTUBE KEYBOARD CONFLICTS
          fs: 0,                // NO YOUTUBE FULLSCREEN BUTTON
          playsinline: 1,       // INLINE PLAYBACK
          enablejsapi: 1,       // JAVASCRIPT API ENABLED
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            if (destroyed) return;
            const dur = event.target.getDuration();
            if (dur && !isNaN(dur)) setDuration(dur);
            event.target.setVolume(volume);
            if (isMuted) event.target.mute();
            if (playbackSpeed !== 1) event.target.setPlaybackRate(playbackSpeed);
          },
          onStateChange: (event: any) => {
            if (destroyed) return;
            const state = event.data;
            if (state === 1) { // PLAYING
              setIsPlaying(true);
              setIsBuffering(false);
              setIsEnded(false);
              onPlayRef.current?.();
            } else if (state === 2) { // PAUSED
              setIsPlaying(false);
              setIsBuffering(false);
            } else if (state === 3) { // BUFFERING
              setIsBuffering(true);
            } else if (state === 0) { // ENDED
              setIsPlaying(false);
              setIsBuffering(false);
              setIsEnded(true);
              onEndedRef.current?.();
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
        ytPlayerRef.current = null;
      }
    };
  }, [videoInfo.videoId, isYouTube, autoPlay]);

  // 2. Polling progress for YouTube
  useEffect(() => {
    if (!isYouTube) return;

    if (isPlaying) {
      progressPollRef.current = window.setInterval(() => {
        if (!ytPlayerRef.current) return;
        try {
          const curr = ytPlayerRef.current.getCurrentTime() || 0;
          const dur = ytPlayerRef.current.getDuration() || duration;
          const frac = ytPlayerRef.current.getVideoLoadedFraction ? ytPlayerRef.current.getVideoLoadedFraction() : 0;

          setCurrentTime(curr);
          if (dur > 0) setDuration(dur);
          setBufferedPercent(frac * 100);

          if (dur > 0) {
            onProgressRef.current?.({
              currentTime: curr,
              duration: dur,
              percent: (curr / dur) * 100,
            });
          }
        } catch {
          // ignore transient postMessage errors
        }
      }, 250);
    } else {
      if (progressPollRef.current) {
        window.clearInterval(progressPollRef.current);
        progressPollRef.current = null;
      }
    }

    return () => {
      if (progressPollRef.current) {
        window.clearInterval(progressPollRef.current);
        progressPollRef.current = null;
      }
    };
  }, [isPlaying, isYouTube, duration]);

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    setIsEnded(false);
    if (isYouTube && ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
        triggerCenterIndicator('pause');
      } else {
        ytPlayerRef.current.playVideo();
        triggerCenterIndicator('play');
      }
    } else if (videoElementRef.current) {
      if (isPlaying) {
        videoElementRef.current.pause();
        triggerCenterIndicator('pause');
      } else {
        videoElementRef.current.play();
        triggerCenterIndicator('play');
      }
    }
  };

  // Seek to specific time (seconds)
  const handleSeek = (timeSec: number) => {
    const clamped = Math.max(0, Math.min(duration || 1, timeSec));
    setCurrentTime(clamped);
    setIsEnded(false);

    if (isYouTube && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(clamped, true);
    } else if (videoElementRef.current) {
      videoElementRef.current.currentTime = clamped;
    }
  };

  // Rewind / Fast Forward (10s)
  const handleRewind = (seconds = 10) => {
    handleSeek(currentTime - seconds);
    triggerCenterIndicator('rw');
  };

  const handleForward = (seconds = 10) => {
    handleSeek(currentTime + seconds);
    triggerCenterIndicator('ff');
  };

  // Change Volume
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    const muted = newVol === 0;
    setIsMuted(muted);

    if (isYouTube && ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(newVol);
      if (muted) ytPlayerRef.current.mute();
      else ytPlayerRef.current.unMute();
    } else if (videoElementRef.current) {
      videoElementRef.current.volume = newVol / 100;
      videoElementRef.current.muted = muted;
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (isYouTube && ytPlayerRef.current) {
      if (nextMuted) ytPlayerRef.current.mute();
      else {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume > 0 ? volume : 50);
      }
    } else if (videoElementRef.current) {
      videoElementRef.current.muted = nextMuted;
      if (!nextMuted && volume === 0) {
        setVolume(50);
        videoElementRef.current.volume = 0.5;
      }
    }
  };

  // Change Playback Speed (including 2x, 3x)
  const handleSpeedSelect = (speed: number) => {
    setPlaybackSpeed(speed);
    setSpeedMenuOpen(false);

    if (isYouTube && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setPlaybackRate(speed);
      } catch {
        // ignore
      }
    } else if (videoElementRef.current) {
      videoElementRef.current.playbackRate = speed;
    }
  };

  // Change Video Quality
  const handleQualitySelect = (option: typeof QUALITY_OPTIONS[0]) => {
    setActiveQuality(option);
    setQualityMenuOpen(false);

    if (isYouTube && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setPlaybackQuality(option.ytCode);
      } catch {
        // ignore
      }
    }
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Scrubber click and drag handling
  const calculateScrubTime = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!progressTrackRef.current) return 0;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return pos * duration;
  };

  const handleScrubberMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const newTime = calculateScrubTime(e);
    handleSeek(newTime);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const movedTime = calculateScrubTime(moveEvent);
      handleSeek(movedTime);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressTrackRef.current || duration <= 0) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setHoverTime(pos * duration);
    setHoverX(clientX - rect.left);
  };

  const handleScrubberMouseLeave = () => {
    setHoverTime(null);
    setHoverX(null);
  };

  // Single Click vs Double Click on surface
  const handleSurfaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftHalf = clickX < rect.width * 0.4;
    const isRightHalf = clickX > rect.width * 0.6;

    if (clickTimeoutRef.current) {
      // Double click detected!
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      if (isLeftHalf) {
        handleRewind(10);
      } else if (isRightHalf) {
        handleForward(10);
      } else {
        handleToggleFullscreen();
      }
    } else {
      // Wait for single click
      clickTimeoutRef.current = window.setTimeout(() => {
        handleTogglePlay();
        clickTimeoutRef.current = null;
      }, 250);
    }
  };

  // Keyboard controls
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      handleTogglePlay();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleRewind(5);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleForward(5);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleVolumeChange(Math.min(100, volume + 5));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleVolumeChange(Math.max(0, volume - 5));
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      handleToggleMute();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      handleToggleFullscreen();
    }
  };

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`${styles.playerContainer} ${className}`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onContextMenu={(e) => {
        // Prevent context menu to protect URLs and hide YouTube inspect menu
        if (isStudentSide) e.preventDefault();
      }}
    >
      {/* 1. Video Viewport */}
      <div className={styles.videoViewport}>
        {isYouTube ? (
          <div className={styles.youtubeIframeWrapper}>
            <div ref={ytSlotRef} />
          </div>
        ) : (
          <video
            ref={videoElementRef}
            src={videoInfo.embedUrl || videoUrl || ''}
            className={styles.directVideo}
            playsInline
            onPlay={() => {
              setIsPlaying(true);
              setIsEnded(false);
              onPlayRef.current?.();
            }}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setIsEnded(true);
              onEndedRef.current?.();
            }}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onLoadedMetadata={(e) => {
              const dur = e.currentTarget.duration;
              if (dur && !isNaN(dur)) setDuration(dur);
            }}
            onTimeUpdate={(e) => {
              const curr = e.currentTarget.currentTime;
              const dur = e.currentTarget.duration || duration;
              setCurrentTime(curr);
              if (dur > 0) {
                onProgressRef.current?.({
                  currentTime: curr,
                  duration: dur,
                  percent: (curr / dur) * 100,
                });
              }
            }}
            onProgress={(e) => {
              const target = e.currentTarget;
              if (target.buffered.length > 0 && target.duration > 0) {
                const end = target.buffered.end(target.buffered.length - 1);
                setBufferedPercent((end / target.duration) * 100);
              }
            }}
          />
        )}
      </div>

      {/* 2. Top Header Shield (covers top YouTube title & avatar) */}
      <div className={`${styles.topBar} ${!showControls && isPlaying ? styles.hidden : ''}`}>
        <div className={styles.videoTitle} title={title}>
          {title || 'Lecture Video'}
        </div>
      </div>

      {/* 3. Transparent Click Surface */}
      <div
        className={styles.clickSurface}
        onClick={handleSurfaceClick}
        title="Click to play/pause, double click left/right to seek"
      />

      {/* 4. Center Action Feedback & Spinner */}
      {centerIcon && (
        <div className={styles.centerIndicator}>
          {centerIcon === 'play' && <Play size={32} fill="#FFFFFF" />}
          {centerIcon === 'pause' && <Pause size={32} fill="#FFFFFF" />}
          {centerIcon === 'rw' && <RotateCcw size={30} />}
          {centerIcon === 'ff' && <RotateCw size={30} />}
        </div>
      )}

      {isBuffering && (
        <div className={styles.bufferingIndicator}>
          <Loader2 size={44} />
        </div>
      )}

      {/* 5. Replay Overlay on Completion (prevents YouTube endscreen wall) */}
      {isEnded && (
        <div className={styles.endedOverlay}>
          <div className={styles.endedTitle}>Lecture Completed 🎉</div>
          <p className={styles.endedSubtitle}>
            Great job! You've finished this lecture. Review again or proceed to the next topic.
          </p>
          <button
            type="button"
            className={styles.replayButton}
            onClick={() => {
              handleSeek(0);
              handleTogglePlay();
            }}
          >
            <RotateCcw size={16} />
            <span>Replay Lecture</span>
          </button>
        </div>
      )}

      {/* 6. Bottom Controls */}
      <div
        className={`${styles.bottomControls} ${!showControls && isPlaying ? styles.hidden : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar / Scrubber */}
        <div
          ref={progressTrackRef}
          className={styles.progressContainer}
          onMouseDown={handleScrubberMouseDown}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={handleScrubberMouseLeave}
        >
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBuffered}
              style={{ width: `${Math.min(100, bufferedPercent)}%` }}
            />
            <div
              className={styles.progressPlayed}
              style={{ width: `${Math.min(100, playedPercent)}%` }}
            />
            <div
              className={styles.progressThumb}
              style={{ left: `${Math.min(100, playedPercent)}%` }}
            />
          </div>

          {/* Hover Time Tooltip */}
          {hoverTime !== null && hoverX !== null && (
            <div
              className={styles.progressTooltip}
              style={{ left: `${hoverX}px` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Buttons Row */}
        <div className={styles.controlsRow}>
          {/* Left Controls */}
          <div className={styles.controlsLeft}>
            {/* Play / Pause */}
            <button
              type="button"
              className={`${styles.iconButton} ${styles.playPauseButton}`}
              onClick={handleTogglePlay}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause size={18} fill="#FFFFFF" /> : <Play size={18} fill="#FFFFFF" style={{ marginLeft: 2 }} />}
            </button>

            {/* Rewind 10s */}
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => handleRewind(10)}
              title="Rewind 10 seconds (←)"
            >
              <RotateCcw size={16} />
            </button>

            {/* Fast Forward 10s */}
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => handleForward(10)}
              title="Forward 10 seconds (→)"
            >
              <RotateCw size={16} />
            </button>

            {/* Volume & Mute */}
            <div className={styles.volumeWrapper}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={handleToggleMute}
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={17} color="#EF4444" />
                ) : volume < 50 ? (
                  <Volume1 size={17} />
                ) : (
                  <Volume2 size={17} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className={styles.volumeSlider}
                title={`Volume: ${isMuted ? 0 : volume}%`}
              />
            </div>

            {/* Timestamp */}
            <div className={styles.timeDisplay}>
              <span className={styles.timeCurrent}>{formatTime(currentTime)}</span>
              <span className={styles.timeTotal}> / {formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className={styles.controlsRight}>
            {/* Speed Selector (0.5x, 1x, 2x, 3x) */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`${styles.badgeButton} ${playbackSpeed !== 1 ? styles.badgeButtonActive : ''}`}
                onClick={() => {
                  setSpeedMenuOpen((prev) => !prev);
                  setQualityMenuOpen(false);
                }}
                title="Playback Speed (2x, 3x)"
              >
                <Gauge size={13} />
                <span>{playbackSpeed}x</span>
              </button>

              {speedMenuOpen && (
                <div className={styles.menuPopover}>
                  <div className={styles.menuHeader}>Playback Speed</div>
                  {SPEED_OPTIONS.map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      className={`${styles.menuItem} ${playbackSpeed === spd ? styles.menuItemActive : ''}`}
                      onClick={() => handleSpeedSelect(spd)}
                    >
                      <span>{spd === 1 ? '1x (Normal)' : `${spd}x`}</span>
                      {playbackSpeed === spd && <Check size={13} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Video Quality Selector */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`${styles.badgeButton} ${activeQuality.badge !== 'Auto' ? styles.badgeButtonActive : ''}`}
                onClick={() => {
                  setQualityMenuOpen((prev) => !prev);
                  setSpeedMenuOpen(false);
                }}
                title="Video Quality"
              >
                <Sliders size={13} />
                <span>{activeQuality.badge}</span>
              </button>

              {qualityMenuOpen && (
                <div className={styles.menuPopover}>
                  <div className={styles.menuHeader}>Quality</div>
                  {QUALITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.ytCode}
                      type="button"
                      className={`${styles.menuItem} ${activeQuality.ytCode === opt.ytCode ? styles.menuItemActive : ''}`}
                      onClick={() => handleQualitySelect(opt)}
                    >
                      <span>{opt.label}</span>
                      {activeQuality.ytCode === opt.ytCode && <Check size={13} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleToggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StudentVideoPlayer;
