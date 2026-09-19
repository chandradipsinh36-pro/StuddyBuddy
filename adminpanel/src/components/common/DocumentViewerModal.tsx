import React, { useState } from 'react';
import { X, ExternalLink, Download, FileText, ZoomIn, ZoomOut, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import type { TutorDocument } from '../../types/admin';
import { adminTutorService } from '../../services/adminTutorService';

interface DocumentViewerModalProps {
  document: TutorDocument | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: doc,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!doc) return null;

  // Detect Cloudinary PDF: Cloudinary direct .pdf delivery returns 401 ACL failure,
  // but delivering it as .png or .jpg renders the PDF page directly with HTTP 200 OK!
  const isCloudinaryPdf = doc.document_url.includes('res.cloudinary.com') && doc.document_url.toLowerCase().includes('.pdf');
  const isImage = doc.document_url.startsWith('data:image/') || doc.document_url.match(/\.(png|jpe?g|webp|gif)(\?.*)?$/i) || isCloudinaryPdf;
  const previewUrl = doc.preview_url || (isCloudinaryPdf ? doc.document_url.replace(/\.pdf(\?.*)?$/i, '.png') : doc.document_url);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      if (doc.doc_id) {
        const downloadUrl = await adminTutorService.getDocumentDownloadUrl(doc.doc_id);
        window.open(downloadUrl, '_blank');
      } else if (doc.download_url) {
        window.open(doc.download_url, '_blank');
      } else {
        window.open(previewUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to get download URL:', err);
      // Fallback to opening preview URL
      window.open(previewUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 'var(--space-4)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="admin-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 960,
          maxHeight: '92vh',
          backgroundColor: 'var(--color-surface, #0f172a)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-bg-subtle, #1e293b)',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 240 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                color: 'var(--color-primary-400, #60a5fa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(37, 99, 235, 0.3)',
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--color-gray-900, #f8fafc)' }}>
                {doc.file_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 2, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                  }}
                >
                  {doc.document_type.replace(/_/g, ' ')}
                </span>
                {doc.file_size && (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
                    • {doc.file_size}
                  </span>
                )}
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
                  • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {/* Zoom Controls (for image preview) */}
            {isImage && !loadError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2px 4px',
                  border: '1px solid var(--color-border)',
                  marginRight: 'var(--space-2)',
                }}
              >
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom out"
                  style={{ padding: '4px 6px', color: 'var(--color-gray-300)', cursor: 'pointer' }}
                >
                  <ZoomOut size={16} />
                </button>
                <span style={{ fontSize: '11px', color: 'var(--color-gray-400)', minWidth: 36, textAlign: 'center' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom in"
                  style={{ padding: '4px 6px', color: 'var(--color-gray-300)', cursor: 'pointer' }}
                >
                  <ZoomIn size={16} />
                </button>
                {zoom !== 1 && (
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    title="Reset zoom"
                    style={{ padding: '4px 6px', color: 'var(--color-primary-400)', cursor: 'pointer' }}
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '6px 12px' }}
              title="Download original file"
            >
              {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>Download</span>
            </button>

            {/* Open in New Tab */}
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '6px 12px' }}
            >
              <ExternalLink size={14} />
              <span>Open in New Tab</span>
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon-only"
              aria-label="Close document viewer"
              style={{ padding: '6px', color: 'var(--color-gray-400)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Document Preview Frame */}
        <div
          style={{
            flex: 1,
            minHeight: 520,
            maxHeight: '72vh',
            backgroundColor: '#090d16',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            padding: 'var(--space-4)',
          }}
        >
          {isLoading && !loadError && (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-2)',
                color: 'var(--color-primary-400)',
              }}
            >
              <Loader2 size={32} className="animate-spin" />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
                Loading qualification credential...
              </span>
            </div>
          )}

          {loadError ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-8)',
                textAlign: 'center',
                maxWidth: 420,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                }}
              >
                <AlertCircle size={30} />
              </div>
              <h4 style={{ color: 'var(--color-gray-100)', fontSize: 'var(--font-size-base)', fontWeight: 700 }}>
                Direct Preview Unavailable
              </h4>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', lineHeight: 1.6 }}>
                The uploaded document cannot be displayed in the in-app viewer. You can securely download the original file or open it in a new browser tab.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                >
                  <Download size={14} />
                  <span>Download File</span>
                </button>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                >
                  <ExternalLink size={14} />
                  <span>Open URL</span>
                </a>
              </div>
            </div>
          ) : isImage ? (
            <img
              src={previewUrl}
              alt={doc.file_name}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setLoadError(true);
              }}
              style={{
                maxWidth: zoom === 1 ? '100%' : 'none',
                maxHeight: zoom === 1 ? '70vh' : 'none',
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
                objectFit: 'contain',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            />
          ) : (
            <iframe
              src={previewUrl}
              title={doc.file_name}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setLoadError(true);
              }}
              style={{ width: '100%', height: '100%', minHeight: 520, border: 'none' }}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-6)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-surface, #0f172a)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
              Verification Document Preview • Official StudyBuddy Record
            </span>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
