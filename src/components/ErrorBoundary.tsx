import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorType: 'auth' | 'network' | 'generic';
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeout?: number;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorType: 'generic',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Classify error types for better handling
    let errorType: 'auth' | 'network' | 'generic' = 'generic';
    
    if (error.message?.includes('charAt') || 
        error.message?.includes('displayName') ||
        error.message?.includes('auth') ||
        error.stack?.includes('AuthProvider')) {
      errorType = 'auth';
    } else if (error.message?.includes('network') || 
               error.message?.includes('fetch') ||
               error.message?.includes('Firebase')) {
      errorType = 'network';
    }

    return { hasError: true, error, errorType };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
    
    // Auto-retry for network errors
    if (this.state.errorType === 'network' && this.state.retryCount < 3) {
      this.retryTimeout = setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: undefined,
          retryCount: prevState.retryCount + 1
        }));
      }, 2000 * (this.state.retryCount + 1)); // Exponential backoff
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      retryCount: 0
    });
  };

  handleSignOut = () => {
    // Clear all session data and redirect to sign-in
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/signin';
  };

  render() {
    if (this.state.hasError) {
      const { errorType, retryCount, error } = this.state;
      
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            padding: "20px",
            textAlign: "center",
            background: "#f9fafb",
          }}
        >
          <h1 style={{ color: "#dc2626", marginBottom: "16px" }}>
            {errorType === 'auth' ? 'Authentication Error' : 
             errorType === 'network' ? 'Connection Error' : 
             'Something went wrong'}
          </h1>
          
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>
            {errorType === 'auth' ? 
              'Your session has expired or there was an authentication issue. Please sign in again.' :
             errorType === 'network' ? 
              `Connection lost. ${retryCount > 0 ? `Retry attempt ${retryCount}/3` : 'Attempting to reconnect...'}` :
              'The application encountered an unexpected error. Please try refreshing the page.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {errorType === 'auth' ? (
              <button
                onClick={this.handleSignOut}
                style={{
                  padding: "12px 24px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                Sign In Again
              </button>
            ) : (
              <>
                <button
                  onClick={this.handleManualRetry}
                  style={{
                    padding: "12px 24px",
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "600",
                  }}
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: "12px 24px",
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "600",
                  }}
                >
                  Refresh Page
                </button>
              </>
            )}
          </div>

          {error && (
            <details style={{ marginTop: "24px", textAlign: "left", maxWidth: "600px" }}>
              <summary style={{ cursor: "pointer", color: "#6b7280" }}>
                Technical Details
              </summary>
              <pre
                style={{
                  background: "#f3f4f6",
                  padding: "16px",
                  borderRadius: "8px",
                  marginTop: "8px",
                  fontSize: "12px",
                  overflow: "auto",
                  maxHeight: "200px",
                }}
              >
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
