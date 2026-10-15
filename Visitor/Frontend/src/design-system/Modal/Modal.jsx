/**
 * VMS Design System — Modal Component
 * ─────────────────────────────────────
 * Accessible modal with backdrop, focus trap, and keyboard dismissal.
 */
import { useEffect, useRef, useCallback } from 'react';
export default function Modal({ isOpen, onClose, title, size = 'md', children, footer, closeOnOverlay = true, closeOnEscape = true, className = '', }) {
    const modalRef = useRef(null);
    const previousFocus = useRef(null);
    // Store previous focus and focus modal on open
    useEffect(() => {
        if (isOpen) {
            previousFocus.current = document.activeElement;
            // Focus the modal or first focusable element
            setTimeout(() => {
                const firstFocusable = modalRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                firstFocusable?.focus();
            }, 50);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
            previousFocus.current?.focus();
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);
    // Keyboard handler
    const handleKeyDown = useCallback((e) => {
        if (!isOpen)
            return;
        if (e.key === 'Escape' && closeOnEscape) {
            onClose();
            return;
        }
        // Focus trap
        if (e.key === 'Tab' && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstEl = focusableElements[0];
            const lastEl = focusableElements[focusableElements.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === firstEl) {
                    e.preventDefault();
                    lastEl?.focus();
                }
            }
            else {
                if (document.activeElement === lastEl) {
                    e.preventDefault();
                    firstEl?.focus();
                }
            }
        }
    }, [isOpen, closeOnEscape, onClose]);
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    if (!isOpen)
        return null;
    const sizeClass = size !== 'md' ? `vms-modal--${size}` : '';
    return (<div className="vms-modal-overlay" onClick={closeOnOverlay ? onClose : undefined} role="dialog" aria-modal="true" aria-labelledby={title ? 'vms-modal-title' : undefined}>
      <div ref={modalRef} className={`vms-modal ${sizeClass} ${className}`} onClick={(e) => e.stopPropagation()}>
        {title && (<div className="vms-modal__header">
            <h2 id="vms-modal-title" className="vms-modal__title">{title}</h2>
            <button className="vms-modal__close" onClick={onClose} aria-label="Close modal">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>)}

        <div className="vms-modal__body">{children}</div>

        {footer && <div className="vms-modal__footer">{footer}</div>}
      </div>
    </div>);
}
