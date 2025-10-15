import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state - shows spinner and disables button */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon to display before text */
  icon?: React.ReactNode;
  /** Icon to display after text */
  iconRight?: React.ReactNode;
  /** Component to render as (for Link integration) */
  as?: React.ElementType;
  /** Additional props when using 'as' prop */
  to?: string;
}

/**
 * Reusable Button component with multiple variants and sizes
 * 
 * Features:
 * - Multiple visual variants (primary, secondary, ghost, danger)
 * - Three sizes (sm, md, lg)
 * - Loading state with spinner
 * - Icon support (left and right)
 * - Full accessibility support
 * - Forwards ref for advanced use cases
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      icon,
      iconRight,
      children,
      className = '',
      disabled,
      as: Component = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = size !== 'md' ? `btn-${size}` : '';
    const fullWidthClass = fullWidth ? 'w-full' : '';
    
    const classes = [
      baseClasses,
      variantClass,
      sizeClass,
      fullWidthClass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const isDisabled = disabled || loading;

    return (
      <Component
        ref={ref}
        className={classes}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
        )}
        {!loading && icon && <span className="btn-icon">{icon}</span>}
        {children && <span className="btn-text">{children}</span>}
        {!loading && iconRight && <span className="btn-icon">{iconRight}</span>}
      </Component>
    );
  }
);

Button.displayName = 'Button';

// Add full width utility class to globals if not already present
const style = document.createElement('style');
style.textContent = `
  .w-full { width: 100%; }
  .btn-icon { display: flex; align-items: center; }
  .btn-text { flex: 1; }
`;
if (!document.head.querySelector('style[data-button-styles]')) {
  style.setAttribute('data-button-styles', 'true');
  document.head.appendChild(style);
}
