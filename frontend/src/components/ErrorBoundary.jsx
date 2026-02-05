import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('UI Crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', padding: 24, background: '#000', color: '#fff' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>RideCompare crashed</h1>
          <p style={{ marginTop: 8, color: '#aaa' }}>
            Copy the error below and send it to me.
          </p>
          <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap', color: '#ddd' }}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}