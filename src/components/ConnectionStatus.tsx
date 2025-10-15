import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth/AuthProvider';

interface ConnectionStatusProps {}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [lastDisconnect, setLastDisconnect] = useState<Date | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastDisconnect(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastDisconnect(new Date());
    };

    // Monitor browser connectivity
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor Firebase connectivity (simplified check)
    const checkFirebaseConnection = () => {
      if (!user) return;

      // Simple connectivity test using Firebase auth state
      import('../services/firebase').then(({ auth }) => {
        const unsubscribe = auth.onAuthStateChanged(
          (_authUser) => {
            setIsFirebaseConnected(true);
            unsubscribe();
          },
          (error) => {
            console.warn('Firebase connection issue:', error);
            setIsFirebaseConnected(false);
            unsubscribe();
          }
        );

        // Timeout after 5 seconds
        setTimeout(() => {
          unsubscribe();
          if (!isFirebaseConnected) {
            setIsFirebaseConnected(false);
          }
        }, 5000);
      });
    };

    // Check Firebase connection periodically
    const connectionInterval = setInterval(checkFirebaseConnection, 30000); // Every 30 seconds
    checkFirebaseConnection(); // Initial check

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectionInterval);
    };
  }, [user, isFirebaseConnected]);

  // Don't show anything if everything is connected
  if (isOnline && isFirebaseConnected) {
    return null;
  }

  const getStatusMessage = () => {
    if (!isOnline) {
      return 'No internet connection';
    }
    if (!isFirebaseConnected) {
      return 'Reconnecting to server...';
    }
    return 'Connection issues detected';
  };

  const getStatusColor = () => {
    if (!isOnline) return '#dc2626'; // Red
    if (!isFirebaseConnected) return '#f59e0b'; // Amber
    return '#6b7280'; // Gray
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: getStatusColor(),
        color: 'white',
        padding: '8px 16px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'white',
          animation: isFirebaseConnected ? 'none' : 'pulse 1.5s infinite'
        }}
      />
      {getStatusMessage()}
      {lastDisconnect && (
        <span style={{ fontSize: '12px', opacity: 0.8 }}>
          ({Math.round((Date.now() - lastDisconnect.getTime()) / 1000)}s ago)
        </span>
      )}
      
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};