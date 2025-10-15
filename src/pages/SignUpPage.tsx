import React from 'react';
import { Link } from 'react-router-dom';
import { SignUp } from './SignUp'; // Import existing SignUp component

/**
 * Sign Up Page - Wrapper for the existing SignUp component
 * 
 * This page component provides the routing structure while
 * reusing the existing SignUp component functionality.
 */
const SignUpPage: React.FC = () => {
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
          to="/signin"
          style={{
            color: 'var(--interactive-primary)',
            textDecoration: 'none',
            fontSize: 'var(--text-sm)'
          }}
        >
          Already have an account? Sign in
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
        <SignUp />
      </main>
    </div>
  );
};

export default SignUpPage;
