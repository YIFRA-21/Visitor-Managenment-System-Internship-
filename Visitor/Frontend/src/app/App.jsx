import React, { Component, useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import GlobalErrorPage from '../modules/response/GlobalErrorPage';
import { getApiBaseUrl } from '../utils/apiUrl';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AppErrorBoundary] Unhandled application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <GlobalErrorPage
          error={this.state.error}
          resetErrorBoundary={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}

export default function App() {
  useEffect(() => {
    // Silent pre-warm ping on initial load to ensure backend is hot
    try {
      fetch(`${getApiBaseUrl()}/health`, { method: 'GET', keepalive: true }).catch(() => {});
    } catch {}
  }, []);

  return (
    <AppErrorBoundary>
      <AppRoutes />
    </AppErrorBoundary>
  );
}
