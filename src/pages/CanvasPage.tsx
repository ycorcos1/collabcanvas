import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

/**
 * Canvas Page - Individual project canvas view
 * 
 * Temporary implementation for Phase 2 routing setup.
 * Will be replaced with full canvas implementation in Phase 4.
 * 
 * Features to implement in Phase 5:
 * - Project loading by slug
 * - Canvas top bar with project name
 * - Back navigation to dashboard
 * - Share functionality
 * - User avatars display
 */
const CanvasPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  // Validate slug parameter
  if (!slug) {
    return <Navigate to="/dashboard/recent" replace />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* Temporary Top Bar */}
      <header style={{
        padding: 'var(--space-4) var(--space-6)',
        backgroundColor: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)'
      }}>
        <button
          onClick={() => window.history.back()}
          style={{
            background: 'none',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-2) var(--space-3)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)'
          }}
        >
          ← Back
        </button>
        
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-primary)',
          margin: 0,
          textTransform: 'capitalize'
        }}>
          {slug.replace(/-/g, ' ')}
        </h1>
        
        <div style={{ marginLeft: 'auto' }}>
          <button
            style={{
              background: 'var(--interactive-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-2) var(--space-4)',
              color: 'white',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)'
            }}
          >
            Share
          </button>
        </div>
      </header>

      {/* Canvas Placeholder */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--canvas-bg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)'
          }}>
            Canvas: {slug}
          </h2>
          
          <p style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-6)'
          }}>
            Coming soon in Phase 4: Canvas Implementation
          </p>
          
          <div style={{
            padding: 'var(--space-6)',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-primary)',
            maxWidth: '500px'
          }}>
            <h3 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-3)'
            }}>
              Features to implement:
            </h3>
            <ul style={{
              textAlign: 'left',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              lineHeight: 'var(--leading-relaxed)',
              paddingLeft: 'var(--space-4)'
            }}>
              <li>Project loading by URL slug</li>
              <li>Inline project name editing</li>
              <li>Real-time collaborative canvas</li>
              <li>User presence indicators</li>
              <li>Share and collaboration features</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CanvasPage;
