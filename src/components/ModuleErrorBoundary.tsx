import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface ModuleErrorBoundaryProps {
  moduleKey: string;
  onGoHome: () => void;
  children: React.ReactNode;
}

interface ModuleErrorBoundaryState {
  error: Error | null;
}

export class ModuleErrorBoundary extends React.Component<ModuleErrorBoundaryProps, ModuleErrorBoundaryState> {
  state: ModuleErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ModuleErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RL_CONNECT_MODULE_RENDER_FAILED]', {
      moduleKey: this.props.moduleKey,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="max-w-2xl mx-auto mt-10 bg-white border border-amber-200 rounded-3xl shadow-sm p-7 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900">Não foi possível abrir este módulo</h2>
          <p className="text-sm text-slate-600">
            A tela encontrou um dado ou componente inválido. O restante do RH TRANSFORMA continua disponível.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <button type="button" onClick={this.props.onGoHome} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#123657] text-white text-sm font-bold hover:opacity-90">
            <Home className="w-4 h-4" /> Voltar à Visão Geral
          </button>
          <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" /> Recarregar
          </button>
        </div>
        <details className="text-left bg-slate-50 border border-slate-200 rounded-2xl p-3">
          <summary className="cursor-pointer text-xs font-bold text-slate-600">Detalhes técnicos</summary>
          <p className="mt-2 text-xs text-slate-500 break-words">
            Módulo: {this.props.moduleKey} — {this.state.error.message || 'Erro de renderização'}
          </p>
        </details>
      </div>
    );
  }
}
