import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#070a10',
          color: '#f8fafc',
          fontFamily: "'JetBrains Mono', monospace",
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', color: '#f43f5e' }}>[KERNEL PANIC]</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#00e5ff' }}>
            CYBERNET: OPS // NEURAL RECOVERY
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '420px', marginBottom: '16px' }}>
            A neural packet desynchronization occurred. Click below to reboot your operative uplink.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#00e5ff',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
            }}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
