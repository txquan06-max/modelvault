import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { StorageManager } from './core/StorageManager';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary Caught:", error, errorInfo);
  }

  handleReset = () => {
    if (window.confirm('警告：重置将清空你所有的模型数据！你是否已经导出了备份？\n\nWarning: This will clear all your data! Have you exported a backup?')) {
      localStorage.clear();
      indexedDB.deleteDatabase('ModelVault');
      window.location.reload();
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
    } catch (err) {
      alert('导出失败，可能数据已损坏。');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', color: '#fff', background: '#1e1e1e', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#ef4444' }}>⚠️ Oops! 页面崩溃了</h2>
          <p style={{ color: '#aaa', marginBottom: '24px', textAlign: 'center', maxWidth: '400px', lineHeight: '1.5' }}>
            发生了意外错误。你可以先尝试导出当前数据（如果还能读取），然后重置应用。
            <br /><br />
            <span style={{ fontSize: '12px', color: '#ef4444', wordBreak: 'break-all' }}>{this.state.error?.message}</span>
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={this.handleExport} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>抢救性导出数据</button>
            <button onClick={this.handleReset} style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>清空数据并重置</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}