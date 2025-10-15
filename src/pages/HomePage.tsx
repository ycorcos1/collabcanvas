import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/shared';

/**
 * Homepage - Landing page for unauthenticated users
 * 
 * Temporary implementation for Phase 2 routing setup.
 * Will be replaced with full homepage design in Phase 4.
 */
const HomePage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)'
    }}>
      {/* Header */}
      <header style={{
        padding: 'var(--space-4) var(--space-6)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ 
          color: 'white', 
          fontSize: 'var(--text-2xl)', 
          fontWeight: 'var(--font-bold)',
          margin: 0
        }}>
          CollabCanvas
        </h1>
        
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button 
            as={Link} 
            to="/signin" 
            variant="ghost"
            style={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            Sign In
          </Button>
          <Button 
            as={Link} 
            to="/signup"
            style={{ 
              backgroundColor: 'white', 
              color: 'var(--brand-primary)',
              border: 'none'
            }}
          >
            Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <h2 style={{
            fontSize: 'var(--text-5xl)',
            fontWeight: 'var(--font-bold)',
            color: 'white',
            marginBottom: 'var(--space-6)',
            lineHeight: 'var(--leading-tight)'
          }}>
            Real-time collaboration for creative teams
          </h2>
          
          <p style={{
            fontSize: 'var(--text-xl)',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: 'var(--space-8)',
            lineHeight: 'var(--leading-relaxed)'
          }}>
            Design together, ship faster. Create, edit, and collaborate on visual projects in real-time with your team.
          </p>
          
          <Button
            as={Link}
            to="/signup"
            size="lg"
            style={{
              backgroundColor: 'white',
              color: 'var(--brand-primary)',
              border: 'none',
              fontSize: 'var(--text-lg)',
              padding: 'var(--space-4) var(--space-8)'
            }}
          >
            Get Started →
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: 'var(--space-4)',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 'var(--text-sm)'
      }}>
        Created by Yahav Corcos
      </footer>
    </div>
  );
};

export default HomePage;
