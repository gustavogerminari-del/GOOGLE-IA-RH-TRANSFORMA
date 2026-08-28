import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Calculator, 
  Gift, 
  Umbrella, 
  LogOut, 
  FileText, 
  BarChart2, 
  Settings, 
  LayoutDashboard, 
  UserPlus, 
  ShieldAlert, 
  Key,
  HeartPulse,
  Network,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../auth';
import { SstView } from '../sst/SstView';

// Import Types and Seeds
import { 
  ColaboradorCompleto, 
  ItemBeneficio, 
  RegistroFeriasColaborador, 
  CalculoRescisorio, 
  AfastamentoColaborador, 
  DocumentoColaborador, 
  AjustePontoColaborador, 
  AdmissaoPending, 
  ConfiguracoesTrabalhistas 
} from './types/dp';

// Import Firestore Service
import { 
  getColaboradoresFirestore, 
  saveColaboradorFirestore, 
  getBeneficiosFirestore, 
  saveBeneficioFirestore, 
  getFeriasFirestore, 
  saveFeriasFirestore, 
  getAfastamentosFirestore, 
  saveAfastamentoFirestore, 
  getDocumentosFirestore, 
  saveDocumentoFirestore, 
  getAjustesPontoFirestore, 
  saveAjustePontoFirestore, 
  getRescisoesFirestore, 
  concluirRescisaoEBloquearColaborador, 
  getAdmissoesPendenteFirestore, 
  saveAdmissaoFirestore,
  deleteAdmissaoFirestore,
  concluirEfetivacaoAdmissao, 
  getConfigTrabalhistaFirestore, 
  saveConfigTrabalhistaFirestore 
} from './services/dpFirestoreService';

import { 
  getDPAlertsFirestore, 
  updateDPAlertStatusFirestore 
} from './services/dpAnalyticsService';
import { DPAlertItem, AlertStatus } from './types/dp';

// Import Submenu Components
import { DpDashboard } from './components/DpDashboard';
import { CadastroColaboradores } from './components/CadastroColaboradores';
import { PontoDigitalView } from '../ponto-digital/PontoDigitalView';
import { GestaoAdmissoes } from './components/GestaoAdmissoes';
import { PayrollView } from '../payroll/PayrollView';
import { GestaoBeneficios } from './components/GestaoBeneficios';
import { GestaoFerias } from './components/GestaoFerias';
import { GestaoAfastamentos } from './components/GestaoAfastamentos';
import { CalculoRescisao } from './components/CalculoRescisao';
import { DocumentsSignatureView } from '../documents-signature/DocumentsSignatureView';
import { RelatoriosDpView } from './components/RelatoriosDpView';
import { ConfiguracoesTrabalhistasView } from './components/ConfiguracoesTrabalhistas';
import { PainelAcessosPortal } from './components/PainelAcessosPortal';
import { OrganogramaEmpresa } from './components/OrganogramaEmpresa';
import { GestaoCargosSalarios } from './components/GestaoCargosSalarios';

export type DPSubTab = 
  | 'visao-geral' 
  | 'colaboradores' 
  | 'organograma'
  | 'cargos-salarios'
  | 'ponto-digital' 
  | 'admissoes' 
  | 'beneficios' 
  | 'ferias-afastamentos' 
  | 'sst'
  | 'documentos' 
  | 'rescisao' 
  | 'folha-pagamento' 
  | 'relatorios-dp' 
  | 'acessos-portal' 
  | 'configuracoes-trabalhistas';

interface DepartamentoPessoalViewProps {
  initialSubTab?: DPSubTab;
  selectedAdmissionId?: string | null;
}

export const DepartamentoPessoalView: React.FC<DepartamentoPessoalViewProps> = ({
  initialSubTab = 'visao-geral',
  selectedAdmissionId
}) => {
  const { user, isModuleActive } = useAuth();
  const companyId = user?.companyId || user?.empresaId || user?.tenantId;
  const isMaster = user?.role === 'Super Administrador' || user?.tipoUsuario === 'MASTER';

  const [activeSubTab, setActiveSubTab] = useState<DPSubTab>(() => {
    if (selectedAdmissionId) return 'admissoes';
    return initialSubTab;
  });
  const [loadingFirestore, setLoadingFirestore] = useState(true);

  // Firestore State
  const [colaboradores, setColaboradores] = useState<ColaboradorCompleto[]>([]);
  const [beneficios, setBeneficios] = useState<ItemBeneficio[]>([]);
  const [feriasList, setFeriasList] = useState<RegistroFeriasColaborador[]>([]);
  const [afastamentos, setAfastamentos] = useState<AfastamentoColaborador[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoColaborador[]>([]);
  const [ajustesPonto, setAjustesPonto] = useState<AjustePontoColaborador[]>([]);
  const [rescisoes, setRescisoes] = useState<CalculoRescisorio[]>([]);
  const [admissoes, setAdmissoes] = useState<AdmissaoPending[]>([]);
  const [alerts, setAlerts] = useState<DPAlertItem[]>([]);
  const [configTrabalhista, setConfigTrabalhista] = useState<ConfiguracoesTrabalhistas | null>(null);

  // Sync state with prop if changed
  useEffect(() => {
    if (selectedAdmissionId) {
      setActiveSubTab('admissoes');
    } else if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab, selectedAdmissionId]);

  // Load all DP Data from Firebase Firestore
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoadingFirestore(true);
      try {
        const [
          colabsData,
          bensData,
          feriasData,
          afastData,
          docsData,
          ajustesData,
          rescData,
          admsData,
          cfgData,
          alertsData
        ] = await Promise.all([
          getColaboradoresFirestore(companyId),
          getBeneficiosFirestore(companyId),
          getFeriasFirestore(companyId),
          getAfastamentosFirestore(companyId),
          getDocumentosFirestore(companyId),
          getAjustesPontoFirestore(companyId),
          getRescisoesFirestore(companyId),
          getAdmissoesPendenteFirestore(companyId),
          getConfigTrabalhistaFirestore(companyId),
          getDPAlertsFirestore(companyId)
        ]);

        if (isMounted) {
          setColaboradores(colabsData);
          setBeneficios(bensData);
          setFeriasList(feriasData);
          setAfastamentos(afastData);
          setDocumentos(docsData);
          setAjustesPonto(ajustesData);
          setRescisoes(rescData);
          setAdmissoes(admsData);
          setConfigTrabalhista(cfgData);
          setAlerts(alertsData);
        }
      } catch (err) {
        console.error('[DP] Erro ao carregar dados do Firebase:', err);
      } finally {
        if (isMounted) {
          setLoadingFirestore(false);
        }
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [companyId]);

  const handleUpdateAlertStatus = async (alertId: string, status: AlertStatus, ignoreReason?: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status, ignoreReason } : a));
    await updateDPAlertStatusFirestore(alertId, status, user?.name, ignoreReason);
  };

  // Action Handlers bound to Firestore
  const handleSalvarColaborador = async (colab: ColaboradorCompleto) => {
    const updated = colaboradores.some(c => c.id === colab.id)
      ? colaboradores.map(c => c.id === colab.id ? colab : c)
      : [colab, ...colaboradores];
    setColaboradores(updated);
    await saveColaboradorFirestore(colab);
  };

  const handleSalvarAdmissao = async (admissao: AdmissaoPending) => {
    await saveAdmissaoFirestore(admissao);
    const updated = admissoes.some(a => a.id === admissao.id)
      ? admissoes.map(a => a.id === admissao.id ? admissao : a)
      : [admissao, ...admissoes];
    setAdmissoes(updated);
  };

  const handleDeletarAdmissao = async (admissaoId: string) => {
    setAdmissoes(prev => prev.filter(a => a.id !== admissaoId));
    await deleteAdmissaoFirestore(admissaoId);
  };

  const handleEfetivarAdmissao = async (
    admissao: AdmissaoPending,
    dadosAdicionais?: { gestor?: string; escala?: string; bancoAgencia?: string; rg?: string }
  ) => {
    const novoColab = await concluirEfetivacaoAdmissao(admissao, dadosAdicionais);
    setColaboradores(prev => [novoColab, ...prev.filter(c => c.id !== novoColab.id)]);
    setAdmissoes(prev => prev.map(a => a.id === admissao.id ? { ...a, status: 'Efetivado' } : a));
    return novoColab;
  };

  const handleSalvarBeneficio = async (ben: ItemBeneficio) => {
    const updated = beneficios.some(b => b.id === ben.id)
      ? beneficios.map(b => b.id === ben.id ? ben : b)
      : [ben, ...beneficios];
    setBeneficios(updated);
    await saveBeneficioFirestore(ben);
  };

  const handleSalvarFerias = async (f: RegistroFeriasColaborador) => {
    const updated = feriasList.some(item => item.id === f.id)
      ? feriasList.map(item => item.id === f.id ? f : item)
      : [f, ...feriasList];
    setFeriasList(updated);
    await saveFeriasFirestore(f);
  };

  const handleSalvarRescisao = async (r: CalculoRescisorio) => {
    const updated = rescisoes.some(item => item.id === r.id)
      ? rescisoes.map(item => item.id === r.id ? r : item)
      : [r, ...rescisoes];
    setRescisoes(updated);
    
    if (r.status === 'Homologado') {
      await concluirRescisaoEBloquearColaborador(r);
      // Reload colaboradores to reflect status = 'Rescindido'
      const freshColabs = await getColaboradoresFirestore(companyId);
      setColaboradores(freshColabs);
    }
  };

  const handleSalvarConfig = async (cfg: ConfiguracoesTrabalhistas) => {
    setConfigTrabalhista(cfg);
    await saveConfigTrabalhistaFirestore(cfg);
  };

  // RH_DP_SUBTABS_BY_MODULE_V2
  // Cada função pertence a um único módulo operacional.
  // O núcleo DP não duplica funções de Equipe, Ponto, Benefícios, Documentos, Folha ou Relatórios.
  const allSubMenuItems = [
    { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard, module: 'departamentoPessoal' },
    { id: 'colaboradores', label: 'Colaboradores', icon: Users, module: 'equipeInterna' },
    { id: 'organograma', label: 'Organograma', icon: Network, module: 'equipeInterna' },
    { id: 'cargos-salarios', label: 'Cargos e Salários', icon: Briefcase, module: 'equipeInterna' },
    { id: 'admissoes', label: 'Admissões', icon: UserPlus, module: 'equipeInterna' },
    { id: 'ponto-digital', label: 'Ponto e Jornada', icon: Clock, module: 'ponto' },
    { id: 'beneficios', label: 'Benefícios', icon: Gift, module: 'feriasBeneficios' },
    { id: 'ferias-afastamentos', label: 'Férias e Afastamentos', icon: Umbrella, module: 'feriasBeneficios' },
    { id: 'sst', label: 'Saúde e Segurança (SST)', icon: HeartPulse, module: 'departamentoPessoal' },
    { id: 'rescisao', label: 'Rescisões', icon: LogOut, module: 'departamentoPessoal' },
    { id: 'acessos-portal', label: 'Acessos ao Portal', icon: Key, module: 'departamentoPessoal' },
    { id: 'configuracoes-trabalhistas', label: 'Configurações Trabalhistas', icon: Settings, module: 'departamentoPessoal' },
    { id: 'documentos', label: 'Documentos', icon: FileText, module: 'documentosAssinatura' },
    { id: 'folha-pagamento', label: 'Folha de Pagamento', icon: Calculator, module: 'folha' },
    { id: 'relatorios-dp', label: 'Relatórios', icon: BarChart2, module: 'relatoriosAvancados' },
  ];

  const resolveSubTabModuleContext = (tab: DPSubTab) => {
    if (['colaboradores', 'organograma', 'cargos-salarios', 'admissoes'].includes(tab)) return 'equipeInterna';
    if (tab === 'ponto-digital') return 'ponto';
    if (['beneficios', 'ferias-afastamentos'].includes(tab)) return 'feriasBeneficios';
    if (tab === 'documentos') return 'documentosAssinatura';
    if (tab === 'folha-pagamento') return 'folha';
    if (tab === 'relatorios-dp') return 'relatoriosAvancados';
    return 'departamentoPessoal';
  };

  const moduleContext = resolveSubTabModuleContext(selectedAdmissionId ? 'admissoes' : initialSubTab);

  const allowedSubTabsByContext: Record<string, DPSubTab[]> = {
    departamentoPessoal: ['visao-geral', 'sst', 'rescisao', 'acessos-portal', 'configuracoes-trabalhistas'],
    equipeInterna: ['colaboradores', 'organograma', 'cargos-salarios', 'admissoes'],
    ponto: ['ponto-digital'],
    feriasBeneficios: ['beneficios', 'ferias-afastamentos'],
    documentosAssinatura: ['documentos'],
    folha: ['folha-pagamento'],
    relatoriosAvancados: ['relatorios-dp'],
  };

  const subMenuItems = allSubMenuItems.filter(item => {
    const allowedTabs = allowedSubTabsByContext[moduleContext] || allowedSubTabsByContext.departamentoPessoal;
    if (!allowedTabs.includes(item.id as DPSubTab)) return false;
    if (isMaster) return true;
    return isModuleActive(item.module);
  });

  const showSubMenuNavigation = subMenuItems.length > 1;

  return (
    <div className="space-y-6">
      {/* Submenu Navigation Bar — somente funções do módulo atual */}
      {showSubMenuNavigation && (
      <div data-dp-navigation="RH_DP_SUBTABS_BY_MODULE_V2" className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {subMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id as DPSubTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#1E293B] hover:bg-slate-100/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Loading Indicator for Firebase */}
      {loadingFirestore && (
        <div className="flex items-center justify-center p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-indigo-900 font-bold gap-2">
          <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Sincronizando Departamento Pessoal com Firebase Firestore...</span>
        </div>
      )}

      {/* Main View Display */}
      <div>
        {activeSubTab === 'visao-geral' && (
          <DpDashboard
            userRole={user?.role || 'RH'}
            companyId={companyId}
            colaboradores={colaboradores}
            ferias={feriasList}
            rescisoes={rescisoes}
            afastamentos={afastamentos}
            documentos={documentos}
            ajustesPonto={ajustesPonto}
            admissoes={admissoes}
            alerts={alerts}
            onUpdateAlertStatus={handleUpdateAlertStatus}
            onNavigateSubTab={(tab) => setActiveSubTab(tab as DPSubTab)}
          />
        )}

        {activeSubTab === 'colaboradores' && (
          <CadastroColaboradores
            colaboradores={colaboradores}
            onSalvarColaborador={handleSalvarColaborador}
            companyId={companyId}
            onOpenNovaAdmissao={() => setActiveSubTab('admissoes')}
          />
        )}

        {activeSubTab === 'organograma' && (
          <OrganogramaEmpresa
            companyId={companyId}
            colaboradores={colaboradores}
          />
        )}

        {activeSubTab === 'cargos-salarios' && (
          <GestaoCargosSalarios
            companyId={companyId}
            colaboradores={colaboradores}
          />
        )}

        {activeSubTab === 'ponto-digital' && (
          <PontoDigitalView />
        )}

        {activeSubTab === 'admissoes' && (
          <GestaoAdmissoes
            admissoes={admissoes}
            colaboradores={colaboradores}
            onEfetivarAdmissao={handleEfetivarAdmissao}
            onSalvarAdmissao={handleSalvarAdmissao}
            onDeletarAdmissao={handleDeletarAdmissao}
            companyId={companyId}
            selectedAdmissionId={selectedAdmissionId}
          />
        )}

        {activeSubTab === 'folha-pagamento' && (
          <PayrollView />
        )}

        {activeSubTab === 'beneficios' && (
          <GestaoBeneficios
            beneficios={beneficios}
            colaboradores={colaboradores}
            onSalvarBeneficio={handleSalvarBeneficio}
            companyId={companyId}
          />
        )}

        {activeSubTab === 'ferias-afastamentos' && (
          <div className="space-y-8">
            <GestaoFerias
              feriasList={feriasList}
              colaboradores={colaboradores}
              onSalvarFerias={handleSalvarFerias}
              companyId={companyId}
            />

            <GestaoAfastamentos
              colaboradores={colaboradores}
              companyId={companyId}
            />
          </div>
        )}

        {activeSubTab === 'sst' && (
          <SstView />
        )}

        {activeSubTab === 'rescisao' && (
          <CalculoRescisao
            rescisoes={rescisoes}
            colaboradores={colaboradores}
            onSalvarRescisao={handleSalvarRescisao}
            companyId={companyId}
          />
        )}

        {activeSubTab === 'documentos' && (
          <DocumentsSignatureView />
        )}

        {activeSubTab === 'relatorios-dp' && (
          <RelatoriosDpView
            companyId={companyId}
            colaboradores={colaboradores}
            beneficios={beneficios}
            ferias={feriasList}
            rescisoes={rescisoes}
            afastamentos={afastamentos}
          />
        )}

        {activeSubTab === 'configuracoes-trabalhistas' && (
          <ConfiguracoesTrabalhistasView
            config={configTrabalhista || {
              companyId,
              toleranciaPontoMinutos: 10,
              adicionalHorasExtrasSemanaPercent: 50,
              adicionalHorasExtrasDomingoFeriadoPercent: 100,
              adicionalNoturnoPercent: 20,
              horarioNoturnoInicio: '22:00',
              horarioNoturnoFim: '05:00',
              aliquotaFgtsPercent: 8,
              regrasJornada: {
                tipoControle: 'Pagamento de hora extra',
                jornadaSemanal: '44h',
                jornadaDiariaHoras: 8.8,
                escalaPadrao: 'Segunda a sexta',
                horariosPadrao: { entrada: '08:00', intervaloSaida: '12:00', intervaloRetorno: '13:00', saida: '17:00' },
                pagaHoraExtra: true,
                horaExtraDiaUtilPercent: 50,
                horaExtraDomingoFeriadoPercent: 100,
                adicionalNoturnoPercent: 20,
                ativarBancoHoras: false,
                prazoCompensacao: '6 meses',
                limiteSaldoPositivoHoras: 20,
                limiteSaldoNegativoHoras: 5,
                formaAprovacao: 'Aprovação do Gestor'
              },
              tabelaInss: [],
              tabelaIrrf: []
            }}
            onSalvarConfig={handleSalvarConfig}
          />
        )}

        {activeSubTab === 'acessos-portal' && (
          <PainelAcessosPortal
            colaboradores={colaboradores}
            onSalvarColaborador={handleSalvarColaborador}
          />
        )}
      </div>
    </div>
  );
};
