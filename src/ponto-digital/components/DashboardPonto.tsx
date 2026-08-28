import React from 'react';
import { 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  UserCheck,
  MapPin,
  Camera
} from 'lucide-react';
import { RegistroPontoDoc, FuncionarioPontoInfo, SubMenuPonto } from '../types/ponto';

interface DashboardPontoProps {
  registros: RegistroPontoDoc[];
  funcionarios: FuncionarioPontoInfo[];
  onNavigateSubmenu: (submenu: SubMenuPonto) => void;
  onAbrirRegistroPonto: () => void;
}

export const DashboardPonto: React.FC<DashboardPontoProps> = ({
  registros,
  funcionarios,
  onNavigateSubmenu,
  onAbrirRegistroPonto,
}) => {
  const trabalhando = funcionarios.filter(f => f.statusLivePonto === 'Trabalhando').length;
  const intervalo = funcionarios.filter(f => f.statusLivePonto === 'Intervalo').length;
  const ausente = funcionarios.filter(f => f.statusLivePonto === 'Ausente' || !f.statusLivePonto).length;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-100 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Portaria MTE 671 Compliance & Criptografia GPS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Ponto Digital RH TRANSFORMA</h1>
            <p className="text-emerald-100 text-sm sm:text-base mt-1 max-w-xl">
              Controle de jornada inteligente, geofencing GPS, reconhecimento por foto e sincronização automática com a Folha de Pagamento.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onAbrirRegistroPonto}
              className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Bater Ponto Agora</span>
            </button>
            <button
              onClick={() => onNavigateSubmenu('gestor')}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-3 rounded-xl text-sm transition-all backdrop-blur-md cursor-pointer flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Painel do Gestor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Trabalhando Agora</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{trabalhando}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> 🟢 Ativos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Em expediente presencial ou remoto</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Em Intervalo</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{intervalo}</span>
            <span className="text-xs font-semibold text-amber-600 flex items-center">
              🟡 Almoço/Pausa
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Retorno previsto em até 1 hora</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ausentes / Fora</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{ausente}</span>
            <span className="text-xs font-semibold text-rose-600 flex items-center">
              🔴 Ausente
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Folgas, férias ou não iniciaram</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Horas Extras Mês</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">+42,5h</span>
            <span className="text-xs font-semibold text-teal-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> Banco
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Acumulado na equipe este mês</p>
        </div>
      </div>

      {/* Quick Access & Live Team Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Submenu Shortcuts */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            Módulos Rápidos de Ponto
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => onNavigateSubmenu('meu-ponto')}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-900">Meu Ponto</p>
                <p className="text-xs text-slate-500">Seu espelho diário e banco pessoal</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>

            <button
              onClick={() => onNavigateSubmenu('espelho')}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-900">Espelho de Ponto</p>
                <p className="text-xs text-slate-500">Acompanhar batidas e exportar PDF</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>

            <button
              onClick={() => onNavigateSubmenu('ajustes')}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-900">Solicitações & Ajustes</p>
                <p className="text-xs text-slate-500">Aprovação de batidas esquecidas</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>

            <button
              onClick={() => onNavigateSubmenu('integracao-folha')}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-900">Integração com a Folha</p>
                <p className="text-xs text-slate-500">Sincronizar HE, faltas e adicional</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Live Employee Status Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Status em Tempo Real da Equipe
            </h3>
            <button
              onClick={() => onNavigateSubmenu('gestor')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Ver Todos ({funcionarios.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {funcionarios.map(func => (
              <div key={func.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs border border-slate-200">
                    {(func.nome || (func as any).nomeCompleto || 'C').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{func.nome || (func as any).nomeCompleto || 'Colaborador'}</p>
                    <p className="text-xs text-slate-500">{func.cargo} • {func.setor}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    func.statusLivePonto === 'Trabalhando'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : func.statusLivePonto === 'Intervalo'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      func.statusLivePonto === 'Trabalhando' ? 'bg-emerald-500 animate-pulse' :
                      func.statusLivePonto === 'Intervalo' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    {func.statusLivePonto || 'Ausente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
