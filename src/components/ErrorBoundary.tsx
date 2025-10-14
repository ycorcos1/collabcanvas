import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
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
            Something went wrong
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>
            The application encountered an error. Please refresh the page to try
            again.
          </p>
          <button
            onClick={() => window.location.reload()}
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
            Refresh Page
          </button>
          {this.state.error && (
            <details style={{ marginTop: "24px", textAlign: "left" }}>
              <summary style={{ cursor: "pointer", color: "#6b7280" }}>
                Error Details
              </summary>
              <pre
                style={{
                  background: "#f3f4f6",
                  padding: "16px",
                  borderRadius: "8px",
                  marginTop: "8px",
                  fontSize: "14px",
                  overflow: "auto",
                }}
              >
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
