import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/shared';
import '../styles/homepage.css';

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
      background: 'linear-gradient(135deg, #4a1a4a 0%, #6b2c5c 15%, #8b3a6b 30%, #b8527a 45%, #e06b89 60%, #ff8c42 75%, #ffb366 85%, #ffd699 95%, #ffe6cc 100%)' /* Realistic sunrise gradient from purple to cream */
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
          HØRIZON
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
              color: '#ff6b35', /* Fixed brand color */
              border: 'none'
            }}
          >
            Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section with Animated Sunrise */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Sunrise Background */}
        <div className="sunrise-animation" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {/* Animated Sun */}
          <div className="animated-sun" style={{
            position: 'absolute',
            top: '20%',
            right: '15%',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fff9e6 0%, #ffe066 15%, #ffcc33 30%, #ff9933 50%, #ff6b35 70%, #e55a2b 85%, #cc4125 100%)',
            boxShadow: '0 0 60px rgba(255, 204, 51, 0.7), 0 0 120px rgba(255, 107, 53, 0.5), 0 0 180px rgba(229, 90, 43, 0.3)',
            animation: 'sunPulse 4s ease-in-out infinite, sunFloat 6s ease-in-out infinite'
          }} />
          
          {/* Sun Rays */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="sun-ray"
              style={{
                position: 'absolute',
                top: '20%',
                right: '15%',
                width: '2px',
                height: '40px',
                background: 'linear-gradient(to bottom, rgba(255, 204, 51, 0.9), rgba(255, 107, 53, 0.6), transparent)',
                transformOrigin: '1px 60px',
                transform: `rotate(${i * 45}deg)`,
                animation: `rayRotate 8s linear infinite`
              }}
            />
          ))}
          
          {/* Floating Particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="floating-particle"
              style={{
                position: 'absolute',
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
                borderRadius: '50%',
                background: `${
                  i % 8 === 0 ? 'rgba(138, 43, 226, 0.4)' :   // Blue violet (far from sun)
                  i % 8 === 1 ? 'rgba(147, 112, 219, 0.5)' :  // Medium slate blue
                  i % 8 === 2 ? 'rgba(221, 160, 221, 0.6)' :  // Plum (medium distance)
                  i % 8 === 3 ? 'rgba(255, 182, 193, 0.7)' :  // Light pink
                  i % 8 === 4 ? 'rgba(255, 160, 122, 0.6)' :  // Light salmon
                  i % 8 === 5 ? 'rgba(255, 218, 185, 0.5)' :  // Peach puff
                  i % 8 === 6 ? 'rgba(255, 204, 51, 0.6)' :   // Golden (close to sun)
                  'rgba(255, 255, 224, 0.8)'                  // Light yellow (closest to sun)
                }`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `particleFloat ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
          
          {/* Additional Light Particles Near Sun */}
          {[...Array(15)].map((_, i) => (
            <div
              key={`light-${i}`}
              className="floating-particle light-particle"
              style={{
                position: 'absolute',
                width: `${Math.random() * 4 + 3}px`,
                height: `${Math.random() * 4 + 3}px`,
                borderRadius: '50%',
                background: `${
                  i % 4 === 0 ? 'rgba(255, 255, 224, 0.9)' :   // Light yellow (most common)
                  i % 4 === 1 ? 'rgba(255, 248, 220, 0.8)' :   // Cornsilk
                  i % 4 === 2 ? 'rgba(255, 218, 185, 0.7)' :   // Peach puff
                  'rgba(255, 204, 51, 0.8)'                    // Golden
                }`,
                left: `${70 + Math.random() * 25}%`, // Concentrated near sun area
                top: `${10 + Math.random() * 30}%`,  // Near sun vertical area
                animation: `particleFloat ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
          
          {/* Gradient Overlay for Depth */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at 85% 20%, rgba(255, 255, 224, 0.2) 0%, rgba(255, 204, 51, 0.15) 20%, rgba(255, 182, 193, 0.1) 40%, rgba(221, 160, 221, 0.08) 60%, rgba(138, 43, 226, 0.05) 80%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          
          {/* Additional Atmospheric Layers */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(221, 160, 221, 0.1) 0%, rgba(255, 160, 122, 0.08) 30%, transparent 50%), linear-gradient(-45deg, rgba(147, 112, 219, 0.08) 0%, rgba(255, 218, 185, 0.06) 25%, transparent 40%)',
            pointerEvents: 'none'
          }} />
          
          {/* Subtle Color Wash */}
          <div style={{
            position: 'absolute',
            top: '60%',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to top, rgba(138, 43, 226, 0.08) 0%, rgba(221, 160, 221, 0.05) 30%, rgba(255, 182, 193, 0.03) 60%, transparent 100%)',
            pointerEvents: 'none'
          }} />
        </div>

        {/* Content */}
        <div style={{ maxWidth: '600px', position: 'relative', zIndex: 2 }}>
          <h2 style={{
            fontSize: 'var(--text-5xl)',
            fontWeight: 'var(--font-bold)',
            color: 'white',
            marginBottom: 'var(--space-6)',
            lineHeight: 'var(--leading-tight)',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            Real-time collaboration for creative teams
          </h2>
          
          <p style={{
            fontSize: 'var(--text-xl)',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: 'var(--space-8)',
            lineHeight: 'var(--leading-relaxed)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}>
            Design together, ship faster. Create, edit, and collaborate on visual projects in real-time with your team.
          </p>
          
          <Button
            as={Link}
            to="/signup"
            size="lg"
            style={{
              backgroundColor: 'white',
              color: '#ff6b35', /* Fixed brand color */
              border: 'none',
              fontSize: 'var(--text-lg)',
              padding: 'var(--space-4) var(--space-8)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
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
