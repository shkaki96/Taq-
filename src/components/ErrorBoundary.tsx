import React, { Component, ErrorInfo, ReactNode } from 'react';
import i18n from '../i18n';
import { Language } from '../types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  lang?: Language;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const activeLang = this.props.lang || (i18n.language as Language) || 'ar';
      const t = i18n.getFixedT(activeLang);

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-red-950/30 border border-red-800 rounded-xl">
          <h2 className="text-xl font-bold text-red-400 mb-2">
            {t('common.errorBoundary.title', { defaultValue: 'حدث خطأ في هذه المحاكاة' })}
          </h2>
          <p className="text-gray-400 mb-4 text-sm max-w-md">
            {t('common.errorBoundary.description', {
              defaultValue: 'حدث خطأ غير متوقع. يمكنك إعادة المحاولة أو اختيار تجربة أخرى.',
            })}
          </p>
          <button
            onClick={this.handleReset}
            className="px-5 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition"
          >
            {t('common.errorBoundary.retry', { defaultValue: 'إعادة المحاولة' })}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
