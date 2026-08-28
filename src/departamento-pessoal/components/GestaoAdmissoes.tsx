import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, getDocs, query, collection, where } from '../../firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  FileText, 
  DollarSign, 
  Briefcase, 
  Calendar, 
  Building2, 
  AlertCircle, 
  Plus, 
  Check, 
  X, 
  Sparkles,
  Search,
  UserCheck,
  MapPin,
  CreditCard,
  Users,
  Gift,
  ShieldCheck,
  FileCheck,
  Edit3,
  Trash2,
  Download,
  Send,
  AlertTriangle,
  History,
  FileSpreadsheet,
  BarChart2,
  LayoutDashboard
} from 'lucide-react';
import { AdmissaoPending, ColaboradorCompleto, TipoContrato, StatusAdmissao, ItemChecklistAdmissao } from '../types/dp';
import { OfficialAdmissaoFlowModal } from './admissao/OfficialAdmissaoFlowModal';

interface GestaoAdmissoesProps {
  admissoes: AdmissaoPending[];
  colaboradores: ColaboradorCompleto[];
  onEfetivarAdmissao: (
    admissao: AdmissaoPending, 
    dadosAdicionais?: { gestor?: string; escala?: string; bancoAgencia?: string; rg?: string }
  ) => Promise<ColaboradorCompleto | void>;
  onSalvarAdmissao?: (admissao: AdmissaoPending) => Promise<void>;
  onDeletarAdmissao?: (admissaoId: string) => Promise<void>;
  companyId: string;
  selectedAdmissionId?: string | null;
}

const DEFAULT_CHECKLIST_ITEMS: ItemChecklistAdmissao[] = [
  { item: 'Dados pessoais preenchidos', obrigatorio: true, concluido: false },
  { item: 'CPF e RG validados', obrigatorio: true, concluido: false },
  { item: 'CTPS e PIS informados', obrigatorio: true, concluido: false },
  { item: 'Comprovante de residência enviado', obrigatorio: true, concluido: false },
  { item: 'Dados bancários para folha preenchidos', obrigatorio: true, concluido: false },
  { item: 'ASO (Exame Admissional) Aprovado', obrigatorio: true, concluido: false },
  { item: 'Contrato de trabalho gerado e assinado', obrigatorio: true, concluido: false },
  { item: 'Benefícios vinculados', obrigatorio: false, concluido: false },
  { item: 'Jornada e escala configuradas', obrigatorio: true, concluido: false },
  { item: 'Termo da LGPD aceito', obrigatorio: true, concluido: false }
];

export const GestaoAdmissoes: React.FC<GestaoAdmissoesProps> = ({
  admissoes,
  colaboradores,
  onEfetivarAdmissao,
  onSalvarAdmissao,
  onDeletarAdmissao,
  companyId,
  selectedAdmissionId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [selectedAdmissao, setSelectedAdmissao] = useState<AdmissaoPending | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'resumo' | 'pessoais' | 'endereco' | 'documentos' | 'profissionais' | 'banco' | 'dependentes' | 'beneficios' | 'exames' | 'contrato' | 'checklist'>('resumo');

  const [isOfficialFlowOpen, setIsOfficialFlowOpen] = useState(false);
  const [activeFlowData, setActiveFlowData] = useState<Partial<AdmissaoPending> | null>(null);
  const [flowFeedback, setFlowFeedback] = useState<string | null>(null);

  // RH_DP_NAVIGATION_ADMISSION_MODAL_V2
  // O modal oficial só pode autoabrir no contexto de DP/Admissões.
  // navigationEpochRef também invalida consultas assíncronas iniciadas antes de o usuário trocar de página.
  const autoOpenedAdmissionIdRef = useRef<string | null>(null);
  const navigationEpochRef = useRef(0);

  const admissionContextIsActive = () => {
    if (typeof window === 'undefined') return true;
    const activeTab = window.sessionStorage.getItem('rh:active-tab');
    return !activeTab || ["departamento-pessoal","admissoes"].includes(activeTab);
  };

  useEffect(() => {
    const handleNavigation = (event: Event) => {
      const detailTab = (event as CustomEvent<{ tab?: string }>).detail?.tab;
      const activeTab = detailTab || window.sessionStorage.getItem('rh:active-tab') || '';
      if (activeTab) window.sessionStorage.setItem('rh:active-tab', activeTab);
      const admissionAllowed = !activeTab || ["departamento-pessoal","admissoes"].includes(activeTab);
      if (!admissionAllowed) {
        navigationEpochRef.current += 1;
        autoOpenedAdmissionIdRef.current = null;
        setIsOfficialFlowOpen(false);
        setActiveFlowData(null);
        setSelectedAdmissao(null);
        localStorage.removeItem('selectedAdmissionId');
      }
    };

    window.addEventListener('rh:navigation-changed', handleNavigation);
    window.addEventListener('rh:close-admission-flow', handleNavigation);
    return () => {
      window.removeEventListener('rh:navigation-changed', handleNavigation);
      window.removeEventListener('rh:close-admission-flow', handleNavigation);
    };
  }, []);

  // Auto-open drawer/flow when selectedAdmissionId is provided
  useEffect(() => {
    if (!admissionContextIsActive()) {
      localStorage.removeItem('selectedAdmissionId');
      setIsOfficialFlowOpen(false);
      setActiveFlowData(null);
      return;
    }

    const storedAdmissionId = localStorage.getItem('selectedAdmissionId');
    const targetId = selectedAdmissionId || storedAdmissionId;
    if (!targetId || autoOpenedAdmissionIdRef.current === targetId) return;

    const requestEpoch = navigationEpochRef.current;
    const canOpenResult = () => requestEpoch === navigationEpochRef.current && admissionContextIsActive();

    // O ID salvo é uma ponte de navegação Recrutamento -> Admissão e é consumido uma única vez.
    autoOpenedAdmissionIdRef.current = targetId;
    if (storedAdmissionId === targetId) localStorage.removeItem('selectedAdmissionId');

    const found = admissoes.find(a => 
      a.id === targetId || 
      (a as any).contratacaoId === targetId ||
      a.id === `adm_${targetId}` ||
      (a as any).applicationId === targetId ||
      (a as any).candidatoId === targetId ||
      (a as any).candidateId === targetId
    );

    if (found) {
      if (!canOpenResult()) return;
      setSelectedAdmissao(found);
      setActiveFlowData(found);
      setIsOfficialFlowOpen(true);
    } else {
      // Direct Firestore fetch fallback
      const fetchAdmission = async () => {
        try {
          const docRef = doc(db, 'solicitacoes_admissao', targetId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() } as AdmissaoPending;
            if (!canOpenResult()) return;
            setSelectedAdmissao(data);
            setActiveFlowData(data);
            setIsOfficialFlowOpen(true);
          } else {
            const q = query(collection(db, 'solicitacoes_admissao'), where('contratacaoId', '==', targetId));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              const firstDoc = querySnap.docs[0];
              const data = { id: firstDoc.id, ...firstDoc.data() } as AdmissaoPending;
              if (!canOpenResult()) return;
              setSelectedAdmissao(data);
              setActiveFlowData(data);
              setIsOfficialFlowOpen(true);
            }
          }
        } catch (err) {
          console.warn("[GestaoAdmissoes] Erro ao carregar admissão selecionada:", err);
        }
      };
      fetchAdmission();
    }
  }, [selectedAdmissionId, admissoes]);

  // Modals
  const [showManualModal, setShowManualModal] = useState(false);
  const [showImportCandidateModal, setShowImportCandidateModal] = useState(false);
  const [showConfirmEfetivarModal, setShowConfirmEfetivarModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    nomeCompleto: '',
    email: '',
    telefone: '',
    cpf: '',
    rg: '',
    cargo: '',
    departamento: '',
    salarioCombinado: 0,
    tipoContrato: 'CLT' as TipoContrato,
    dataAdmissaoPrevista: '',
    gestor: ''
  });

  // Candidate Import Form State
  const [candidateForm, setCandidateForm] = useState({
    nomeCandidate: '',
    emailCandidate: '',
    cpfCandidate: '',
    cargoCandidate: '',
    salarioCandidate: 0,
    deptoCandidate: ''
  });

  // Efetivação extra data
  const [efetivarGestor, setEfetivarGestor] = useState('');
  const [efetivarEscala, setEfetivarEscala] = useState('');
  const [efetivarBanco, setEfetivarBanco] = useState('');
  const [efetivarRg, setEfetivarRg] = useState('');

  // Filter list
  const filtered = admissoes.filter(a => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch = !term || 
      a.nomeCompleto.toLowerCase().includes(term) ||
      a.cargo.toLowerCase().includes(term) ||
      a.email.toLowerCase().includes(term) ||
      (a.cpf && a.cpf.includes(term));

    const matchStatus = statusFilter === 'Todos' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenDrawer = (adm: AdmissaoPending) => {
    setSelectedAdmissao(adm);
    setIsDrawerOpen(true);
  };

  const handleCreateManualAdmissao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.nomeCompleto || !manualForm.email || !manualForm.cargo) {
      alert('Por favor, preencha os campos obrigatórios (Nome, E-mail e Cargo).');
      return;
    }

    setIsSubmitting(true);
    const newAdmissao: AdmissaoPending = {
      id: `adm-${Date.now()}`,
      empresaId: companyId,
      nomeCompleto: manualForm.nomeCompleto,
      email: manualForm.email,
      telefone: manualForm.telefone,
      cpf: manualForm.cpf,
      rg: manualForm.rg,
      cargo: manualForm.cargo,
      departamento: manualForm.departamento,
      salarioCombinado: manualForm.salarioCombinado,
      tipoContrato: manualForm.tipoContrato,
      dataAdmissaoPrevista: manualForm.dataAdmissaoPrevista,
      gestor: manualForm.gestor,
      status: 'Aguardando documentos',
      checklist: DEFAULT_CHECKLIST_ITEMS,
      createdAt: new Date().toISOString()
    };

    try {
      if (onSalvarAdmissao) {
        await onSalvarAdmissao(newAdmissao);
      }
      setShowManualModal(false);
      setManualForm({
        nomeCompleto: '',
        email: '',
        telefone: '',
        cpf: '',
        rg: '',
        cargo: '',
        departamento: '',
        salarioCombinado: 0,
        tipoContrato: 'CLT',
        dataAdmissaoPrevista: '',
        gestor: ''
      });
    } catch (err) {
      console.error('Erro ao salvar admissão manual:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateForm.nomeCandidate || !candidateForm.emailCandidate || !candidateForm.cargoCandidate) {
      alert('Por favor, informe os dados do candidato.');
      return;
    }

    setIsSubmitting(true);
    const importedAdmissao: AdmissaoPending = {
      id: `adm-cand-${Date.now()}`,
      empresaId: companyId,
      nomeCompleto: candidateForm.nomeCandidate,
      email: candidateForm.emailCandidate,
      cpf: candidateForm.cpfCandidate,
      cargo: candidateForm.cargoCandidate,
      departamento: candidateForm.deptoCandidate,
      salarioCombinado: candidateForm.salarioCandidate,
      tipoContrato: 'CLT',
      dataAdmissaoPrevista: '',
      status: 'Aguardando documentos',
      checklist: DEFAULT_CHECKLIST_ITEMS,
      createdAt: new Date().toISOString()
    };

    try {
      if (onSalvarAdmissao) {
        await onSalvarAdmissao(importedAdmissao);
      }
      setShowImportCandidateModal(false);
      setCandidateForm({
        nomeCandidate: '',
        emailCandidate: '',
        cpfCandidate: '',
        cargoCandidate: '',
        salarioCandidate: 0,
        deptoCandidate: ''
      });
    } catch (err) {
      console.error('Erro ao importar candidato:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCurrentAdmissao = async (updatedFields: Partial<AdmissaoPending>) => {
    if (!selectedAdmissao) return;
    const updated = { ...selectedAdmissao, ...updatedFields, updatedAt: new Date().toISOString() };
    setSelectedAdmissao(updated);
    if (onSalvarAdmissao) {
      await onSalvarAdmissao(updated);
    }
  };

  const handleToggleChecklist = async (index: number) => {
    if (!selectedAdmissao) return;
    const newChecklist = [...(selectedAdmissao.checklist || [])];
    newChecklist[index] = {
      ...newChecklist[index],
      concluido: !newChecklist[index].concluido,
      dataConclusao: !newChecklist[index].concluido ? new Date().toISOString().split('T')[0] : undefined
    };
    await handleUpdateCurrentAdmissao({ checklist: newChecklist });
  };

  const handleConfirmarEfetivacao = async () => {
    if (!selectedAdmissao) return;

    // Check mandatory items
    const mandatoryMissing = (selectedAdmissao.checklist || []).filter(c => c.obrigatorio && !c.concluido);
    if (mandatoryMissing.length > 0) {
      alert(`Atenção: Não é possível efetivar! Existem ${mandatoryMissing.length} itens obrigatórios pendentes no checklist:\n` + mandatoryMissing.map(m => `• ${m.item}`).join('\n'));
      return;
    }

    const gestorEfetivo = String(selectedAdmissao.gestor || efetivarGestor || '').trim();
    const escalaEfetiva = String(selectedAdmissao.jornada || efetivarEscala || '').trim();
    const rgEfetivo = String(selectedAdmissao.rg || efetivarRg || '').trim();
    if (!selectedAdmissao.cpf?.trim() || !selectedAdmissao.email?.trim() || !selectedAdmissao.cargo?.trim() || Number(selectedAdmissao.salarioCombinado || 0) <= 0 || !selectedAdmissao.dataAdmissaoPrevista || !gestorEfetivo || !escalaEfetiva || !rgEfetivo) {
      alert('Preencha CPF, RG, e-mail, cargo, salário, data de admissão, gestor e escala antes de efetivar.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onEfetivarAdmissao(selectedAdmissao, {
        gestor: selectedAdmissao.gestor || efetivarGestor,
        escala: selectedAdmissao.jornada || efetivarEscala,
        bancoAgencia: selectedAdmissao.dadosBancarios?.banco ? `${selectedAdmissao.dadosBancarios.banco} Ag ${selectedAdmissao.dadosBancarios.agencia}` : efetivarBanco,
        rg: selectedAdmissao.rg || efetivarRg
      });

      setShowConfirmEfetivarModal(false);
      setIsDrawerOpen(false);
      setSelectedAdmissao(null);
    } catch (error) {
      console.error('Erro ao efetivar admissão:', error);
      alert('Erro ao efetivar a admissão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate contract text dynamically replacing tags
  const renderContractText = (adm: AdmissaoPending) => {
    const template = `CONTRATO INDIVIDUAL DE TRABALHO CLT
    
Pelo presente instrumento particular, de um lado {{empresa_nome}}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº {{empresa_cnpj}}, doravante denominada EMPREGADORA, e de outro lado {{nome_colaborador}}, portador(a) do CPF nº {{cpf}} e RG nº {{rg}}, doravante denominado(a) EMPREGADO(A), celebram o presente Contrato Individual de Trabalho sob as cláusulas a seguir:

1. DO CARGO E FUNÇÕES
O(A) EMPREGADO(A) é contratado(a) para exercer a função de {{cargo}}, no departamento {{departamento}}, sob gestão de {{gestor}}.

2. DA REMUNERAÇÃO
Pela prestação dos serviços contratados, a EMPREGADORA pagará ao(à) EMPREGADO(A) o salário mensal bruto de R$ {{salario}}, sujeito aos descontos legais (INSS, IRRF).

3. DA JORNADA DE TRABALHO
A jornada de trabalho será de 44 horas semanais, na escala {{jornada}}.

4. DA ADMISSÃO
A data oficial de início das atividades é {{data_admissao}}.

Local e Data: {{cidade}}, {{data_atual}}.

___________________________________________
{{empresa_nome}} (Empregadora)

___________________________________________
{{nome_colaborador}} (Empregado)`;

    return template
      .replace(/{{empresa_nome}}/g, 'RH TRANSFORMA Tecnologia S.A.')
      .replace(/{{empresa_cnpj}}/g, '12.345.678/0001-90')
      .replace(/{{nome_colaborador}}/g, adm.nomeCompleto)
      .replace(/{{cpf}}/g, adm.cpf || '000.000.000-00')
      .replace(/{{rg}}/g, adm.rg || '00.000.000-0')
      .replace(/{{cargo}}/g, adm.cargo)
      .replace(/{{departamento}}/g, adm.departamento || 'Geral')
      .replace(/{{gestor}}/g, adm.gestor || 'Diretoria de RH')
      .replace(/{{salario}}/g, (adm.salarioCombinado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
      .replace(/{{jornada}}/g, adm.jornada || '5x2 (Segunda a Sexta)')
      .replace(/{{data_admissao}}/g, adm.dataAdmissaoPrevista || 'A definir')
      .replace(/{{cidade}}/g, adm.endereco?.cidade || 'São Paulo')
      .replace(/{{data_atual}}/g, new Date().toLocaleDateString('pt-BR'));
  };

  return (
    <div className="space-y-6">
      {flowFeedback && (
        <div className="fixed top-5 right-5 z-[70] max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-xl text-xs font-bold text-emerald-900" role="status">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{flowFeedback}</span>
            <button type="button" onClick={() => setFlowFeedback(null)} className="ml-2" aria-label="Fechar mensagem">×</button>
          </div>
        </div>
      )}
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Central de Admissão & Contratação 100%
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                {admissoes.length} registros
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Gestão completa das 10 etapas admissionais, assinatura de contratos e efetivação no DP.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setActiveFlowData(null);
                setIsOfficialFlowOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nova Admissão</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, cargo, CPF ou e-mail..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
            {['Todos', 'Aguardando documentos', 'Em conferência', 'Aguardando exame', 'Aguardando assinatura', 'Pronta para efetivação', 'Efetivado'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Admissões Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
            <UserPlus className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Nenhuma admissão encontrada com os filtros selecionados.</p>
            <p className="text-[11px] text-slate-400">Clique em "+ Nova Admissão Manual" ou "Importar Candidato" para iniciar o processo.</p>
          </div>
        ) : (
          filtered.map(adm => {
            const jaEfetivado = adm.status === 'Efetivado' || colaboradores.some(c => (c as any).candidatoId === adm.candidatoId);
            const totalItems = adm.checklist?.length || 10;
            const completedItems = adm.checklist?.filter(c => c.concluido).length || 0;
            const progressPercent = Math.round((completedItems / totalItems) * 100);

            return (
              <div 
                key={adm.id}
                className={`bg-white rounded-2xl border transition-all p-5 space-y-4 shadow-2xs flex flex-col justify-between ${
                  jaEfetivado ? 'border-slate-200 opacity-80' : 'border-blue-200 hover:border-blue-500'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 line-clamp-1">{adm.nomeCompleto}</h3>
                      <p className="text-xs text-blue-600 font-bold mt-0.5">{adm.cargo}</p>
                      <p className="text-[11px] text-slate-400">{adm.departamento || 'Geral'} • Contrato {adm.tipoContrato}</p>
                    </div>

                    <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase shrink-0 ${
                      jaEfetivado 
                        ? 'bg-slate-100 text-slate-700 border border-slate-200' 
                        : adm.status === 'Pronta para efetivação'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {jaEfetivado ? 'Efetivado' : adm.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px]">Salário Combinado</span>
                      <strong className="text-slate-900">R$ {(adm.salarioCombinado || 0).toLocaleString('pt-BR')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px]">Previsão Admissão</span>
                      <strong className="text-slate-800">{adm.dataAdmissaoPrevista || 'A definir'}</strong>
                    </div>
                  </div>

                  {/* Checklist progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-500">Progresso do Checklist</span>
                      <span className="text-blue-700">{completedItems}/{totalItems} ({progressPercent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedAdmissao(adm);
                      setActiveFlowData(adm);
                      setIsOfficialFlowOpen(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-200"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{adm.candidatoId ? 'Abrir Admissão' : 'Continuar Admissão'}</span>
                  </button>

                  {!jaEfetivado ? (
                    <button
                      onClick={() => {
                        setSelectedAdmissao(adm);
                        setActiveFlowData(adm);
                        setIsOfficialFlowOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Efetivar</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ativo no DP</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CENTRAL DA ADMISSÃO - LATERAL DRAWER (10 STEPS) */}
      {isDrawerOpen && selectedAdmissao && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity">
          <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header Lateral */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-lg border-2 border-blue-400">
                  {selectedAdmissao.nomeCompleto.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedAdmissao.nomeCompleto}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {selectedAdmissao.status}
                    </span>
                  </div>
                  <p className="text-xs text-blue-300 font-medium">{selectedAdmissao.cargo}</p>
                  <p className="text-[11px] text-slate-400">{selectedAdmissao.departamento || 'Geral'} • Contrato {selectedAdmissao.tipoContrato}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedAdmissao.status !== 'Efetivado' && (
                  <button
                    onClick={() => setShowConfirmEfetivarModal(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>EFETIVAR ADMISSÃO</span>
                  </button>
                )}

                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-all"
                  title="Fechar Painel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 10 Step Sub-Tabs Header Bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 overflow-x-auto scrollbar-thin shrink-0">
              <div className="flex items-center gap-1.5 min-w-max">
                {[
                  { id: 'resumo', label: 'Resumo & Status', icon: BarChart2 },
                  { id: 'pessoais', label: '1. Pessoais', icon: UserCheck },
                  { id: 'endereco', label: '2. Endereço', icon: MapPin },
                  { id: 'documentos', label: '3. Documentos', icon: FileText },
                  { id: 'profissionais', label: '4. Profissionais', icon: Briefcase },
                  { id: 'banco', label: '5. Banco', icon: CreditCard },
                  { id: 'dependentes', label: '6. Dependentes', icon: Users },
                  { id: 'beneficios', label: '7. Benefícios', icon: Gift },
                  { id: 'exames', label: '8. Exames & ASO', icon: ShieldCheck },
                  { id: 'contrato', label: '9. Contrato', icon: FileCheck },
                  { id: 'checklist', label: '10. Checklist', icon: CheckCircle2 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                      drawerTab === tab.id 
                        ? 'bg-[#2563EB] text-white shadow-2xs' 
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Body Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* RESUMO & STATUS */}
              {drawerTab === 'resumo' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Status Atual do Processo de Admissão</h4>
                      <p className="text-slate-600 mt-0.5">Altere o status conforme o andamento do processo admissional.</p>
                    </div>

                    <select
                      value={selectedAdmissao.status}
                      onChange={e => handleUpdateCurrentAdmissao({ status: e.target.value as StatusAdmissao })}
                      className="px-3 py-2 bg-white border border-blue-300 font-bold text-slate-900 rounded-xl focus:outline-none cursor-pointer"
                    >
                      <option value="Rascunho">Rascunho</option>
                      <option value="Aguardando documentos">Aguardando documentos</option>
                      <option value="Em conferência">Em conferência</option>
                      <option value="Aguardando exame">Aguardando exame</option>
                      <option value="Aguardando assinatura">Aguardando assinatura</option>
                      <option value="Pronta para efetivação">Pronta para efetivação</option>
                      <option value="Efetivado">Efetivado</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Nome</span>
                      <strong className="text-slate-900 truncate block">{selectedAdmissao.nomeCompleto}</strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">CPF</span>
                      <strong className="text-slate-900 block">{selectedAdmissao.cpf || 'Pendente'}</strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Salário Combinado</span>
                      <strong className="text-emerald-700 block">R$ {(selectedAdmissao.salarioCombinado || 0).toLocaleString('pt-BR')}</strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Previsão Admissão</span>
                      <strong className="text-slate-900 block">{selectedAdmissao.dataAdmissaoPrevista}</strong>
                    </div>
                  </div>

                  {/* Checklist overview box */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                    <h4 className="font-extrabold text-slate-800 text-xs flex items-center justify-between">
                      <span>Validação do Checklist Mandatório</span>
                      <span className="text-blue-600 font-bold">
                        {selectedAdmissao.checklist?.filter(c => c.concluido).length || 0} / {selectedAdmissao.checklist?.length || 0} Concluídos
                      </span>
                    </h4>
                    <div className="space-y-1">
                      {(selectedAdmissao.checklist || []).map((chk, i) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50 text-[11px]">
                          <span className={`font-medium ${chk.concluido ? 'text-slate-700' : 'text-amber-800 font-bold'}`}>
                            {chk.item} {chk.obrigatorio && <span className="text-rose-500">*</span>}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${chk.concluido ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {chk.concluido ? 'Concluído' : 'Pendente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 1. DADOS PESSOAIS */}
              {drawerTab === 'pessoais' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 text-xs">
                  <h4 className="font-extrabold text-slate-900 text-xs border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>Etapa 1 — Dados Pessoais do Contratado</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        value={selectedAdmissao.nomeCompleto || ''}
                        onChange={e => handleUpdateCurrentAdmissao({ nomeCompleto: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nome Social</label>
                      <input
                        type="text"
                        value={selectedAdmissao.nomeSocial || ''}
                        onChange={e => handleUpdateCurrentAdmissao({ nomeSocial: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">CPF *</label>
                      <input
                        type="text"
                        value={selectedAdmissao.cpf || ''}
                        onChange={e => handleUpdateCurrentAdmissao({ cpf: e.target.value })}
                        placeholder="000.000.000-00"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">RG / Órgão Emissor</label>
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="text"
                          value={selectedAdmissao.rg || ''}
                          onChange={e => handleUpdateCurrentAdmissao({ rg: e.target.value })}
                          placeholder="RG"
                          className="p-2 bg-white border border-slate-200 rounded-lg font-mono"
                        />
                        <input
                          type="text"
                          value={selectedAdmissao.orgaoEmissor || ''}
                          onChange={e => handleUpdateCurrentAdmissao({ orgaoEmissor: e.target.value })}
                          placeholder="SSP/SP"
                          className="p-2 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Data de Nascimento</label>
                      <input
                        type="date"
                        value={selectedAdmissao.dataNascimento || '1995-01-01'}
                        onChange={e => handleUpdateCurrentAdmissao({ dataNascimento: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Gênero / Sexo</label>
                      <select
                        value={selectedAdmissao.genero || 'Masculino'}
                        onChange={e => handleUpdateCurrentAdmissao({ genero: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro / Não Informar</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Estado Civil</label>
                      <select
                        value={selectedAdmissao.estadoCivil || 'Solteiro(a)'}
                        onChange={e => handleUpdateCurrentAdmissao({ estadoCivil: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      >
                        <option value="Solteiro(a)">Solteiro(a)</option>
                        <option value="Casado(a)">Casado(a)</option>
                        <option value="Divorciado(a)">Divorciado(a)</option>
                        <option value="União Estável">União Estável</option>
                        <option value="Viúvo(a)">Viúvo(a)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Telefone WhatsApp</label>
                      <input
                        type="text"
                        value={selectedAdmissao.telefone || ''}
                        onChange={e => handleUpdateCurrentAdmissao({ telefone: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">E-mail Pessoal</label>
                      <input
                        type="email"
                        value={selectedAdmissao.email || ''}
                        onChange={e => handleUpdateCurrentAdmissao({ email: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nacionalidade / Naturalidade</label>
                      <input
                        type="text"
                        value={selectedAdmissao.nacionalidade || 'Brasileira'}
                        onChange={e => handleUpdateCurrentAdmissao({ nacionalidade: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ENDEREÇO */}
              {drawerTab === 'endereco' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 text-xs">
                  <h4 className="font-extrabold text-slate-900 text-xs border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Etapa 2 — Endereço Residencial</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">CEP</label>
                      <input
                        type="text"
                        value={selectedAdmissao.endereco?.cep || '01000-000'}
                        onChange={e => handleUpdateCurrentAdmissao({
                          endereco: { ...(selectedAdmissao.endereco || {}), cep: e.target.value }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Logradouro / Rua</label>
                      <input
                        type="text"
                        value={selectedAdmissao.endereco?.logradouro || 'Avenida Paulista'}
                        onChange={e => handleUpdateCurrentAdmissao({
                          endereco: { ...(selectedAdmissao.endereco || {}), logradouro: e.target.value }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Número</label>
                      <input
                        type="text"
                        value={selectedAdmissao.endereco?.numero || '1000'}
                        onChange={e => handleUpdateCurrentAdmissao({
                          endereco: { ...(selectedAdmissao.endereco || {}), numero: e.target.value }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Complemento</label>
                      <input
                        type="text"
                        value={selectedAdmissao.endereco?.complemento || 'Apto 42'}
                        onChange={e => handleUpdateCurrentAdmissao({
                          endereco: { ...(selectedAdmissao.endereco || {}), complemento: e.target.value }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Bairro</label>
                      <input
                        type="text"
                        value={selectedAdmissao.endereco?.bairro || 'Bela Vista'}
                        onChange={e => handleUpdateCurrentAdmissao({
                          endereco: { ...(selectedAdmissao.endereco || {}), bairro: e.target.value }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Cidade</label>
                      <input
                        type="text"
                        value={selectedAdmissao.endereco?.cidade || 'São Paulo'}
                        onChange={e => handleUpdateCurrentAdmissao({
                          endereco: { ...(selectedAdmissao.endereco || {}), cidade: e.target.value }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Estado (UF)</label>
                      <input
                        type="text"
                        value={selectedAdmissao.endereco?.estado || 'SP'}
                        onChange={e => handleUpdateCurrentAdmissao({
                          endereco: { ...(selectedAdmissao.endereco || {}), estado: e.target.value }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. DOCUMENTOS */}
              {drawerTab === 'documentos' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs">Etapa 3 — Documentos Obrigatórios para eSocial</h4>
                      <p className="text-[11px] text-slate-500">Documentação funcional exigida na admissão do trabalhador.</p>
                    </div>

                    <button
                      onClick={() => {
                        const newDocs = [
                          ...(selectedAdmissao.documentosAnexados || []),
                          {
                            id: `doc-${Date.now()}`,
                            tipo: 'Documento Adicional',
                            nomeArquivo: 'comprovante_adicional.pdf',
                            status: 'Aprovado' as const,
                            dataEnvio: new Date().toISOString().split('T')[0]
                          }
                        ];
                        handleUpdateCurrentAdmissao({ documentosAnexados: newDocs });
                      }}
                      className="px-3 py-1.5 bg-[#2563EB] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Anexar Documento</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { tipo: 'RG / CNH Digital', file: 'rg_frente_verso.pdf', status: 'Aprovado' },
                      { tipo: 'CPF Registrado', file: 'cpf_comprovante.pdf', status: 'Aprovado' },
                      { tipo: 'CTPS Digital (eSocial)', file: 'ctps_extrato.pdf', status: 'Aprovado' },
                      { tipo: 'Comprovante Residência', file: 'conta_luz_atualizada.pdf', status: 'Aprovado' },
                      { tipo: 'Certidão Nascimento / Casamento', file: 'certidao_civil.pdf', status: 'Pendente' },
                      { tipo: 'Comprovante de Escolaridade', file: 'diploma_graduacao.pdf', status: 'Aprovado' }
                    ].map((d, idx) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-bold text-slate-800">{d.tipo}</p>
                            <p className="text-[10px] text-slate-400">{d.file}</p>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.status === 'Aprovado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {d.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. DADOS PROFISSIONAIS */}
              {drawerTab === 'profissionais' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 text-xs">
                  <h4 className="font-extrabold text-slate-900 text-xs border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>Etapa 4 — Dados Profissionais e Vínculo Trabalhista</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Cargo *</label>
                      <input
                        type="text"
                        value={selectedAdmissao.cargo || ''}
                        onChange={e => handleUpdateCurrentAdmissao({ cargo: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Departamento</label>
                      <input
                        type="text"
                        value={selectedAdmissao.departamento || 'Operações'}
                        onChange={e => handleUpdateCurrentAdmissao({ departamento: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Salário Combinado (R$) *</label>
                      <input
                        type="number"
                        value={selectedAdmissao.salarioCombinado || 0}
                        onChange={e => handleUpdateCurrentAdmissao({ salarioCombinado: Number(e.target.value) })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tipo de Contrato</label>
                      <select
                        value={selectedAdmissao.tipoContrato || 'CLT'}
                        onChange={e => handleUpdateCurrentAdmissao({ tipoContrato: e.target.value as TipoContrato })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                      >
                        <option value="CLT">CLT Mensalista</option>
                        <option value="PJ">PJ (Prestador de Serviço)</option>
                        <option value="Estágio">Estágio</option>
                        <option value="Aprendiz">Jovem Aprendiz</option>
                        <option value="Temporário">Temporário</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Data Prevista Admissão</label>
                      <input
                        type="date"
                        value={selectedAdmissao.dataAdmissaoPrevista || ''}
                        onChange={e => handleUpdateCurrentAdmissao({ dataAdmissaoPrevista: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Gestor Responsável</label>
                      <input
                        type="text"
                        value={selectedAdmissao.gestor || 'Diretoria de RH'}
                        onChange={e => handleUpdateCurrentAdmissao({ gestor: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Escala / Jornada</label>
                      <input
                        type="text"
                        value={selectedAdmissao.jornada || '5x2 (Segunda a Sexta 08h às 18h)'}
                        onChange={e => handleUpdateCurrentAdmissao({ jornada: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Centro de Custo</label>
                      <input
                        type="text"
                        value={selectedAdmissao.centroCusto || 'CC-100 Operacional'}
                        onChange={e => handleUpdateCurrentAdmissao({ centroCusto: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Sindicato da Categoria</label>
                      <input
                        type="text"
                        value={selectedAdmissao.sindicato || 'SINDRH - SP'}
                        onChange={e => handleUpdateCurrentAdmissao({ sindicato: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. DADOS BANCÁRIOS */}
              {drawerTab === 'banco' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 text-xs">
                  <h4 className="font-extrabold text-slate-900 text-xs border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Etapa 5 — Dados Bancários para Pagamento de Folha</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Banco</label>
                      <input
                        type="text"
                        value={selectedAdmissao.dadosBancarios?.banco || 'Banco Itaú Unibanco (341)'}
                        onChange={e => handleUpdateCurrentAdmissao({
                          dadosBancarios: { ...(selectedAdmissao.dadosBancarios || {}), banco: e.target.value }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Agência / Conta</label>
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="text"
                          value={selectedAdmissao.dadosBancarios?.agencia || '0123'}
                          onChange={e => handleUpdateCurrentAdmissao({
                            dadosBancarios: { ...(selectedAdmissao.dadosBancarios || {}), agencia: e.target.value }
                          })}
                          placeholder="Agência"
                          className="p-2 bg-white border border-slate-200 rounded-lg font-mono"
                        />
                        <input
                          type="text"
                          value={selectedAdmissao.dadosBancarios?.conta || '45678-9'}
                          onChange={e => handleUpdateCurrentAdmissao({
                            dadosBancarios: { ...(selectedAdmissao.dadosBancarios || {}), conta: e.target.value }
                          })}
                          placeholder="Conta com dígito"
                          className="p-2 bg-white border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tipo de Conta</label>
                      <select
                        value={selectedAdmissao.dadosBancarios?.tipoConta || 'Corrente'}
                        onChange={e => handleUpdateCurrentAdmissao({
                          dadosBancarios: { ...(selectedAdmissao.dadosBancarios || {}), tipoConta: e.target.value as any }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      >
                        <option value="Corrente">Conta Corrente</option>
                        <option value="Salário">Conta Salário</option>
                        <option value="Poupança">Conta Poupança</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Chave Pix Titular</label>
                      <input
                        type="text"
                        value={selectedAdmissao.dadosBancarios?.chavePix || selectedAdmissao.cpf || ''}
                        onChange={e => handleUpdateCurrentAdmissao({
                          dadosBancarios: { ...(selectedAdmissao.dadosBancarios || {}), chavePix: e.target.value }
                        })}
                        placeholder="CPF / Telefone / E-mail / Chave aleatória"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. DEPENDENTES */}
              {drawerTab === 'dependentes' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs">Etapa 6 — Cadastro de Dependentes (IRRF e Salário Família)</h4>
                      <p className="text-[11px] text-slate-500">Dependentes elegíveis para dedução no Imposto de Renda e benefício previdenciário.</p>
                    </div>

                    <button
                      onClick={() => {
                        const newDep = [
                          ...(selectedAdmissao.dependentes || []),
                          {
                            id: `dep-${Date.now()}`,
                            nome: 'Novo Dependente',
                            cpf: '000.000.000-00',
                            dataNascimento: '2018-05-10',
                            parentesco: 'Filho(a)',
                            irrf: true,
                            salarioFamilia: true
                          }
                        ];
                        handleUpdateCurrentAdmissao({ dependentes: newDep });
                      }}
                      className="px-3 py-1.5 bg-[#2563EB] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Dependente</span>
                    </button>
                  </div>

                  {(selectedAdmissao.dependentes || []).length === 0 ? (
                    <p className="text-center py-6 text-slate-400 bg-white border border-slate-200 rounded-xl">Nenhum dependente cadastrado.</p>
                  ) : (
                    <div className="space-y-2">
                      {(selectedAdmissao.dependentes || []).map((dep, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800">{dep.nome} ({dep.parentesco})</p>
                            <p className="text-[10px] text-slate-400">CPF: {dep.cpf} • Nascimento: {dep.dataNascimento}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                              IRRF: {dep.irrf ? 'Sim' : 'Não'}
                            </span>
                            <button
                              onClick={() => {
                                const updatedDeps = (selectedAdmissao.dependentes || []).filter((_, i) => i !== idx);
                                handleUpdateCurrentAdmissao({ dependentes: updatedDeps });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 7. BENEFÍCIOS */}
              {drawerTab === 'beneficios' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200">
                    <h4 className="font-extrabold text-slate-900 text-xs">Etapa 7 — Seleção do Pacote de Benefícios Corporativos</h4>
                    <p className="text-slate-600 mt-0.5">Selecione os benefícios que serão vinculados e descontados em folha após a admissão.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'Vale Transporte (VT)',
                      'Vale Refeição (VR / Ticket)',
                      'Vale Alimentação (VA)',
                      'Plano de Saúde Bradesco',
                      'Plano Odontológico OdontoPrev',
                      'Seguro de Vida em Grupo',
                      'Auxílio Home Office',
                      'Auxílio Combustível'
                    ].map((benName) => {
                      const isSelected = (selectedAdmissao.beneficiosSelecionados || ['Vale Transporte', 'Vale Refeição', 'Plano de Saúde']).includes(benName);

                      return (
                        <div 
                          key={benName}
                          onClick={() => {
                            const current = selectedAdmissao.beneficiosSelecionados || ['Vale Transporte', 'Vale Refeição', 'Plano de Saúde'];
                            const next = isSelected 
                              ? current.filter(b => b !== benName)
                              : [...current, benName];
                            handleUpdateCurrentAdmissao({ beneficiosSelecionados: next });
                          }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Gift className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span>{benName}</span>
                          </div>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 8. EXAMES & SEGURANÇA */}
              {drawerTab === 'exames' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 text-xs">
                  <h4 className="font-extrabold text-slate-900 text-xs border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Etapa 8 — ASO (Atestado de Saúde Ocupacional) & Segurança</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Resultado do ASO Admissional</label>
                      <select
                        value={selectedAdmissao.exameAdmissional?.resultado || 'Apto'}
                        onChange={e => handleUpdateCurrentAdmissao({
                          exameAdmissional: { ...(selectedAdmissao.exameAdmissional || {}), resultado: e.target.value as any }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                      >
                        <option value="Apto">Apto para Função</option>
                        <option value="Apto com Restrições">Apto com Restrições</option>
                        <option value="Inapto">Inapto</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Data do Exame Admissional</label>
                      <input
                        type="date"
                        value={selectedAdmissao.exameAdmissional?.dataExame || new Date().toISOString().split('T')[0]}
                        onChange={e => handleUpdateCurrentAdmissao({
                          exameAdmissional: { ...(selectedAdmissao.exameAdmissional || {}), dataExame: e.target.value }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Clínica / Médico Responsável</label>
                      <input
                        type="text"
                        value={selectedAdmissao.exameAdmissional?.clinica || 'Clínica Ocupacional Central'}
                        onChange={e => handleUpdateCurrentAdmissao({
                          exameAdmissional: { ...(selectedAdmissao.exameAdmissional || {}), clinica: e.target.value }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">CRM do Médico Examinador</label>
                      <input
                        type="text"
                        value={selectedAdmissao.exameAdmissional?.crm || 'CRM/SP 123456'}
                        onChange={e => handleUpdateCurrentAdmissao({
                          exameAdmissional: { ...(selectedAdmissao.exameAdmissional || {}), crm: e.target.value }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 9. CONTRATO DE TRABALHO */}
              {drawerTab === 'contrato' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs">Etapa 9 — Gerador Automático de Minuta de Contrato</h4>
                      <p className="text-[11px] text-slate-500">Geração dinâmica com preenchimento das variáveis do colaborador.</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const text = renderContractText(selectedAdmissao);
                          const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `contrato_${selectedAdmissao.nomeCompleto.replace(/\s+/g, '_').toLowerCase()}.txt`;
                          a.click();
                        }}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar Minuta</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto border border-slate-800">
                    {renderContractText(selectedAdmissao)}
                  </div>
                </div>
              )}

              {/* 10. CHECKLIST & EFETIVAÇÃO */}
              {drawerTab === 'checklist' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200">
                    <h4 className="font-extrabold text-slate-900 text-xs">Etapa 10 — Checklist Mandatório de Conclusão da Admissão</h4>
                    <p className="text-slate-600 mt-0.5">Marque cada pendência como concluída para autorizar a efetivação no DP.</p>
                  </div>

                  <div className="space-y-2">
                    {(selectedAdmissao.checklist || []).map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleToggleChecklist(idx)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          item.concluido ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                            item.concluido ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {item.concluido && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="font-bold">{item.item} {item.obrigatorio && <span className="text-rose-600">*</span>}</p>
                            {item.dataConclusao && <p className="text-[10px] text-slate-400">Concluído em: {item.dataConclusao}</p>}
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.concluido ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.concluido ? 'OK' : 'Pendente'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-end">
                    {selectedAdmissao.status !== 'Efetivado' && (
                      <button
                        onClick={() => setShowConfirmEfetivarModal(true)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>EFETIVAR ADMISSÃO E CRIAR COLABORADOR</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: NOVA ADMISSÃO MANUAL */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Nova Admissão Manual</h3>
              </div>
              <button onClick={() => setShowManualModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualAdmissao} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={manualForm.nomeCompleto}
                  onChange={e => setManualForm({ ...manualForm, nomeCompleto: e.target.value })}
                  placeholder="Nome do novo colaborador"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={manualForm.email}
                    onChange={e => setManualForm({ ...manualForm, email: e.target.value })}
                    placeholder="email@dominio.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Telefone WhatsApp</label>
                  <input
                    type="text"
                    value={manualForm.telefone}
                    onChange={e => setManualForm({ ...manualForm, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CPF</label>
                  <input
                    type="text"
                    value={manualForm.cpf}
                    onChange={e => setManualForm({ ...manualForm, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">RG</label>
                  <input
                    type="text"
                    value={manualForm.rg}
                    onChange={e => setManualForm({ ...manualForm, rg: e.target.value })}
                    placeholder="00.000.000-0"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cargo *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.cargo}
                    onChange={e => setManualForm({ ...manualForm, cargo: e.target.value })}
                    placeholder="Ex: Analista de RH"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Departamento</label>
                  <input
                    type="text"
                    value={manualForm.departamento}
                    onChange={e => setManualForm({ ...manualForm, departamento: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Salário Combinado (R$)</label>
                  <input
                    type="number"
                    value={manualForm.salarioCombinado}
                    onChange={e => setManualForm({ ...manualForm, salarioCombinado: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Previsão de Admissão</label>
                  <input
                    type="date"
                    value={manualForm.dataAdmissaoPrevista}
                    onChange={e => setManualForm({ ...manualForm, dataAdmissaoPrevista: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-black rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Iniciando...' : 'Criar Admissão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: IMPORTAR CANDIDATO APROVADO */}
      {showImportCandidateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Importar Candidato Aprovado</h3>
              </div>
              <button onClick={() => setShowImportCandidateModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportCandidate} className="space-y-3 text-xs">
              <p className="text-slate-500 text-[11px]">Selecione ou insira os dados do candidato aprovado no Módulo de Recrutamento para iniciar a admissão.</p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome do Candidato *</label>
                <input
                  type="text"
                  required
                  value={candidateForm.nomeCandidate}
                  onChange={e => setCandidateForm({ ...candidateForm, nomeCandidate: e.target.value })}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">E-mail do Candidato *</label>
                <input
                  type="email"
                  required
                  value={candidateForm.emailCandidate}
                  onChange={e => setCandidateForm({ ...candidateForm, emailCandidate: e.target.value })}
                  placeholder="carlos@email.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cargo Aprovado *</label>
                <input
                  type="text"
                  required
                  value={candidateForm.cargoCandidate}
                  onChange={e => setCandidateForm({ ...candidateForm, cargoCandidate: e.target.value })}
                  placeholder="Ex: Desenvolvedor Senior"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowImportCandidateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Importando...' : 'Iniciar Admissão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMAÇÃO DE EFETIVAÇÃO */}
      {showConfirmEfetivarModal && selectedAdmissao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-black text-slate-900">Efetivação no Departamento Pessoal</h3>
              </div>
              <button onClick={() => setShowConfirmEfetivarModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs space-y-1">
              <p className="font-extrabold text-emerald-950">Confirmar criação de Colaborador Oficial:</p>
              <p className="text-emerald-800">
                <strong>{selectedAdmissao.nomeCompleto}</strong> • {selectedAdmissao.cargo} (R$ {(selectedAdmissao.salarioCombinado || 0).toLocaleString('pt-BR')})
              </p>
            </div>

            {/* Check for missing mandatory items */}
            {((selectedAdmissao.checklist || []).filter(c => c.obrigatorio && !c.concluido).length > 0) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-amber-900 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Atenção: Existem itens pendentes no checklist!</span>
                </p>
                <p className="text-amber-800 text-[11px]">Recomendamos concluir os itens do checklist antes da efetivação final.</p>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Gestor Responsável</label>
                <input
                  type="text"
                  value={selectedAdmissao.gestor || efetivarGestor}
                  onChange={e => setEfetivarGestor(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Escala / Jornada de Trabalho</label>
                <input
                  type="text"
                  value={selectedAdmissao.jornada || efetivarEscala}
                  onChange={e => setEfetivarEscala(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmEfetivarModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmarEfetivacao}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Efetivando e Criando...' : 'Confirmar e Efetivar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Official Unified Admission Flow Modal */}
      <OfficialAdmissaoFlowModal
        isOpen={isOfficialFlowOpen}
        onClose={() => {
          navigationEpochRef.current += 1;
          autoOpenedAdmissionIdRef.current = null;
          setIsOfficialFlowOpen(false);
          setActiveFlowData(null);
          localStorage.removeItem('selectedAdmissionId');
        }}
        admissaoData={activeFlowData}
        colaboradoresList={colaboradores}
        onSaveAdmissao={async (updated) => {
          if (onSalvarAdmissao) await onSalvarAdmissao(updated);
        }}
        onEfetivarAdmissao={async (adm, dados) => {
          return onEfetivarAdmissao(adm, dados);
        }}
        onPersistSuccess={(message) => setFlowFeedback(message)}
        companyId={companyId}
      />
    </div>
  );
};
