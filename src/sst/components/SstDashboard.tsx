import React from 'react';
import { 
  ShieldAlert, 
  Stethoscope, 
  HardHat, 
  GraduationCap, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Activity, 
  UserX, 
  ShieldCheck,
  Building,
  Calendar
} from 'lucide-react';
import { IndicadoresSST, ResultadoExameASO, AcidenteTrabalho, EntregaEpi } from '../types/sstTypes';

interface SstDashboardProps {
  indicadores: IndicadoresSST | null;
  asos: ResultadoExameASO[];
  acidentes: AcidenteTrabalho[];
  entregasEpi: EntregaEpi[];
  onNavigateSubtab: (tab: string) => void;
}

export const SstDashboard: React.FC<SstDashboardProps> = ({
  indicadores,
  asos,
  acidentes,
  entregasEpi,
  onNavigateSubtab
}) => {
  const ind = indicadores || {
    totalColaboradores: 48,
    examesEmDiaCount: 38,
    examesProximosCount: 4,
    examesVencidosCount: 2,
    colaboradoresSemAsoValidoCount: 3,
    episVencidosCount: 1,
    episSemAssinaturaCount: 1,
    treinamentosVencidosCount: 2,
    treinamentosProximosCount: 3,
    acidentesAnoCount: 1,
    catsPendentesCount: 1,
    afastamentosSstActivosCount: 1,
    retornosPrevistosCount: 1,
    restricoesAtivasCount: 1,
    documentosPendentesCount: 2,
    taxaFrequenciaAcidentes: 5,
    taxaGravidadeAcidentes: 15,
    diasPerdidosTotal: 3
  };

  const vencidosASO = asos.filter(a => a.status === 'Vigente' && a.dataProximoExame < new Date().toISOString().split('T')[0]);
  const acidentesPendentes = acidentes.filter(a => a.statusInvestigacao !== 'Concluído');

  return (
    <div className="space-y-6">
      {/* Banner de Status e Resumo e-Social */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Conformidade e-Social S-2210 / S-2220 / S-2240
            </span>
            <span className="text-xs text-slate-400 font-medium">Empresa Matriz</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Painel Geral de Saúde e Segurança do Trabalho (SST)
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Gestão integrada de Medicina Ocupacional, Exames Periódicos, Programas de Risco (PGR/PCMSO), Entrega de EPIs com Assinatura Eletrônica, Treinamentos Obrigatórios e Comunicação de Acidentes (CAT).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateSubtab('medicina-exames')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Agendar Exame</span>
          </button>
          <button
            onClick={() => onNavigateSubtab('acidentes-cat')}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Registrar Acidente</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Medicina / Exames */}
        <div 
          onClick={() => onNavigateSubtab('medicina-exames')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ASO / Exames</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{ind.examesEmDiaCount}</span>
            <span className="text-xs font-semibold text-emerald-600">em dia ({Math.round((ind.examesEmDiaCount / ind.totalColaboradores) * 100)}%)</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-amber-600 font-bold">{ind.examesProximosCount} a vencer</span>
            <span className="text-rose-600 font-bold">{ind.examesVencidosCount} vencidos</span>
          </div>
        </div>

        {/* EPIs e Estoque */}
        <div 
          onClick={() => onNavigateSubtab('epis-treinamentos')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">EPIs & Ficha Digital</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <HardHat className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{entregasEpi.length}</span>
            <span className="text-xs font-semibold text-slate-500">entregas ativas</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-rose-600 font-bold">{ind.episVencidosCount} trocas pendentes</span>
            <span className="text-amber-600 font-bold">{ind.episSemAssinaturaCount} sem ass.</span>
          </div>
        </div>

        {/* Treinamentos Ocupacionais */}
        <div 
          onClick={() => onNavigateSubtab('epis-treinamentos')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Treinamentos NRs</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">92%</span>
            <span className="text-xs font-semibold text-emerald-600">cobertura geral</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-amber-600 font-bold">{ind.treinamentosProximosCount} a vencer</span>
            <span className="text-rose-600 font-bold">{ind.treinamentosVencidosCount} vencidos</span>
          </div>
        </div>

        {/* Acidentes e CAT */}
        <div 
          onClick={() => onNavigateSubtab('acidentes-cat')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Acidentes & CAT</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{ind.acidentesAnoCount}</span>
            <span className="text-xs font-semibold text-slate-500">ocorridos este ano</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-bold">TF: {ind.taxaFrequenciaAcidentes}</span>
            <span className="text-rose-600 font-bold">{ind.catsPendentesCount} CATs pendentes</span>
          </div>
        </div>
      </div>

      {/* Seção de Alertas Críticos e Pendências Operacionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de Alertas em Destaque */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Pendências e Alertas de Conformidade</h3>
            </div>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-lg border border-amber-200/60">
              Ação Requerida
            </span>
          </div>

          <div className="space-y-3">
            {vencidosASO.length > 0 ? (
              vencidosASO.map(aso => (
                <div key={aso.id} className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <UserX className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">{aso.colaboradorNome} <span className="text-slate-500 font-normal">({aso.cargo})</span></p>
                      <p className="text-[11px] text-rose-700 font-semibold">ASO Vencido em {aso.dataProximoExame}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onNavigateSubtab('medicina-exames')}
                    className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors shrink-0 cursor-pointer"
                  >
                    Agendar
                  </button>
                </div>
              ))
            ) : (
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Nenhum ASO vencido no momento. Todos os colaboradores ativos com exames em dia.</span>
              </div>
            )}

            {acidentesPendentes.length > 0 && (
              <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900">Investigação de Acidente em Aberto</p>
                    <p className="text-[11px] text-amber-700 font-semibold">
                      {acidentesPendentes[0].colaboradorNome} - {acidentesPendentes[0].descricaoResumida}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => onNavigateSubtab('acidentes-cat')}
                  className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors shrink-0 cursor-pointer"
                >
                  Ver CAT
                </button>
              </div>
            )}

            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">Restrição Médica Ativa</p>
                  <p className="text-[11px] text-blue-700 font-semibold">
                    Marcos Vinicius Costa (Logística) - Restrição temporária para cargas acima de 10kg.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onNavigateSubtab('medicina-exames')}
                className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shrink-0 cursor-pointer"
              >
                Detalhes
              </button>
            </div>
          </div>
        </div>

        {/* Indicadores Estatísticos & e-Social */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Indicadores de Taxa de Frequência & Gravidade</h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Período Anual</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Taxa Frequência (TF)</span>
              <p className="text-xl font-black text-slate-900">{ind.taxaFrequenciaAcidentes}</p>
              <p className="text-[10px] text-slate-500">Acidentes / Milhão de HHT</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Taxa Gravidade (TG)</span>
              <p className="text-xl font-black text-slate-900">{ind.taxaGravidadeAcidentes}</p>
              <p className="text-[10px] text-slate-500">Dias perdidos / Milhão HHT</p>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Programas de SST Ativos (PGR / PCMSO / LTCAT)</h4>
            <div className="space-y-2">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800">PGR 2025 (v2.0)</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Vigente até Jan/2026</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800">PCMSO 2025 (v1.5)</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Vigente até Jan/2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
