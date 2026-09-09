import React from 'react';
import { X, ExternalLink, Download, FileText } from 'lucide-react';
import type { TutorDocument } from '../../types/admin';

interface DocumentViewerModalProps {
  document: TutorDocument | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: doc,
  onClose,
}) => {
  if (!doc) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal)',
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
          maxWidth: 780,
          maxHeight: '90vh',
          backgroundColor: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
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
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-50)',
                color: 'var(--color-primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--color-gray-900)' }}>
                {doc.file_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 2 }}>
                <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                  {doc.document_type}
                </span>
                {doc.file_size && (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                    • {doc.file_size}
                  </span>
                )}
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
                  • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <a
              href={doc.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
            >
              <ExternalLink size={14} />
              <span>Open in New Tab</span>
            </a>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon-only"
              aria-label="Close document viewer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document Preview Frame */}
        <div style={{ flex: 1, minHeight: 480, backgroundColor: '#F1F5F9', position: 'relative' }}>
          <iframe
            src={doc.document_url}
            title={doc.file_name}
            style={{ width: '100%', height: '100%', minHeight: 480, border: 'none' }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-6)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-white)',
          }}
        >
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
            Verification Document Preview • Official StudyBuddy Record
          </span>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
