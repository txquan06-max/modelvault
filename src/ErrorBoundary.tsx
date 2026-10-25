import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { StorageManager } from './core/StorageManager';
import i18n from './i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showResetConfirm: boolean;
  exportError: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showResetConfirm: false,
      exportError: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error Boundary Caught:', error, errorInfo);
  }

  handleAskReset = () => {
    this.setState({ showResetConfirm: true });
  };

  handleCancelReset = () => {
    this.setState({ showResetConfirm: false });
  };

  handleConfirmReset = () => {
    try {
      localStorage.clear();
      indexedDB.deleteDatabase('ModelVault');
      window.location.reload();
    } catch (e) {
      console.error('Reset failed:', e);
    }
  };

  handleExport = () => {
    try {
      const data = StorageManager.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `modelvault_emergency_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.setState({ exportError: null });
    } catch (err) {
      this.setState({ exportError: i18n.t('error_export_failed') });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '40px 20px',
            color: '#fff',
            background: '#1e1e1e',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          <h2 style={{ color: '#ef4444' }}>{i18n.t('error_crash_title')}</h2>
          <p
            style={{
              color: '#aaa',
              marginBottom: '24px',
              textAlign: 'center',
              maxWidth: '400px',
              lineHeight: '1.5',
            }}
          >
            {i18n.t('error_crash_desc')}
            <br />
            <br />
            <span style={{ fontSize: '12px', color: '#ef4444', wordBreak: 'break-all' }}>
              {this.state.error?.message}
            </span>
          </p>

          {this.state.exportError && (
            <p style={{ color: '#f59e0b', fontSize: '12px', marginBottom: '12px', textAlign: 'center' }}>
              {this.state.exportError}
            </p>
          )}

          {this.state.showResetConfirm ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'center',
                maxWidth: '400px',
              }}
            >
              <p
                style={{
                  color: '#f59e0b',
                  fontSize: '13px',
                  textAlign: 'center',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {i18n.t('error_reset_warning_1')}
                <br />
                {i18n.t('error_reset_warning_2')}
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={this.handleCancelReset}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: '1px solid #555',
                    color: '#fff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {i18n.t('cancel')}
                </button>
                <button
                  onClick={this.handleConfirmReset}
                  style={{
                    padding: '10px 20px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {i18n.t('error_confirm_reset')}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={this.handleExport}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {i18n.t('error_emergency_export')}
              </button>
              <button
                onClick={this.handleAskReset}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {i18n.t('error_clear_and_reset')}
              </button>
            </div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}