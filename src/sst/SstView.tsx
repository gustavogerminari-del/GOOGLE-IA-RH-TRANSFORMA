import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Stethoscope, 
  ShieldAlert, 
  HardHat, 
  AlertTriangle, 
  FileText, 
  LayoutDashboard,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

import { useAuth } from '../auth';

import { 
  AmbienteTrabalho, 
  RiscoOcupacional, 
  ProgramaSST, 
  AgendamentoExame, 
  ResultadoExameASO, 
  EpiCatalogo, 
  EntregaEpi, 
  TreinamentoCatalogo, 
  AcidenteTrabalho, 
  ComunicadoCat, 
  AuditoriaSstLog, 
  IndicadoresSST 
} from './types/sstTypes';

import {
  getAmbientesFirestore,
  saveAmbienteFirestore,
  getRiscosOcupacionaisFirestore,
  saveRiscoOcupacionalFirestore,
  getProgramasSstFirestore,
  saveProgramaSstFirestore,
  getAgendamentosExameFirestore,
  saveAgendamentoExameFirestore,
  getResultadosAsoFirestore,
  saveResultadoAsoFirestore,
  getEpisCatalogoFirestore,
  saveEpiCatalogoFirestore,
  getEntregasEpiFirestore,
  saveEntregaEpiFirestore,
  getTreinamentosCatalogoFirestore,
  saveTreinamentoCatalogoFirestore,
  getAcidentesTrabalhoFirestore,
  saveAcidenteTrabalhoFirestore,
  getComunicadosCatFirestore,
  saveComunicadoCatFirestore,
  getAuditoriaSstLogsFirestore,
  registrarLogAuditoriaSst,
  getIndicadoresSstCalculados
} from './services/sstFirestoreService';

// Subcomponents
import { SstDashboard } from './components/SstDashboard';
import { SstMedicinaExames } from './components/SstMedicinaExames';
import { SstRiscosAmbientes } from './components/SstRiscosAmbientes';
import { SstEpisTreinamentos } from './components/SstEpisTreinamentos';
import { SstAcidentesCat } from './components/SstAcidentesCat';
import { SstAuditoriaRelatorios } from './components/SstAuditoriaRelatorios';

export type SstSubTab = 
  | 'visao-geral'
  | 'medicina-exames'
  | 'riscos-ambientes'
  | 'epis-treinamentos'
  | 'acidentes-cat'
  | 'auditoria-relatorios';

interface SstViewProps {
  initialSubTab?: SstSubTab;
}

export const SstView: React.FC<SstViewProps> = ({ initialSubTab = 'visao-geral' }) => {
  const { user } = useAuth();
  const companyId = user?.companyId || user?.empresaId || user?.tenantId || '';

  const [activeTab, setActiveTab] = useState<SstSubTab>(initialSubTab);
  const [loading, setLoading] = useState(true);

  // State
  const [indicadores, setIndicadores] = useState<IndicadoresSST | null>(null);
  const [ambientes, setAmbientes] = useState<AmbienteTrabalho[]>([]);
  const [riscos, setRiscos] = useState<RiscoOcupacional[]>([]);
  const [programas, setProgramas] = useState<ProgramaSST[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoExame[]>([]);
  const [asos, setAsos] = useState<ResultadoExameASO[]>([]);
  const [epis, setEpis] = useState<EpiCatalogo[]>([]);
  const [entregasEpi, setEntregasEpi] = useState<EntregaEpi[]>([]);
  const [treinamentos, setTreinamentos] = useState<TreinamentoCatalogo[]>([]);
  const [acidentes, setAcidentes] = useState<AcidenteTrabalho[]>([]);
  const [cats, setCats] = useState<ComunicadoCat[]>([]);
  const [auditoriaLogs, setAuditoriaLogs] = useState<AuditoriaSstLog[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadSstData() {
      setLoading(true);
      try {
        const [
          indsData,
          ambsData,
          riscosData,
          progsData,
          agendsData,
          asosData,
          episData,
          entregasData,
          treinsData,
          acidsData,
          catsData,
          logsData
        ] = await Promise.all([
          getIndicadoresSstCalculados(companyId),
          getAmbientesFirestore(companyId),
          getRiscosOcupacionaisFirestore(companyId),
          getProgramasSstFirestore(companyId),
          getAgendamentosExameFirestore(companyId),
          getResultadosAsoFirestore(companyId),
          getEpisCatalogoFirestore(companyId),
          getEntregasEpiFirestore(companyId),
          getTreinamentosCatalogoFirestore(companyId),
          getAcidentesTrabalhoFirestore(companyId),
          getComunicadosCatFirestore(companyId),
          getAuditoriaSstLogsFirestore(companyId)
        ]);

        if (isMounted) {
          setIndicadores(indsData);
          setAmbientes(ambsData);
          setRiscos(riscosData);
          setProgramas(progsData);
          setAgendamentos(agendsData);
          setAsos(asosData);
          setEpis(episData);
          setEntregasEpi(entregasData);
          setTreinamentos(treinsData);
          setAcidentes(acidsData);
          setCats(catsData);
          setAuditoriaLogs(logsData);
        }
      } catch (err) {
        console.error('[SST View] Erro ao carregar dados do Firebase:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSstData();
    return () => { isMounted = false; };
  }, [companyId]);

  // Actions
  const handleSaveAmbiente = async (amb: AmbienteTrabalho) => {
    setAmbientes(prev => prev.some(a => a.id === amb.id) ? prev.map(a => a.id === amb.id ? amb : a) : [amb, ...prev]);
    await saveAmbienteFirestore(amb);
    await registrarLogAuditoriaSst({
      companyId,
      userId: user?.id || 'usr-001',
      userName: user?.name || 'Usuário SST',
      entidade: 'Ambiente',
      acao: 'Criar',
      detalhes: `Ambiente ${amb.nome} salvo com sucesso.`
    });
  };

  const handleSaveRisco = async (r: RiscoOcupacional) => {
    setRiscos(prev => prev.some(x => x.id === r.id) ? prev.map(x => x.id === r.id ? r : x) : [r, ...prev]);
    await saveRiscoOcupacionalFirestore(r);
    await registrarLogAuditoriaSst({
      companyId,
      userId: user?.id || 'usr-001',
      userName: user?.name || 'Usuário SST',
      entidade: 'Risco',
      acao: 'Criar',
      detalhes: `Risco ${r.nomeRisco} (${r.grupoRisco}) mapeado.`
    });
  };

  const handleSavePrograma = async (p: ProgramaSST) => {
    setProgramas(prev => prev.some(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]);
    await saveProgramaSstFirestore(p);
  };

  const handleSaveAgendamento = async (ag: AgendamentoExame) => {
    setAgendamentos(prev => prev.some(x => x.id === ag.id) ? prev.map(x => x.id === ag.id ? ag : x) : [ag, ...prev]);
    await saveAgendamentoExameFirestore(ag);
    await registrarLogAuditoriaSst({
      companyId,
      userId: user?.id || 'usr-001',
      userName: user?.name || 'Usuário SST',
      entidade: 'Exame',
      acao: 'Criar',
      detalhes: `Exame ${ag.tipoExame} agendado para ${ag.colaboradorNome}.`
    });
  };

  const handleSaveAso = async (aso: ResultadoExameASO) => {
    setAsos(prev => prev.some(x => x.id === aso.id) ? prev.map(x => x.id === aso.id ? aso : x) : [aso, ...prev]);
    await saveResultadoAsoFirestore(aso);
    await registrarLogAuditoriaSst({
      companyId,
      userId: user?.id || 'usr-001',
      userName: user?.name || 'Usuário SST',
      entidade: 'ASO',
      acao: 'Emitir',
      detalhes: `ASO emitido para ${aso.colaboradorNome} - Status: ${aso.statusAptidao}.`
    });
  };

  const handleSaveEpi = async (epi: EpiCatalogo) => {
    setEpis(prev => prev.some(x => x.id === epi.id) ? prev.map(x => x.id === epi.id ? epi : x) : [epi, ...prev]);
    await saveEpiCatalogoFirestore(epi);
  };

  const handleSaveEntrega = async (ent: EntregaEpi) => {
    setEntregasEpi(prev => prev.some(x => x.id === ent.id) ? prev.map(x => x.id === ent.id ? ent : x) : [ent, ...prev]);
    await saveEntregaEpiFirestore(ent);
    await registrarLogAuditoriaSst({
      companyId,
      userId: user?.id || 'usr-001',
      userName: user?.name || 'Usuário SST',
      entidade: 'EPI',
      acao: 'Assinar',
      detalhes: `Ficha de entrega de ${ent.nomeEpi} registrada para ${ent.colaboradorNome}.`
    });
  };

  const handleSaveTreinamento = async (tr: TreinamentoCatalogo) => {
    setTreinamentos(prev => prev.some(x => x.id === tr.id) ? prev.map(x => x.id === tr.id ? tr : x) : [tr, ...prev]);
    await saveTreinamentoCatalogoFirestore(tr);
  };

  const handleSaveAcidente = async (ac: AcidenteTrabalho) => {
    setAcidentes(prev => prev.some(x => x.id === ac.id) ? prev.map(x => x.id === ac.id ? ac : x) : [ac, ...prev]);
    await saveAcidenteTrabalhoFirestore(ac);
    await registrarLogAuditoriaSst({
      companyId,
      userId: user?.id || 'usr-001',
      userName: user?.name || 'Usuário SST',
      entidade: 'Acidente',
      acao: 'Criar',
      detalhes: `Acidente de trabalho registrado: ${ac.colaboradorNome}.`
    });
  };

  const handleSaveCat = async (c: ComunicadoCat) => {
    setCats(prev => prev.some(x => x.id === c.id) ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev]);
    await saveComunicadoCatFirestore(c);
    await registrarLogAuditoriaSst({
      companyId,
      userId: user?.id || 'usr-001',
      userName: user?.name || 'Usuário SST',
      entidade: 'CAT',
      acao: 'Emitir',
      detalhes: `CAT S-2210 gerada e transmitida ao e-Social para ${c.colaboradorNome}.`
    });
  };

  const navTabs = [
    { id: 'visao-geral', label: 'Visão Geral SST', icon: LayoutDashboard },
    { id: 'medicina-exames', label: 'Medicina & Exames (ASO)', icon: Stethoscope },
    { id: 'riscos-ambientes', label: 'Riscos & Programas (PGR)', icon: ShieldAlert },
    { id: 'epis-treinamentos', label: 'EPIs & Treinamentos NRs', icon: HardHat },
    { id: 'acidentes-cat', label: 'Acidentes & CAT (S-2210)', icon: AlertTriangle },
    { id: 'auditoria-relatorios', label: 'Auditoria & Relatórios', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              Saúde e Segurança do Trabalho (SST) & Medicina Ocupacional
            </h1>
            <p className="text-xs text-slate-500">
              Controle unificado de ASOs, PGR/PCMSO, Entrega de EPIs, Treinamentos NRs e CAT e-Social.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>e-Social S-2210 / S-2220 / S-2240 Prontos</span>
          </span>
        </div>
      </div>

      {/* Submenu Tabs Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SstSubTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-indigo-900 font-bold gap-2">
          <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
          <span>Sincronizando módulo de SST com Firebase Firestore...</span>
        </div>
      )}

      {/* Display Active View */}
      <div>
        {activeTab === 'visao-geral' && (
          <SstDashboard
            indicadores={indicadores}
            asos={asos}
            acidentes={acidentes}
            entregasEpi={entregasEpi}
            onNavigateSubtab={(sub) => setActiveTab(sub as SstSubTab)}
          />
        )}

        {activeTab === 'medicina-exames' && (
          <SstMedicinaExames
            agendamentos={agendamentos}
            asos={asos}
            onSaveAgendamento={handleSaveAgendamento}
            onSaveAso={handleSaveAso}
            userRole={user?.role}
          />
        )}

        {activeTab === 'riscos-ambientes' && (
          <SstRiscosAmbientes
            ambientes={ambientes}
            riscos={riscos}
            programas={programas}
            onSaveAmbiente={handleSaveAmbiente}
            onSaveRisco={handleSaveRisco}
            onSavePrograma={handleSavePrograma}
          />
        )}

        {activeTab === 'epis-treinamentos' && (
          <SstEpisTreinamentos
            epis={epis}
            entregas={entregasEpi}
            treinamentos={treinamentos}
            onSaveEpi={handleSaveEpi}
            onSaveEntrega={handleSaveEntrega}
            onSaveTreinamento={handleSaveTreinamento}
          />
        )}

        {activeTab === 'acidentes-cat' && (
          <SstAcidentesCat
            acidentes={acidentes}
            cats={cats}
            onSaveAcidente={handleSaveAcidente}
            onSaveCat={handleSaveCat}
          />
        )}

        {activeTab === 'auditoria-relatorios' && (
          <SstAuditoriaRelatorios
            logs={auditoriaLogs}
          />
        )}
      </div>
    </div>
  );
};
