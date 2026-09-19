import React, { useEffect, useState, useRef } from 'react';
import { X, Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCcw, FileText, Info, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface DocumentViewerModalProps {
  isOpen: boolean;
  url: string | null;
  title?: string;
  onClose: () => void;
}

function isCloudinaryUrl(u: string): boolean {
  return /res\.cloudinary\.com/i.test(u);
}

function getCloudinaryPageImageUrl(u: string, page: number): string {
  // Replace .pdf (and optional query string) with .jpg
  const withoutPdf = u.replace(/\.pdf(\?.*)?$/i, '.jpg$1');
  const transform = `pg_${page},w_1600,c_limit,q_auto,f_auto`;
  if (withoutPdf.includes('/image/upload/')) {
    return withoutPdf.replace('/image/upload/', `/image/upload/${transform}/`);
  }
  if (withoutPdf.includes('/upload/')) {
    return withoutPdf.replace('/upload/', `/upload/${transform}/`);
  }
  return withoutPdf;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  url,
  title = 'View-Only Document',
  onClose,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Viewer modes: 'native' (PDF object/iframe), 'pages' (Cloudinary multi-page images), 'error'
  const [viewerMode, setViewerMode] = useState<'native' | 'pages' | 'error'>('native');
  const [pages, setPages] = useState<string[]>([]);
  const [isProbingComplete, setIsProbingComplete] = useState(false);
  const [zoom, setZoom] = useState<number>(100);
  const [showTip, setShowTip] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !url) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setError(null);
      setLoading(false);
      setPages([]);
      setViewerMode('native');
      setZoom(100);
      return;
    }

    let isMounted = true;
    let createdUrl: string | null = null;
    setLoading(true);
    setError(null);
    setPages([]);
    setIsProbingComplete(false);

    const token = localStorage.getItem('sb_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const startPageMode = () => {
      if (!isMounted) return;
      setViewerMode('pages');
      const firstPage = getCloudinaryPageImageUrl(url, 1);
      setPages([firstPage]);
      setLoading(false);

      // Progressively probe subsequent pages
      const probePage = (pageIndex: number) => {
        if (!isMounted) return;
        if (pageIndex > 50) {
          setIsProbingComplete(true);
          return;
        }
        const nextUrl = getCloudinaryPageImageUrl(url, pageIndex);
        const testImg = new Image();
        testImg.src = nextUrl;
        testImg.onload = () => {
          if (!isMounted) return;
          setPages((prev) => (prev.includes(nextUrl) ? prev : [...prev, nextUrl]));
          probePage(pageIndex + 1);
        };
        testImg.onerror = () => {
          if (!isMounted) return;
          setIsProbingComplete(true);
        };
      };

      probePage(2);
    };

    fetch(url, { headers })
      .then(async (response) => {
        if (!isMounted) return;

        // If Cloudinary returned 401/ACL failure, seamlessly fall back to Cloudinary high-res page rendering
        if (!response.ok) {
          if (isCloudinaryUrl(url)) {
            console.info('Direct PDF access restricted by Cloudinary ACL. Switching to high-res page viewer.');
            startPageMode();
            return;
          }
          throw new Error(`Failed to load document (${response.status} ${response.statusText})`);
        }

        const contentType = response.headers.get('content-type') || '';
        // If the response is JSON (like Cloudinary error response returned with 200/401)
        if (contentType.includes('application/json')) {
          const json = await response.json();
          if (json?.error || json?.success === false) {
            if (isCloudinaryUrl(url)) {
              startPageMode();
              return;
            }
            throw new Error(json.error?.message || 'Access denied to document');
          }
        }

        const blob = await response.blob();
        if (!isMounted) return;

        // Ensure PDF mime type
        const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
        createdUrl = URL.createObjectURL(pdfBlob);
        setBlobUrl(createdUrl);
        setViewerMode('native');
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (isCloudinaryUrl(url)) {
          console.info('Direct PDF fetch failed, switching to high-res page renderer:', err.message);
          startPageMode();
        } else {
          setError(err.message || 'Failed to load document');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, url]);

  // Handle keyboard shortcuts & secure print interception
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        toast.error('Printing protected study materials is strictly disabled.', { id: 'modal-print-disabled' });
        return;
      }
      if (isCmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        toast.error('Downloading or saving protected document files is disabled.', { id: 'modal-save-disabled' });
        return;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen || !url) return null;

  const displaySrc = blobUrl ? `${blobUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH` : '';

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 50));
  const handleResetZoom = () => setZoom(100);

  return (
    <div
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        userSelect: 'none',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '96vw',
          maxWidth: '1280px',
          height: '94vh',
          backgroundColor: '#111827',
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            backgroundColor: '#1f2937',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            flexShrink: 0,
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {/* Left Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200 }}>
            <FileText size={20} color="#60a5fa" />
            <span
              style={{
                color: '#f9fafb',
                fontWeight: 700,
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 320,
              }}
              title={title}
            >
              {title}
            </span>
          </div>

          {/* Center Controls (Zoom & Page stats if in pages mode) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {viewerMode === 'pages' && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    padding: '3px 8px',
                    borderRadius: 8,
                    color: '#e5e7eb',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <span>
                    {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
                    {!isProbingComplete && ' (loading…)'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '2px 6px',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: zoom <= 50 ? 'rgba(255,255,255,0.3)' : '#fff',
                      cursor: zoom <= 50 ? 'default' : 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>

                  <span
                    onClick={handleResetZoom}
                    style={{
                      color: '#93c5fd',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      minWidth: 42,
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                    title="Reset Zoom"
                  >
                    {zoom}%
                  </span>

                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: zoom >= 200 ? 'rgba(255,255,255,0.3)' : '#fff',
                      cursor: zoom >= 200 ? 'default' : 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetZoom}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Reset to 100%"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </>
            )}

            <span
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '4px 10px',
                borderRadius: 99,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <ShieldCheck size={13} color="#34d399" /> View Only • Secure
            </span>
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#fff',
                borderRadius: 8,
                padding: '6px 14px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
            >
              <X size={15} /> Close
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            backgroundColor: viewerMode === 'pages' ? '#0b0f19' : '#ffffff',
            position: 'relative',
            overflowY: viewerMode === 'pages' ? 'auto' : 'hidden',
            overflowX: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: viewerMode === 'pages' ? '24px 16px 48px' : 0,
          }}
        >
          {loading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#111827',
                gap: 12,
                zIndex: 10,
              }}
            >
              <Loader2 size={38} color="#60a5fa" className="animate-spin" />
              <span style={{ fontSize: '0.92rem', color: '#9ca3af', fontWeight: 600 }}>
                Loading document securely...
              </span>
            </div>
          )}

          {error ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                color: '#ef4444',
                padding: 40,
                textAlign: 'center',
                margin: 'auto',
              }}
            >
              <AlertCircle size={44} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f3f4f6' }}>
                Unable to load document
              </div>
              <p style={{ color: '#9ca3af', fontSize: '0.88rem', maxWidth: 440, lineHeight: 1.5 }}>
                {error}
              </p>
            </div>
          ) : viewerMode === 'pages' ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 28,
                width: '100%',
                maxWidth: `${Math.round(920 * (zoom / 100))}px`,
                transition: 'max-width 0.2s ease',
              }}
            >
              {showTip && (
                <div
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: 10,
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    color: '#93c5fd',
                    marginBottom: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Info size={15} color="#60a5fa" />
                    <span>Displaying document pages in high definition view.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTip(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(147, 197, 253, 0.7)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      padding: '2px 6px',
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {pages.map((pageSrc, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  {/* Page header bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 14px',
                      backgroundColor: '#f3f4f6',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: 600,
                    }}
                  >
                    <span>Page {idx + 1}</span>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>StudyBuddy Protected Reader</span>
                  </div>

                  {/* Page image */}
                  <img
                    src={pageSrc}
                    alt={`Page ${idx + 1}`}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              ))}

              {!isProbingComplete && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.8rem',
                    padding: '8px 0',
                  }}
                >
                  <Loader2 size={16} className="animate-spin" color="#60a5fa" />
                  <span>Checking for additional pages...</span>
                </div>
              )}
            </div>
          ) : displaySrc ? (
            <object
              data={displaySrc}
              type="application/pdf"
              style={{ width: '100%', height: '100%', border: 'none' }}
            >
              <iframe
                src={displaySrc}
                title="Document Viewer"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </object>
          ) : null}
        </div>
      </div>
    </div>
  );
};
