import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#05140C] text-white flex items-center justify-center p-4 text-center font-cairo">
          <div className="max-w-md w-full bg-[#092015] border border-[#10B981]/40 rounded-3xl p-8 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-amber-200">
              حدث تنبيه غير متوقع أثناء المعالجة
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              تم تسجيل المشكلة بأمان. يمكنك الضغط على الزر أدناه لإعادة تحميل الصفحة ومتابعة تصفح المعرض.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#34D399] to-[#10B981] text-[#05140C] font-bold text-sm hover:from-[#6EE7B7] transition-all cursor-pointer shadow-lg shadow-[#10B981]/25"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة تحميل الصفحة</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
