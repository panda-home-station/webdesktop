/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in component trees and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { XOctagon, RefreshCw, AlertTriangle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({
  error,
  errorInfo,
  onReset,
  showDetails,
}: {
  error: Error
  errorInfo: ErrorInfo | null
  onReset: () => void
  showDetails: boolean
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 999999,
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 600,
          width: '100%',
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          padding: 32,
          border: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XOctagon size={28} color="#ef4444" />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 600,
                color: '#1f2937',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: 14,
                color: '#6b7280',
              }}
            >
              An unexpected error has occurred
            </p>
          </div>
        </div>

        <div
          style={{
            background: '#fef3c7',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: '#92400e',
                lineHeight: 1.5,
                fontFamily: 'monospace',
              }}
            >
              {error.message}
            </p>
          </div>
        </div>

        {showDetails && errorInfo && (
          <details
            style={{
              marginBottom: 20,
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                padding: '8px 0',
                fontSize: 14,
                fontWeight: 500,
                color: '#374151',
                userSelect: 'none',
              }}
            >
              Error Details
            </summary>
            <pre
              style={{
                marginTop: 12,
                padding: 16,
                background: '#f3f4f6',
                borderRadius: 8,
                fontSize: 12,
                color: '#1f2937',
                overflow: 'auto',
                maxHeight: 300,
                border: '1px solid #e5e7eb',
              }}
            >
              <code>
                {error.stack}
                {'\n\n'}
                Component Stack:{'\n'}
                {errorInfo.componentStack}
              </code>
            </pre>
          </details>
        )}

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white'
            }}
          >
            <RefreshCw size={16} />
            Reload Page
          </button>

          <button
            onClick={onReset}
            style={{
              padding: '10px 20px',
              background: '#2563eb',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1d4ed8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2563eb'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in component trees
 * Provides a fallback UI and error recovery options
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Log error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo)

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback or default
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <DefaultErrorFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          showDetails={this.props.showDetails ?? import.meta.env.DEV}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Hook to trigger errors programmatically (for testing)
 */
export function useErrorThrow() {
  return (error: Error) => {
    throw error
  }
}

/**
 * withErrorBoundary HOC (Higher-Order Component)
 *
 * Wraps a component with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}
