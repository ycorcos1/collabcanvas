import React, { forwardRef, useState } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Icon to display before input */
  icon?: React.ReactNode;
  /** Icon to display after input */
  iconRight?: React.ReactNode;
  /** Full width input */
  fullWidth?: boolean;
}

/**
 * Reusable Input component with label, error states, and icons
 * 
 * Features:
 * - Label and helper text support
 * - Error state styling and messages
 * - Icon support (left and right)
 * - Password visibility toggle for password inputs
 * - Full accessibility support
 * - Forwards ref for form libraries
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      iconRight,
      fullWidth = false,
      type = 'text',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    
    const inputClasses = [
      'form-input',
      fullWidth ? 'w-full' : '',
      error ? 'border-error' : '',
      icon ? 'pl-10' : '',
      (iconRight || isPassword) ? 'pr-10' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const togglePassword = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className={`form-group ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        
        <div className="input-container">
          {icon && (
            <div className="input-icon-left">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={inputClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : 
              helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          
          {(iconRight || isPassword) && (
            <div className="input-icon-right">
              {isPassword ? (
                <button
                  type="button"
                  onClick={togglePassword}
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁' : '👁'}
                </button>
              ) : (
                iconRight
              )}
            </div>
          )}
        </div>
        
        {error && (
          <div id={`${inputId}-error`} className="form-error" role="alert">
            {error}
          </div>
        )}
        
        {helperText && !error && (
          <div id={`${inputId}-helper`} className="form-helper">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Add input-specific styles
const style = document.createElement('style');
style.textContent = `
  .input-container {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .input-icon-left,
  .input-icon-right {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 100%;
    color: var(--text-tertiary);
    pointer-events: none;
  }
  
  .input-icon-left {
    left: 0;
  }
  
  .input-icon-right {
    right: 0;
  }
  
  .password-toggle {
    pointer-events: auto;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-1);
    border-radius: var(--radius-sm);
    color: var(--text-tertiary);
    transition: color var(--duration-fast) var(--ease-out);
  }
  
  .password-toggle:hover {
    color: var(--text-secondary);
  }
  
  .pl-10 {
    padding-left: 40px;
  }
  
  .pr-10 {
    padding-right: 40px;
  }
  
  .border-error {
    border-color: var(--status-error) !important;
  }
  
  .form-helper {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }
`;

if (!document.head.querySelector('style[data-input-styles]')) {
  style.setAttribute('data-input-styles', 'true');
  document.head.appendChild(style);
}
