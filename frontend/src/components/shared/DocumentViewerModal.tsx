import React, { useEffect, useState } from 'react';
import { Eye, X, Loader2, AlertCircle } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  url: string | null;
  title?: string;
  onClose: () => void;
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

  useEffect(() => {
    if (!isOpen || !url) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let createdUrl: string | null = null;
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('sb_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(url, { headers })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load document (${response.status} ${response.statusText})`);
        }
        const blob = await response.blob();
        if (!isMounted) return;

        // Ensure PDF mime type
        const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
        createdUrl = URL.createObjectURL(pdfBlob);
        setBlobUrl(createdUrl);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Direct blob fetch failed, falling back to direct URL:', err.message);
        // Fallback to direct URL if fetch is blocked or CORS error
        setBlobUrl(url);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, url]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !url) return null;

  const displaySrc = blobUrl ? `${blobUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH` : '';

  return (
    <div
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
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
          width: '94vw',
          maxWidth: '1200px',
          height: '92vh',
          backgroundColor: '#1e1e2e',
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            backgroundColor: '#27273a',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Eye size={18} color="#60a5fa" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
              {title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '4px 10px',
                borderRadius: 99,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              🔒 View Only • No Download or Print
            </span>

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
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
            >
              <X size={14} /> Close
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
                backgroundColor: '#ffffff',
                gap: 12,
                zIndex: 10,
              }}
            >
              <Loader2 size={36} color="#2563eb" className="animate-spin" />
              <span style={{ fontSize: '0.9rem', color: '#4b5563', fontWeight: 600 }}>
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
                gap: 12,
                color: '#ef4444',
                padding: 30,
                textAlign: 'center',
              }}
            >
              <AlertCircle size={40} />
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1f2937' }}>
                Unable to load document
              </div>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', maxWidth: 400 }}>
                {error}
              </p>
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
