import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export interface RowActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  hidden?: boolean;
}

export interface RowActionsMenuProps {
  items?: RowActionItem[];
  children?: ((close: () => void) => React.ReactNode) | React.ReactNode;
  triggerLabel?: string;
  width?: number;
}

interface MenuCoords {
  top?: number;
  bottom?: number;
  right: number;
  width: number;
}

export const RowActionsMenu: React.FC<RowActionsMenuProps> = ({
  items,
  children,
  triggerLabel = 'Row actions',
  width = 200,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords>({ right: 16, width });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const menuHeight = 260; // Estimated height of actions menu

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // If near bottom of screen or not enough space below, flip upwards
    const openUpwards = spaceBelow < menuHeight && spaceAbove > spaceBelow;

    // Keep within horizontal boundaries
    let rightPos = viewportWidth - rect.right;
    if (rightPos < 8) rightPos = 8;
    if (rightPos + width > viewportWidth) {
      rightPos = Math.max(8, viewportWidth - width - 8);
    }

    if (openUpwards) {
      setCoords({
        bottom: viewportHeight - rect.top + 6,
        top: undefined,
        right: rightPos,
        width,
      });
    } else {
      setCoords({
        top: rect.bottom + 6,
        bottom: undefined,
        right: rightPos,
        width,
      });
    }
  }, [width]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      calculatePosition();
      setIsOpen(true);
    }
  };

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Recalculate or close on window events
    const handleScrollOrResize = () => {
      closeMenu();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  // Filter visible items
  const visibleItems = items ? items.filter((item) => !item.hidden) : [];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="btn btn-ghost btn-icon-only"
        aria-label={triggerLabel}
        aria-expanded={isOpen}
        style={{
          color: isOpen ? 'var(--color-primary-500)' : 'var(--color-gray-600)',
          backgroundColor: isOpen ? 'var(--color-gray-100)' : 'transparent',
          position: 'relative',
        }}
      >
        <MoreVertical size={16} />
      </button>

      {isOpen &&
        createPortal(
          <>
            {/* Click-outside backdrop */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                closeMenu();
              }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9998,
                backgroundColor: 'transparent',
              }}
            />

            {/* Floating Dropdown Menu Card */}
            <div
              className="admin-card animate-fade-in"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                ...(coords.top !== undefined ? { top: coords.top } : { bottom: coords.bottom }),
                right: coords.right,
                width: coords.width,
                maxHeight: 'min(380px, calc(100vh - 24px))',
                overflowY: 'auto',
                padding: 'var(--space-1)',
                zIndex: 9999,
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {typeof children === 'function' ? (
                children(closeMenu)
              ) : children ? (
                children
              ) : (
                visibleItems.map((item, index) => {
                  let textColor = 'var(--color-gray-700)';
                  let hoverBg = 'var(--color-gray-100)';

                  if (item.variant === 'danger') {
                    textColor = 'var(--color-danger)';
                    hoverBg = 'var(--color-danger-light)';
                  } else if (item.variant === 'warning') {
                    textColor = 'var(--color-warning-dark)';
                    hoverBg = 'var(--color-warning-light)';
                  } else if (item.variant === 'success') {
                    textColor = 'var(--color-success-dark)';
                    hoverBg = 'var(--color-success-light)';
                  }

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeMenu();
                        item.onClick();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: '0.5rem var(--space-3)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 500,
                        color: textColor,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {item.icon && (
                        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          {item.icon}
                        </span>
                      )}
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </>,
          document.body
        )}
    </>
  );
};
