import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary - Catches unhandled React errors and shows a friendly fallback UI
 * instead of crashing the entire application.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    declare state: ErrorBoundaryState;
    declare props: Readonly<ErrorBoundaryProps>;

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('[ErrorBoundary] Unhandled error:', error, errorInfo);
    }

    handleReload = (): void => {
        window.location.reload();
    };

    handleGoHome = (): void => {
        window.location.hash = '/';
        window.location.reload();
    };

    render(): React.ReactNode {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark px-6 text-center">
                    <div className="size-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-red-500 text-[40px]">error</span>
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary-light dark:text-white mb-2">
                        ¡Algo salió mal!
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm leading-relaxed">
                        Ocurrió un error inesperado. Puedes intentar recargar la página o volver al inicio.
                    </p>
                    {import.meta.env.DEV && this.state.error && (
                        <pre className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl mb-6 max-w-sm overflow-auto text-left w-full">
                            {this.state.error.message}
                        </pre>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={this.handleReload}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/30 transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            Recargar
                        </button>
                        <button
                            onClick={this.handleGoHome}
                            className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-3 px-6 rounded-xl transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">home</span>
                            Inicio
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
