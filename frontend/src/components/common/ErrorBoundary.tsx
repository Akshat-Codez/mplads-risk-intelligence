import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-white border border-red-200 rounded-2xl shadow-xl p-8 space-y-5 text-center">
            <div className="w-14 h-14 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold shadow-sm">
              ⚠️
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 font-serif">
                {this.props.fallbackTitle || 'Unable to Load Authority Dashboard'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                An unexpected interface exception occurred. The system safely contained the error.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-left text-[11px] font-mono text-red-800 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow cursor-pointer"
              >
                Reload Dashboard
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
