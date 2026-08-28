import React from 'react';
import { 
  Building2, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Calendar, 
  AlertTriangle,
  Receipt,
  Bell,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { 
  HeadhunterClient, 
  HeadhunterJob, 
  HeadhunterCommission, 
  HeadhunterExpense, 
  HeadhunterInterview, 
  HeadhunterEvent,
  HeadhunterLead,
  HeadhunterCandidate,
  HeadhunterFinanceItem
} from '../types';

interface HeadhunterDashboardProps {
  clients: HeadhunterClient[];
  jobs: HeadhunterJob[];
  commissions: HeadhunterCommission[];
  expenses: HeadhunterExpense[];
  interviews: HeadhunterInterview[];
  events: HeadhunterEvent[];
  leads?: HeadhunterLead[];
  candidates?: HeadhunterCandidate[];
  financial?: HeadhunterFinanceItem[];
  onNavigateTab: (tab: any) => void;
  onOpenAiModal: (type: string, data?: any) => void;
}

export const HeadhunterDashboard: React.FC<HeadhunterDashboardProps> = ({
  clients = [],
  jobs = [],
  commissions = [],
  expenses = [],
  interviews = [],
  events = [],
  leads = [],
  candidates = [],
  financial = [],
  onNavigateTab,
  onOpenAiModal
}) => {
  // 1. Projetos Ativos
  const projetosAtivos = jobs.filter(j => 
    j.status === 'Aberta' || 
    j.status === 'Busca ativa' || 
    j.status === 'Em Andamento' || 
    j.status === 'ativa'
  );

  // 2. Clientes Ativos
  const clientesAtivos = clients.filter(c => c.status === 'Ativo');

  // 3. Receita Prevista
  const receitaPrevistaValor = jobs
    .filter(j => j.status !== 'Cancelada' && j.status !== 'Arquivada')
    .reduce((acc, j) => acc + (j.comissaoCalculada || j.valorVaga || j.valorNegociado || 0), 0);

  // 4. Receita Recebida
  const receitaRecebidaValor = financial
    .filter(f => f.tipo === 'Receita' && f.statusFinanceiro === 'Pago')
    .reduce((acc, f) => acc + f.valor, 0);

  // 5. Contas a Receber
  const contasAReceberList = financial.filter(f => f.tipo === 'Receita' && f.statusFinanceiro === 'Pendente');
  const contasAReceberValor = contasAReceberList.reduce((acc, f) => acc + f.valor, 0);

  // 6. Entrevistas Hoje
  const hojeStr = new Date().toISOString().split('T')[0];
  const entrevistasHojeList = interviews.filter(i => 
    (i.dataHora && i.dataHora.startsWith(hojeStr)) || i.status === 'Agendada'
  );

  // 7. Projetos Próximos do Prazo
  const projetosProximosPrazoList = jobs.filter(j => {
    if (j.status === 'Fechada' || j.status === 'Concluída') return false;
    const sla = j.slaDias || 30;
    const isNear = sla <= 15 || (j.deadline && new Date(j.deadline).getTime() - new Date().getTime() < 7 * 86400000);
    return isNear;
  });

  // 8. Alertas
  const alertas: Array<{ id: string; tipo: 'urgente' | 'aviso' | 'info'; titulo: string; mensagem: string }> = [];

  if (contasAReceberList.length > 0) {
    alertas.push({
      id: 'alt-fin-1',
      tipo: 'aviso',
      titulo: 'Contas a Receber Pendentes',
      mensagem: `Existem ${contasAReceberList.length} parcelas de honorários pendentes totalizando R$ ${contasAReceberValor.toLocaleString('pt-BR')}.`
    });
  }

  if (projetosProximosPrazoList.length > 0) {
    alertas.push({
      id: 'alt-prazo-1',
      tipo: 'urgente',
      titulo: 'Projetos Próximos do Prazo Final',
      mensagem: `${projetosProximosPrazoList.length} projetos de Executive Search exigem atenção no SLA de apresentação de candidatos.`
    });
  }

  if (entrevistasHojeList.length > 0) {
    alertas.push({
      id: 'alt-ent-1',
      tipo: 'info',
      titulo: 'Entrevistas Programadas',
      mensagem: `${entrevistasHojeList.length} entrevista(s) agendada(s) para hoje.`
    });
  }

  if (alertas.length === 0) {
    alertas.push({
      id: 'alt-ok',
      tipo: 'info',
      titulo: 'Operação em Dia',
      mensagem: 'Não existem alertas pendentes no momento. Todos os projetos estão em andamento normal.'
    });
  }

  return (
    <div className="space-y-6">
      {/* Native Page Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Visão Geral do Headhunter
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {projetosAtivos.length} projetos ativos
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Painel simplificado de acompanhamento de projetos de Executive Search, faturamento e alertas operacionais.
          </p>
        </div>
      </div>

      {/* 8 Core Metrics Grid (ALTERAÇÃO 08) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* 1. Projetos Ativos */}
        <div 
          onClick={() => onNavigateTab('vagas')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Projetos Ativos</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{projetosAtivos.length}</p>
          <span className="text-xs text-indigo-600 font-extrabold flex items-center gap-1">
            Ver Projetos <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* 2. Clientes Ativos */}
        <div 
          onClick={() => onNavigateTab('clientes')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Clientes Ativos</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{clientesAtivos.length}</p>
          <span className="text-xs text-slate-600 font-extrabold flex items-center gap-1">
            Ver Clientes <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* 3. Receita Prevista */}
        <div 
          onClick={() => onNavigateTab('financeiro')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Receita Prevista</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            R$ {(receitaPrevistaValor / 1000).toFixed(0)}k
          </p>
          <span className="text-xs text-emerald-600 font-extrabold flex items-center gap-1">
            Ver Financeiro <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* 4. Receita Recebida */}
        <div 
          onClick={() => onNavigateTab('financeiro')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Receita Recebida</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600">
            R$ {(receitaRecebidaValor / 1000).toFixed(0)}k
          </p>
          <span className="text-xs text-indigo-600 font-extrabold flex items-center gap-1">
            Ver Faturamento <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* 5. Contas a Receber */}
        <div 
          onClick={() => onNavigateTab('financeiro')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-400 transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Contas a Receber</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700">
            R$ {(contasAReceberValor / 1000).toFixed(0)}k
          </p>
          <span className="text-xs text-amber-600 font-extrabold flex items-center gap-1">
            {contasAReceberList.length} parcelas pendentes
          </span>
        </div>

        {/* 6. Entrevistas Hoje */}
        <div 
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-400 transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Entrevistas Hoje</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{entrevistasHojeList.length}</p>
          <span className="text-xs text-purple-600 font-extrabold">Agendadas para o dia</span>
        </div>

        {/* 7. Projetos Próximos do Prazo */}
        <div 
          onClick={() => onNavigateTab('vagas')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-400 transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Próximos do Prazo</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-600">{projetosProximosPrazoList.length}</p>
          <span className="text-xs text-rose-600 font-extrabold flex items-center gap-1">
            Atenção ao SLA <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* 8. Total de Alertas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Alertas Ativos</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{alertas.length}</p>
          <span className="text-xs text-slate-500 font-bold">Notificações operacionais</span>
        </div>

      </div>

      {/* Alertas Details Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <span>Central de Alertas & Notificações</span>
        </h3>

        <div className="space-y-3">
          {alertas.map(alt => (
            <div 
              key={alt.id}
              className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                alt.tipo === 'urgente'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : alt.tipo === 'aviso'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
              }`}
            >
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-0.5 flex-1">
                <h4 className="font-extrabold text-xs">{alt.titulo}</h4>
                <p className="text-xs font-medium opacity-90">{alt.mensagem}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
