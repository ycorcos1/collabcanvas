import React from 'react';
import { Button } from './Button';

export interface ConnectionBannerProps {
  /** Whether the banner is visible */
  isVisible: boolean;
  /** Connection status message */
  message?: string;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Retry button handler */
  onRetry?: () => void;
  /** Custom retry button text */
  retryText?: string;
  /** Banner type for styling */
  type?: 'warning' | 'error' | 'info';
}

/**
 * Connection status banner component
 * 
 * Features:
 * - Shows connection issues to users
 * - Retry functionality
 * - Different visual states (warning, error, info)
 * - Accessible and non-intrusive
 * - Auto-hide when connection restored
 */
export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({
  isVisible,
  message = 'Connection lost. Changes may not be saved.',
  showRetry = true,
  onRetry,
  retryText = 'Retry',
  type = 'warning',
}) => {
  if (!isVisible) return null;

  return (
    <div className={`connection-banner connection-banner-${type}`} role="alert">
      <div className="connection-banner-content">
        <div className="connection-banner-icon">
          {type === 'error' ? '✗' : type === 'info' ? 'ℹ' : '⚠'}
        </div>
        
        <div className="connection-banner-message">
          {message}
        </div>
        
        {showRetry && onRetry && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            className="connection-banner-retry"
          >
            {retryText}
          </Button>
        )}
      </div>
    </div>
  );
};

// Add connection banner styles
const style = document.createElement('style');
style.textContent = `
  .connection-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: var(--z-sticky);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid;
    animation: bannerSlideDown var(--duration-normal) var(--ease-out);
  }
  
  .connection-banner-warning {
    background-color: var(--status-warning-bg);
    border-color: var(--status-warning);
    color: var(--text-primary);
  }
  
  .connection-banner-error {
    background-color: var(--status-error-bg);
    border-color: var(--status-error);
    color: var(--text-primary);
  }
  
  .connection-banner-info {
    background-color: var(--status-info-bg);
    border-color: var(--status-info);
    color: var(--text-primary);
  }
  
  .connection-banner-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .connection-banner-icon {
    font-size: var(--text-base);
    flex-shrink: 0;
  }
  
  .connection-banner-message {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    text-align: center;
  }
  
  .connection-banner-retry {
    flex-shrink: 0;
  }
  
  @keyframes bannerSlideDown {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }
  
  @media (max-width: 640px) {
    .connection-banner-content {
      flex-direction: column;
      gap: var(--space-2);
      text-align: center;
    }
    
    .connection-banner-message {
      font-size: var(--text-xs);
    }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .connection-banner {
      animation: none;
    }
  }
`;

if (!document.head.querySelector('style[data-connection-banner-styles]')) {
  style.setAttribute('data-connection-banner-styles', 'true');
  document.head.appendChild(style);
}
