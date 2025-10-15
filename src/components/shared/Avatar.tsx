import React from 'react';

export interface AvatarProps {
  /** Image source URL */
  src?: string;
  /** User's name for fallback initials */
  name: string;
  /** Avatar size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Custom background color (overrides generated color) */
  color?: string;
  /** Additional CSS classes */
  className?: string;
  /** Alt text for the image */
  alt?: string;
}

/**
 * Avatar component with image and fallback initials
 * 
 * Features:
 * - Image with fallback to initials
 * - Multiple sizes
 * - Automatic color generation from name
 * - Accessible alt text
 * - Responsive design
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  color,
  className = '',
  alt,
}) => {
  // Generate initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate a consistent color from name
  const generateColor = (name: string): string => {
    if (color) return color;
    
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#10AC84', '#EE5A24', '#0984E3', '#A29BFE', '#6C5CE7',
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const sizeClasses = {
    xs: 'avatar-xs',
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl',
  };

  const avatarColor = generateColor(name);
  const initials = getInitials(name);
  const altText = alt || `${name}'s avatar`;

  const avatarClasses = [
    'avatar',
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div 
      className={avatarClasses}
      style={{ backgroundColor: src ? 'transparent' : avatarColor }}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={altText}
          className="avatar-image"
          onError={(e) => {
            // Hide image on error to show fallback
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : null}
      
      {/* Fallback initials - always rendered but hidden when image loads */}
      <span 
        className="avatar-initials"
        style={{ display: src ? 'none' : 'flex' }}
      >
        {initials}
      </span>
    </div>
  );
};

// Add avatar-specific styles
const style = document.createElement('style');
style.textContent = `
  .avatar {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    overflow: hidden;
    flex-shrink: 0;
    font-weight: var(--font-medium);
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .avatar-xs {
    width: 24px;
    height: 24px;
    font-size: 10px;
  }
  
  .avatar-sm {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
  
  .avatar-md {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
  
  .avatar-lg {
    width: 48px;
    height: 48px;
    font-size: 16px;
  }
  
  .avatar-xl {
    width: 64px;
    height: 64px;
    font-size: 20px;
  }
  
  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }
  
  .avatar-initials {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-semibold);
    user-select: none;
  }
  
  /* Handle image load/error states */
  .avatar img {
    transition: opacity var(--duration-fast) var(--ease-out);
  }
  
  .avatar img[style*="display: none"] + .avatar-initials {
    display: flex !important;
  }
`;

if (!document.head.querySelector('style[data-avatar-styles]')) {
  style.setAttribute('data-avatar-styles', 'true');
  document.head.appendChild(style);
}
