import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

/**
 * Individual Toast component
 */
const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const { id, type, title, message, duration = 3000, action } = toast;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const typeIcons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="polite">
      <div className="toast-content">
        <div className="toast-icon">
          {typeIcons[type]}
        </div>
        
        <div className="toast-body">
          {title && <div className="toast-title">{title}</div>}
          <div className="toast-message">{message}</div>
        </div>
        
        <div className="toast-actions">
          {action && (
            <button
              type="button"
              className="toast-action"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          )}
          
          <button
            type="button"
            className="toast-close"
            onClick={() => onClose(id)}
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

/**
 * Toast Container component that renders all active toasts
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>,
    document.body
  );
};

// Add toast-specific styles
const style = document.createElement('style');
style.textContent = `
  .toast-container {
    position: fixed;
    top: var(--space-4);
    right: var(--space-4);
    z-index: var(--z-toast);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    max-width: 400px;
    width: 100%;
  }
  
  .toast {
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    animation: toastSlideIn var(--duration-normal) var(--ease-out);
    overflow: hidden;
  }
  
  .toast-success {
    border-color: var(--status-success);
    background-color: var(--status-success-bg);
  }
  
  .toast-error {
    border-color: var(--status-error);
    background-color: var(--status-error-bg);
  }
  
  .toast-warning {
    border-color: var(--status-warning);
    background-color: var(--status-warning-bg);
  }
  
  .toast-info {
    border-color: var(--status-info);
    background-color: var(--status-info-bg);
  }
  
  .toast-content {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
  }
  
  .toast-icon {
    font-size: var(--text-lg);
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .toast-body {
    flex: 1;
    min-width: 0;
  }
  
  .toast-title {
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-1);
    font-size: var(--text-sm);
  }
  
  .toast-message {
    color: var(--text-secondary);
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
  }
  
  .toast-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }
  
  .toast-action {
    background: none;
    border: none;
    color: var(--interactive-primary);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    cursor: pointer;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    transition: background-color var(--duration-fast) var(--ease-out);
  }
  
  .toast-action:hover {
    background-color: var(--interactive-secondary);
  }
  
  .toast-close {
    background: none;
    border: none;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
    cursor: pointer;
    padding: var(--space-1);
    border-radius: var(--radius-sm);
    transition: color var(--duration-fast) var(--ease-out);
  }
  
  .toast-close:hover {
    color: var(--text-primary);
  }
  
  @keyframes toastSlideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @media (max-width: 640px) {
    .toast-container {
      left: var(--space-4);
      right: var(--space-4);
      max-width: none;
    }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .toast {
      animation: none;
    }
  }
`;

if (!document.head.querySelector('style[data-toast-styles]')) {
  style.setAttribute('data-toast-styles', 'true');
  document.head.appendChild(style);
}
