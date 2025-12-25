/**
 * Error Boundary Component
 * Catches React errors and prevents white screen of death
 * Shows user-friendly error message with recovery options
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ React Error Boundary caught an error:', error);
    console.error('📍 Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearData = () => {
    if (confirm('This will clear all local data (listings, templates, settings). Continue?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            {/* Error Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
                <AlertTriangle size={48} className="text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
              Something Went Wrong
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              The application encountered an unexpected error. This might be due to corrupted data or a bug.
            </p>

            {/* Error Details (Collapsible) */}
            <details className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <summary className="cursor-pointer font-medium text-gray-900 dark:text-white mb-2">
                Technical Details
              </summary>
              <div className="mt-2 space-y-2">
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Error:</p>
                  <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-x-auto text-red-800 dark:text-red-300">
                    {this.state.error?.toString()}
                  </pre>
                </div>
                {this.state.errorInfo && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Component Stack:</p>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>

            {/* Recovery Actions */}
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw size={20} />
                Reload Application
              </button>

              <button
                onClick={this.handleClearData}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <Trash2 size={20} />
                Clear All Data & Reload
              </button>
            </div>

            {/* Help Text */}
            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
              If this problem persists, please report it on{' '}
              <a
                href="https://github.com/swipswaps/marketplace-bulk-editor/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                GitHub Issues
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

