import React from 'react';
import { Link } from 'react-router-dom';
import { SignIn } from './SignIn'; // Import existing SignIn component

/**
 * Sign In Page - Wrapper for the existing SignIn component
 * 
 * This page component provides the routing structure while
 * reusing the existing SignIn component functionality.
 */
const SignInPage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      {/* Header */}
      <header style={{
        padding: 'var(--space-4) var(--space-6)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-primary)'
      }}>
        <Link 
          to="/" 
          style={{ 
            textDecoration: 'none',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-bold)'
          }}
        >
          CollabCanvas
        </Link>
        
        <Link 
          to="/signup"
          style={{
            color: 'var(--interactive-primary)',
            textDecoration: 'none',
            fontSize: 'var(--text-sm)'
          }}
        >
          Don't have an account? Sign up
        </Link>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8)'
      }}>
        <SignIn />
      </main>
    </div>
  );
};

export default SignInPage;
