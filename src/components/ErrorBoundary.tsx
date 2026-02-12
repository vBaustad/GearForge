"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Optional fallback UI to render instead of the default error UI */
  fallback?: ReactNode;
  /** Optional callback when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Optional custom title for the error message */
  title?: string;
  /** Optional custom description for the error message */
  description?: string;
  /** Whether to show a compact version (for inline components) */
  compact?: boolean;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Call optional onError callback (can be used for error reporting services)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const {
        title = "Something went wrong",
        description = "We're sorry, but something unexpected happened. Please try again.",
        compact = false,
      } = this.props;

      // Compact version for inline components
      if (compact) {
        return (
          <div
            style={{
              padding: "var(--space-lg)",
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              textAlign: "center",
            }}
          >
            <AlertTriangle
              size={24}
              style={{ color: "#ef4444", marginBottom: "var(--space-sm)" }}
            />
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                marginBottom: "var(--space-md)",
              }}
            >
              {title}
            </p>
            <button
              onClick={this.handleReset}
              className="btn btn-secondary"
              style={{ fontSize: "0.875rem" }}
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        );
      }

      // Full-page error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">
              <AlertTriangle size={48} />
            </div>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="error-boundary-actions">
              <button onClick={this.handleReset} className="btn btn-primary">
                <RefreshCw size={16} />
                Try Again
              </button>
              <button onClick={this.handleRefresh} className="btn btn-secondary">
                <RefreshCw size={16} />
                Refresh Page
              </button>
              <button onClick={this.handleGoHome} className="btn btn-ghost">
                <Home size={16} />
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="error-boundary-details">
                <summary>Error Details (Development Only)</summary>
                <pre>{this.state.error.message}</pre>
                <pre>{this.state.error.stack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * A hook-friendly wrapper for error boundary that can be used with
 * a render prop pattern for more flexibility.
 */
interface ErrorBoundaryWithRetryProps {
  children: (retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryWithRetryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class ErrorBoundaryWithRetry extends Component<
  ErrorBoundaryWithRetryProps,
  ErrorBoundaryWithRetryState
> {
  constructor(props: ErrorBoundaryWithRetryProps) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryWithRetryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundaryWithRetry caught an error:", error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: undefined,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "var(--space-xl)",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <AlertTriangle
            size={32}
            style={{ color: "#ef4444", marginBottom: "var(--space-md)" }}
          />
          <h3
            style={{
              fontSize: "1rem",
              marginBottom: "var(--space-sm)",
              color: "var(--text-primary)",
            }}
          >
            Failed to load
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              marginBottom: "var(--space-md)",
            }}
          >
            Something went wrong while loading this section.
          </p>
          <button onClick={this.handleRetry} className="btn btn-primary">
            <RefreshCw size={16} />
            Try Again
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details
              style={{
                marginTop: "var(--space-md)",
                textAlign: "left",
                fontSize: "0.75rem",
              }}
            >
              <summary style={{ cursor: "pointer", color: "var(--text-muted)" }}>
                Error Details
              </summary>
              <pre style={{ color: "#ef4444", marginTop: "var(--space-xs)" }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children(this.handleRetry);
  }
}
