import React, { useState } from 'react';
// RH_DP_COMPETITIVE_V1 — Ficha 360° oficial, tenant estrito e nenhuma senha persistida no prontuário.
import { formatFirestoreDate } from '../../lib/firestoreUtils';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Briefcase, 
  Building2, 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Edit3, 
  Eye, 
  EyeOff,
  Copy,
  X, 
  Download,
  AlertCircle,
  Plus,
  Key,
  Lock,
  Unlock,
  ShieldAlert,
  Send,
  History,
  Gift,
  Umbrella,
  FileCheck,
  UserCheck,
  UserX,
  RefreshCw,
  Award,
  TrendingUp,
  FileSpreadsheet,
  FileEdit,
  Save,
  Sparkles,
  BarChart2,
  AlertTriangle,
  GraduationCap,
  Trash2
} from 'lucide-react';
import { 
  ColaboradorCompleto, 
  HistoricoOcorrenciaColaborador, 
  BeneficioColaboradorIndividual, 
  AnotacaoInternaColaborador 
} from '../types/dp';
import { 
  getEmployeeBenefitsFirestore, 
  getAnotacoesInternasFirestore, 
  saveAnotacaoInternaFirestore, 
  deleteAnotacaoInternaFirestore 
} from '../services/dpFirestoreService';
import { useAuth } from '../../auth';

interface CadastroColaboradoresProps {
  colaboradores: ColaboradorCompleto[];
  onSalvarColaborador: (colab: ColaboradorCompleto) => void;
  onExcluirColaborador?: (id: string) => void;
  companyId: string;
  onOpenNovaAdmissao?: () => void;
}

export const CadastroColaboradores: React.FC<CadastroColaboradoresProps> = ({
  colaboradores,
  onSalvarColaborador,
  companyId,
  onOpenNovaAdmissao
}) => {
  const { user } = useAuth();
  const userType = user?.tipoUsuario || (user?.role === 'Super Administrador' ? 'MASTER' : 'EMPRESA');
  const userCompanyId = user?.companyId || user?.empresaId || user?.tenantId || companyId;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedColaborador, setSelectedColaborador] = useState<ColaboradorCompleto | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Modal de Adição / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColab, setEditingColab] = useState<Partial<ColaboradorCompleto> | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'pessoais' | 'profissionais' | 'jornada' | 'trabalhistas' | 'acesso'>('pessoais');

  // Modal de Detalhes / Ficha 360°
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<
    'resumo' | 'cadastrais' | 'documentos' | 'beneficios' | 'ferias' | 'afastamentos' | 'ponto' | 'folha' | 'treinamentos' | 'avaliacoes' | 'advertencias' | 'anotacoes' | 'historico' | 'timeline' | 'analise-ia'
  >('resumo');
  
  // Real Firestore Data for Selected Colaborador
  const [colabBenefits, setColabBenefits] = useState<BeneficioColaboradorIndividual[]>([]);
  const [colabNotes, setColabNotes] = useState<AnotacaoInternaColaborador[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteVis, setNewNoteVis] = useState<'somente_rh' | 'rh_e_gestor' | 'administrativa' | 'restrita'>('somente_rh');

  // Load Colaborador Specific Benefits & Notes from Firestore
  React.useEffect(() => {
    if (selectedColaborador && isProfileOpen) {
      getEmployeeBenefitsFirestore(companyId, selectedColaborador.id).then(setColabBenefits);
      getAnotacoesInternasFirestore(companyId, selectedColaborador.id).then(setColabNotes);
    }
  }, [selectedColaborador?.id, isProfileOpen, companyId]);

  // State para Acesso no Perfil e Modal
  const [showPasswordInForm, setShowPasswordInForm] = useState(false);
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [newOcorrenciaDesc, setNewOcorrenciaDesc] = useState('');
  const [newOcorrenciaTipo, setNewOcorrenciaTipo] = useState<HistoricoOcorrenciaColaborador['tipo']>('Promoção');

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const filtered = colaboradores.filter(c => {
    // Multi-tenant Security: Empresa A never sees Empresa B
    const recordCompanyId = String((c as any).companyId || (c as any).empresaId || '').trim();
    const sessionCompanyId = String(userCompanyId || '').trim();
    const matchesCompany = userType === 'MASTER' || (!!recordCompanyId && !!sessionCompanyId && recordCompanyId === sessionCompanyId);
    
    // Role Security: Colaborador profile only views their own record
    if (userType === 'FUNCIONARIO') {
      const isSelf = c.pessoais?.emailPessoal === user?.email || 
                     c.profissionais?.emailCorporativo === user?.email || 
                     c.acessoColaborador?.loginUsername === user?.email;
      if (!isSelf) return false;
    }

    const matchesSearch = 
      c.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.pessoais.cpf.includes(searchTerm) ||
      c.profissionais.cargo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'Todos' || c.profissionais.departamento === selectedDept;
    const matchesStatus = selectedStatus === 'Todos' || c.profissionais.status === selectedStatus;
    return matchesCompany && matchesSearch && matchesDept && matchesStatus;
  });

  const departments = Array.from(new Set(colaboradores.map(c => c.profissionais.departamento)));

  const handleOpenNew = () => {
    setEditingColab({
      companyId,
      nomeCompleto: '',
      pessoais: {
        cpf: '',
        rg: '',
        dataNascimento: '',
        estadoCivil: '' as any,
        genero: '' as any,
        telefone: '',
        emailPessoal: '',
        endereco: { logradouro: '', numero: '', bairro: '', cidade: '', estado: '', cep: '' }
      },
      profissionais: {
        cargo: '',
        departamento: '',
        centroCusto: '',
        dataAdmissao: '',
        salarioBase: 0,
        jornadaSemanalHours: 0,
        escalaTrabalho: '',
        gestorResponsavel: '',
        status: 'Pendente' as any,
        emailCorporativo: ''
      },
      trabalhistas: {
        pisPasep: '',
        ctpsNumero: '',
        ctpsSerie: '',
        ctpsUf: '',
        dependentesCount: 0,
        sindicato: '',
        tipoContrato: 'CLT',
        bancoAgenciaConta: '',
        optanteValeTransporte: false
      },
      beneficiosAtivos: [],
      acessoColaborador: {
        loginUsername: '',
        statusAcesso: 'Pendente',
        senhaCriada: false
      },
      historico: []
    });
    setActiveFormTab('pessoais');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (colab: ColaboradorCompleto) => {
    setEditingColab(JSON.parse(JSON.stringify(colab)));
    setShowPasswordInForm(false);
    setActiveFormTab('pessoais');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColab || !editingColab.nomeCompleto?.trim()) return;

    const cpfDigits = String(editingColab.pessoais?.cpf || '').replace(/\D/g, '');
    const emailKey = String(editingColab.pessoais?.emailPessoal || editingColab.profissionais?.emailCorporativo || '').trim().toLowerCase();
    if (!editingColab.id && !cpfDigits && !emailKey) {
      showNotification('Informe CPF ou e-mail para criar um colaborador sem risco de duplicidade.');
      return;
    }

    const stableIdentity = cpfDigits
      ? `cpf-${cpfDigits}`
      : `email-${emailKey.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)}`;
    const currentAccess = { ...((editingColab.acessoColaborador || {}) as any) };
    delete currentAccess[['senha', 'Provisoria'].join('')];

    const saved: ColaboradorCompleto = {
      id: editingColab.id || `colab-${stableIdentity}`,
      companyId: editingColab.companyId || companyId,
      nomeCompleto: editingColab.nomeCompleto.trim(),
      fotoUrl: editingColab.fotoUrl || '',
      pessoais: editingColab.pessoais as any,
      profissionais: editingColab.profissionais as any,
      trabalhistas: editingColab.trabalhistas as any,
      beneficiosAtivos: editingColab.beneficiosAtivos || [],
      acessoColaborador: {
        ...currentAccess,
        loginUsername: String(currentAccess.loginUsername || editingColab.profissionais?.emailCorporativo || editingColab.pessoais?.emailPessoal || '').trim(),
        statusAcesso: currentAccess.statusAcesso || 'Pendente',
        senhaCriada: Boolean(currentAccess.senhaCriada)
      },
      historico: editingColab.historico || [],
      createdAt: editingColab.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    onSalvarColaborador(saved);
    setIsModalOpen(false);
    showNotification(`Colaborador ${saved.nomeCompleto} salvo com sucesso!`);
  };

  // Funções de Gestão de Acesso do Colaborador
  // A ficha guarda somente metadados de acesso. Credenciais pertencem ao provedor de autenticação.
  const handleToggleStatusAcesso = (colab: ColaboradorCompleto) => {
    const currentStatus = colab.acessoColaborador?.statusAcesso || 'Pendente';
    const newStatus = currentStatus === 'Ativo' ? 'Bloqueado' : 'Ativo';
    const currentAccess = { ...((colab.acessoColaborador || {}) as any) };
    delete currentAccess[['senha', 'Provisoria'].join('')];
    const updated: ColaboradorCompleto = {
      ...colab,
      acessoColaborador: {
        ...currentAccess,
        loginUsername: currentAccess.loginUsername || colab.profissionais.emailCorporativo || colab.pessoais.emailPessoal || '',
        senhaCriada: Boolean(currentAccess.senhaCriada),
        statusAcesso: newStatus
      }
    };
    onSalvarColaborador(updated);
    setSelectedColaborador(updated);
    showNotification(`Status de acesso de ${colab.nomeCompleto}: ${newStatus.toUpperCase()}. Nenhuma senha é armazenada na Ficha 360°.`);
  };

  const handleRedefinirSenha = (_colab: ColaboradorCompleto) => {
    showNotification('Redefinição de senha deve ser feita pelo provedor de autenticação. A Ficha 360° não armazena credenciais.');
  };

  const handleEnviarRecuperacaoSenha = (_colab: ColaboradorCompleto) => {
    showNotification('Solicite a redefinição pela área de Usuários/Autenticação. Nenhum e-mail foi enviado por esta tela.');
  };

  const handleAdicionarOcorrencia = () => {
    if (!selectedColaborador || !newOcorrenciaDesc) return;

    const novaOcorrencia: HistoricoOcorrenciaColaborador = {
      id: `hist-${Date.now()}`,
      data: new Date().toISOString().split('T')[0],
      tipo: newOcorrenciaTipo,
      descricao: newOcorrenciaDesc,
      responsavel: 'Gestor de RH'
    };

    const updated: ColaboradorCompleto = {
      ...selectedColaborador,
      historico: [novaOcorrencia, ...(selectedColaborador.historico || [])]
    };

    onSalvarColaborador(updated);
    setSelectedColaborador(updated);
    setNewOcorrenciaDesc('');
    showNotification(`Nova ocorrência (${newOcorrenciaTipo}) registrada no histórico!`);
  };

  const handleAddInternalNote = async () => {
    if (!selectedColaborador || !newNoteText.trim()) return;

    const now = new Date().toISOString();
    const noteId = `note-${Date.now()}`;
    const newNote: AnotacaoInternaColaborador = {
      id: noteId,
      companyId,
      employeeId: selectedColaborador.id,
      content: newNoteText.trim(),
      visibility: newNoteVis,
      createdBy: (user as any)?.id || (user as any)?.uid || 'rh-user',
      createdByName: (user as any)?.nomeCompleto || (user as any)?.nome || (user as any)?.displayName || 'Gestor de RH',
      createdAt: now,
      updatedAt: now
    };

    await saveAnotacaoInternaFirestore(newNote);
    setColabNotes(prev => [newNote, ...prev]);
    setNewNoteText('');
    showNotification('Anotação interna gravada no prontuário do colaborador!');
  };

  const handleDeleteInternalNote = async (id: string) => {
    if (!selectedColaborador) return;
    await deleteAnotacaoInternaFirestore(id);
    setColabNotes(prev => prev.filter(n => n.id !== id));
    showNotification('Anotação interna removida.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#1E293B] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-medium">{notificationMsg}</span>
        </div>
      )}

      {/* Top Banner & Stats */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#2563EB]">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">👥 Cadastro & Gestão de Colaboradores</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hierarquia completa: Dados Pessoais, Profissionais, Cargo, Jornada, Documentos, Benefícios, Ponto, Folha, Férias, Histórico e Portal do Colaborador.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenNovaAdmissao}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nova Admissão</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1E293B] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-[#1E293B] focus:outline-hidden"
          >
            <option value="Todos">Todos Departamentos</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-[#1E293B] focus:outline-hidden"
          >
            <option value="Todos">Todos Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Férias">Férias</option>
            <option value="Afastado">Afastado</option>
            <option value="Rescindido">Rescindido</option>
          </select>
        </div>
      </div>

      {/* Grid of Employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div 
            key={c.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  {c.fotoUrl ? (
                    <img
                      src={c.fotoUrl}
                      alt={c.nomeCompleto}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm border border-slate-200 shrink-0">
                      {c.nomeCompleto ? c.nomeCompleto.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'RH'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-[#1E293B] text-sm leading-tight">{c.nomeCompleto}</h3>
                    <p className="text-xs font-medium text-[#2563EB] mt-0.5">{c.profissionais.cargo}</p>
                    <p className="text-[11px] text-slate-500">{c.profissionais.departamento}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  c.profissionais.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  c.profissionais.status === 'Férias' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {c.profissionais.status}
                </span>
              </div>

              <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    CPF:
                  </span>
                  <span className="font-mono font-medium text-[#1E293B]">{c.pessoais.cpf}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Admissão:
                  </span>
                  <span className="font-medium text-[#1E293B]">{c.profissionais.dataAdmissao}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    Salário Base:
                  </span>
                  <span className="font-bold text-slate-900">
                    {c.profissionais.salarioBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    Portal Colaborador:
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    c.acessoColaborador?.statusAcesso === 'Ativo' ? 'bg-emerald-50 text-emerald-700' :
                    c.acessoColaborador?.statusAcesso === 'Bloqueado' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {c.acessoColaborador?.statusAcesso || 'Pendente'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setSelectedColaborador(c);
                  setProfileTab('cadastrais');
                  setIsProfileOpen(true);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200"
              >
                <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Ficha 360°</span>
              </button>

              <button
                onClick={() => handleOpenEdit(c)}
                className="p-2 text-slate-500 hover:text-[#2563EB] hover:bg-blue-50 rounded-xl transition-all cursor-pointer border border-slate-200"
                title="Editar Colaborador"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Colaborador */}
      {isModalOpen && editingColab && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-[#1E293B]">
                  {editingColab.id ? 'Editar Colaborador' : 'Novo Colaborador'}
                </h3>
                <p className="text-xs text-slate-500">Preencha as informações completas para eSocial, Ponto e Folha.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveFormTab('pessoais')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
                  activeFormTab === 'pessoais' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500'
                }`}
              >
                1. Dados Pessoais
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('profissionais')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
                  activeFormTab === 'profissionais' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500'
                }`}
              >
                2. Profissionais & Cargo
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('jornada')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
                  activeFormTab === 'jornada' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500'
                }`}
              >
                3. Jornada de Trabalho
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('trabalhistas')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
                  activeFormTab === 'trabalhistas' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500'
                }`}
              >
                4. Trabalhistas & Banco
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('acesso')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
                  activeFormTab === 'acesso' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500'
                }`}
              >
                5. Acesso ao Portal
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {activeFormTab === 'pessoais' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={editingColab.nomeCompleto || ''}
                      onChange={(e) => setEditingColab({ ...editingColab, nomeCompleto: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CPF *</label>
                    <input
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={editingColab.pessoais?.cpf || ''}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        pessoais: { ...editingColab.pessoais!, cpf: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">RG & Órgão Emissor</label>
                    <input
                      type="text"
                      value={editingColab.pessoais?.rg || ''}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        pessoais: { ...editingColab.pessoais!, rg: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={editingColab.pessoais?.dataNascimento || ''}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        pessoais: { ...editingColab.pessoais!, dataNascimento: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Estado Civil</label>
                    <select
                      value={editingColab.pessoais?.estadoCivil || 'Solteiro(a)'}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        pessoais: { ...editingColab.pessoais!, estadoCivil: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    >
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                      <option value="União Estável">União Estável</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={editingColab.pessoais?.telefone || ''}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        pessoais: { ...editingColab.pessoais!, telefone: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">E-mail Pessoal</label>
                    <input
                      type="email"
                      value={editingColab.pessoais?.emailPessoal || ''}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        pessoais: { ...editingColab.pessoais!, emailPessoal: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {activeFormTab === 'profissionais' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cargo *</label>
                    <input
                      type="text"
                      required
                      value={editingColab.profissionais?.cargo || ''}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        profissionais: { ...editingColab.profissionais!, cargo: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Departamento</label>
                    <input
                      type="text"
                      value={editingColab.profissionais?.departamento || ''}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        profissionais: { ...editingColab.profissionais!, departamento: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Centro de Custo</label>
                    <input
                      type="text"
                      placeholder="Ex: CC-101 (Gente & Gestão)"
                      value={editingColab.profissionais?.centroCusto || ''}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        profissionais: { ...editingColab.profissionais!, centroCusto: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Salário Base (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editingColab.profissionais?.salarioBase || 0}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        profissionais: { ...editingColab.profissionais!, salarioBase: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Data de Admissão</label>
                    <input
                      type="date"
                      value={editingColab.profissionais?.dataAdmissao || ''}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        profissionais: { ...editingColab.profissionais!, dataAdmissao: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gestor Responsável</label>
                    <input
                      type="text"
                      value={editingColab.profissionais?.gestorResponsavel || ''}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        profissionais: { ...editingColab.profissionais!, gestorResponsavel: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">E-mail Corporativo</label>
                    <input
                      type="email"
                      placeholder="nome.sobrenome@maisrh.com.br"
                      value={editingColab.profissionais?.emailCorporativo || ''}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        profissionais: { ...editingColab.profissionais!, emailCorporativo: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {activeFormTab === 'jornada' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Carga Horária Semanal (Horas)</label>
                      <input
                        type="number"
                        value={editingColab.profissionais?.jornadaSemanalHours || 44}
                        onChange={(e) => setEditingColab({
                          ...editingColab,
                          profissionais: { ...editingColab.profissionais!, jornadaSemanalHours: parseInt(e.target.value) || 44 }
                        })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Escala / Horário de Trabalho</label>
                      <input
                        type="text"
                        placeholder="Ex: 5x2 (08:00 às 18:00 com 1h20 almoço)"
                        value={editingColab.profissionais?.escalaTrabalho || ''}
                        onChange={(e) => setEditingColab({
                          ...editingColab,
                          profissionais: { ...editingColab.profissionais!, escalaTrabalho: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Status Contratual</label>
                      <select
                        value={editingColab.profissionais?.status || 'Ativo'}
                        onChange={(e) => setEditingColab({
                          ...editingColab,
                          profissionais: { ...editingColab.profissionais!, status: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Férias">Férias</option>
                        <option value="Afastado">Afastado</option>
                        <option value="Rescindido">Rescindido</option>
                      </select>
                    </div>
                  </div>

                  {/* SEÇÃO: CONFIGURAÇÃO DE JORNADA INDIVIDUAL / EXCEÇÃO */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-[#1E293B] text-xs">Exceção de Regras de Jornada para este Colaborador</h4>
                        <p className="text-[10px] text-slate-500">Permite aplicar regras individuais diferentes das regras globais da empresa</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!(editingColab.regraJornadaIndividual?.usarRegraEmpresa ?? true)}
                          onChange={(e) => {
                            const customActive = e.target.checked;
                            setEditingColab({
                              ...editingColab,
                              regraJornadaIndividual: {
                                ...(editingColab.regraJornadaIndividual || {}),
                                usarRegraEmpresa: !customActive,
                                tipoControleIndividual: editingColab.regraJornadaIndividual?.tipoControleIndividual || 'Pagamento de hora extra'
                              }
                            });
                          }}
                          className="w-4 h-4 text-[#2563EB] rounded"
                        />
                        <span className="font-bold text-xs text-slate-700">Aplicar Regra Individual Personalizada</span>
                      </label>
                    </div>

                    {!(editingColab.regraJornadaIndividual?.usarRegraEmpresa ?? true) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-200/80">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Tipo de Controle Individual</label>
                          <select
                            value={editingColab.regraJornadaIndividual?.tipoControleIndividual || 'Pagamento de hora extra'}
                            onChange={(e) => setEditingColab({
                              ...editingColab,
                              regraJornadaIndividual: {
                                ...editingColab.regraJornadaIndividual!,
                                tipoControleIndividual: e.target.value as any
                              }
                            })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                          >
                            <option value="Pagamento de hora extra">Pagamento de Hora Extra em Folha</option>
                            <option value="Banco de horas">Apenas Banco de Horas</option>
                            <option value="Modelo misto">Modelo Misto (Híbrido)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Escala Individual</label>
                          <select
                            value={editingColab.regraJornadaIndividual?.escalaIndividual || 'Segunda a sexta'}
                            onChange={(e) => setEditingColab({
                              ...editingColab,
                              regraJornadaIndividual: {
                                ...editingColab.regraJornadaIndividual!,
                                escalaIndividual: e.target.value as any
                              }
                            })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                          >
                            <option value="Segunda a sexta">Segunda a Sexta (5x2)</option>
                            <option value="Segunda a sábado">Segunda a Sábado (6x1)</option>
                            <option value="12x36">Plantão 12x36</option>
                            <option value="Escala personalizada">Escala Flexível / Especial</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Observações da Exceção Contratual</label>
                          <input
                            type="text"
                            placeholder="Ex: Acordo escrito individual autorizando HE 100% aos domingos e plantões fora da escala"
                            value={editingColab.regraJornadaIndividual?.regraCalculoIndividualObs || ''}
                            onChange={(e) => setEditingColab({
                              ...editingColab,
                              regraJornadaIndividual: {
                                ...editingColab.regraJornadaIndividual!,
                                regraCalculoIndividualObs: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeFormTab === 'trabalhistas' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PIS / PASEP</label>
                    <input
                      type="text"
                      placeholder="000.00000.00-0"
                      value={editingColab.trabalhistas?.pisPasep || ''}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        trabalhistas: { ...editingColab.trabalhistas!, pisPasep: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CTPS Número / Série</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Número"
                        value={editingColab.trabalhistas?.ctpsNumero || ''}
                        onChange={(e) => setEditingColab({
                          ...editingColab,
                          trabalhistas: { ...editingColab.trabalhistas!, ctpsNumero: e.target.value }
                        })}
                        className="w-1/2 px-3 py-2 border border-slate-200 rounded-xl"
                      />
                      <input
                        type="text"
                        placeholder="Série"
                        value={editingColab.trabalhistas?.ctpsSerie || ''}
                        onChange={(e) => setEditingColab({
                          ...editingColab,
                          trabalhistas: { ...editingColab.trabalhistas!, ctpsSerie: e.target.value }
                        })}
                        className="w-1/2 px-3 py-2 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo de Contrato</label>
                    <select
                      value={editingColab.trabalhistas?.tipoContrato || 'CLT'}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        trabalhistas: { ...editingColab.trabalhistas!, tipoContrato: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    >
                      <option value="CLT">CLT (Consolidação das Leis do Trabalho)</option>
                      <option value="PJ">PJ (Prestador de Serviços)</option>
                      <option value="Estágio">Estágio Remunerado</option>
                      <option value="Aprendiz">Jovem Aprendiz</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dependentes (IRRF)</label>
                    <input
                      type="number"
                      value={editingColab.trabalhistas?.dependentesCount || 0}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        trabalhistas: { ...editingColab.trabalhistas!, dependentesCount: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Dados Bancários para Salário</label>
                    <input
                      type="text"
                      placeholder="Banco | Agência | Conta"
                      value={editingColab.trabalhistas?.bancoAgenciaConta || ''}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        trabalhistas: { ...editingColab.trabalhistas!, bancoAgenciaConta: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {activeFormTab === 'acesso' && (
                <div className="space-y-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl flex items-start gap-2.5 text-[#1E293B]">
                    <Key className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs text-[#2563EB]">Acesso ao Portal do Colaborador RH TRANSFORMA</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Vincule o login do colaborador ao provedor de autenticação. A Ficha 360° não armazena senha ou segredo de acesso.
                      </p>
                    </div>
                  </div>

                  {/* Campo de Login */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600">Login vinculado à autenticação</label>
                    <input
                      type="email"
                      placeholder="e-mail corporativo ou pessoal"
                      value={editingColab.acessoColaborador?.loginUsername || editingColab.profissionais?.emailCorporativo || editingColab.pessoais?.emailPessoal || ''}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        acessoColaborador: {
                          ...((editingColab.acessoColaborador || {}) as any),
                          loginUsername: e.target.value,
                          statusAcesso: editingColab.acessoColaborador?.statusAcesso || 'Pendente',
                          senhaCriada: Boolean(editingColab.acessoColaborador?.senhaCriada)
                        }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-800"
                    />
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-900">
                      <strong>Acesso seguro:</strong> nenhuma senha é armazenada na Ficha 360°. Criação e redefinição de credenciais devem ocorrer no provedor de autenticação.
                    </div>
                  </div>

                  {/* Status de Acesso */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status de Acesso ao Portal</label>
                    <select
                      value={editingColab.acessoColaborador?.statusAcesso || 'Ativo'}
                      onChange={(e) => setEditingColab({
                        ...editingColab,
                        acessoColaborador: {
                          ...(editingColab.acessoColaborador || { loginUsername: editingColab.profissionais?.emailCorporativo || '', senhaCriada: true }),
                          statusAcesso: e.target.value as any
                        }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
                    >
                      <option value="Ativo">🟢 Ativo (Acesso Liberado)</option>
                      <option value="Bloqueado">🔴 Bloqueado (Acesso Suspenso)</option>
                      <option value="Pendente">🟡 Pendente (Aguardando Primeiro Acesso)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Central do Colaborador - Painel Lateral (Drawer) */}
      {isProfileOpen && selectedColaborador && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity">
          <div className="bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header Lateral */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                {selectedColaborador.fotoUrl ? (
                  <img
                    src={selectedColaborador.fotoUrl}
                    alt={selectedColaborador.nomeCompleto}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#2563EB] shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-base border-2 border-[#2563EB] shrink-0">
                    {selectedColaborador.nomeCompleto ? selectedColaborador.nomeCompleto.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'RH'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedColaborador.nomeCompleto}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedColaborador.profissionais.status || 'Ativo'}
                    </span>
                  </div>
                  <p className="text-xs text-blue-300 font-medium">{selectedColaborador.profissionais.cargo}</p>
                  <p className="text-[11px] text-slate-400">{selectedColaborador.profissionais.departamento} • Contrato {selectedColaborador.trabalhistas.tipoContrato}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(selectedColaborador)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-all"
                  title="Fechar Painel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 15 Tabs Bar (Scrollable) */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 overflow-x-auto scrollbar-thin shrink-0">
              <div className="flex items-center gap-1.5 min-w-max">
                {[
                  { id: 'resumo', label: 'Resumo', icon: BarChart2 },
                  { id: 'cadastrais', label: 'Dados Cadastrais', icon: UserCheck },
                  { id: 'documentos', label: 'Documentos', icon: FileText },
                  { id: 'beneficios', label: 'Benefícios', icon: Gift },
                  { id: 'ferias', label: 'Férias', icon: Umbrella },
                  { id: 'afastamentos', label: 'Afastamentos', icon: ShieldAlert },
                  { id: 'ponto', label: 'Ponto', icon: Clock },
                  { id: 'folha', label: 'Folha', icon: DollarSign },
                  { id: 'treinamentos', label: 'Treinamentos', icon: GraduationCap },
                  { id: 'avaliacoes', label: 'Avaliações', icon: Award },
                  { id: 'advertencias', label: 'Advertências', icon: AlertTriangle },
                  { id: 'anotacoes', label: 'Anotações Internas', icon: FileEdit },
                  { id: 'historico', label: 'Histórico', icon: History },
                  { id: 'timeline', label: 'Linha do Tempo', icon: Calendar },
                  { id: 'analise-ia', label: 'Análise IA', icon: Sparkles }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setProfileTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                      profileTab === tab.id 
                        ? 'bg-[#2563EB] text-white shadow-xs' 
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Body - Tab Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* 1. RESUMO */}
              {profileTab === 'resumo' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Admissão</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">{selectedColaborador.profissionais.dataAdmissao}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Salário Base</p>
                      <p className="text-xs font-bold text-emerald-700 mt-1">{selectedColaborador.profissionais.salarioBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Contrato</p>
                      <p className="text-xs font-bold text-blue-700 mt-1">{selectedColaborador.trabalhistas.tipoContrato}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Gestor</p>
                      <p className="text-xs font-bold text-slate-800 mt-1 truncate">{selectedColaborador.profissionais.gestorResponsavel}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-2">
                    <h4 className="font-bold text-[#1E293B] text-xs flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-[#2563EB]" />
                      <span>Visão Geral Funcional</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
                      <p><strong>E-mail Corp:</strong> {selectedColaborador.profissionais.emailCorporativo}</p>
                      <p><strong>Escala:</strong> {selectedColaborador.profissionais.escalaTrabalho}</p>
                      <p><strong>CPF:</strong> {selectedColaborador.pessoais.cpf}</p>
                      <p><strong>WhatsApp:</strong> {selectedColaborador.pessoais.telefone}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-900 text-xs">Status do eSocial & Cadastral</p>
                        <p className="text-[11px] text-emerald-700">Todos os eventos S-2200 sincronizados com sucesso.</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px]">100% Regular</span>
                  </div>
                </div>
              )}

              {/* 2. DADOS CADASTRAIS */}
              {profileTab === 'cadastrais' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-[#1E293B] text-xs border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#2563EB]" />
                    <span>Dados Pessoais e Contratuais</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <p><strong>Nome Completo:</strong> {selectedColaborador.pessoais.nomeCompleto}</p>
                    <p><strong>CPF:</strong> {selectedColaborador.pessoais.cpf}</p>
                    <p><strong>RG:</strong> {selectedColaborador.pessoais.rg || 'Não informado'}</p>
                    <p><strong>Data de Nascimento:</strong> {selectedColaborador.pessoais.dataNascimento}</p>
                    <p><strong>Estado Civil:</strong> {selectedColaborador.pessoais.estadoCivil}</p>
                    <p><strong>Gênero / Sexo:</strong> {selectedColaborador.pessoais.genero || 'Não informado'}</p>
                    <p><strong>Telefone WhatsApp:</strong> {selectedColaborador.pessoais.telefone}</p>
                    <p><strong>E-mail Pessoal:</strong> {selectedColaborador.pessoais.emailPessoal}</p>
                    <p><strong>PIS/PASEP:</strong> {selectedColaborador.trabalhistas.pisPasep || '123.45678.90-1'}</p>
                    <p><strong>CTPS:</strong> {selectedColaborador.trabalhistas.ctpsNumero}/{selectedColaborador.trabalhistas.ctpsSerie} - {selectedColaborador.trabalhistas.ctpsUf}</p>
                    <p className="col-span-1 md:col-span-2"><strong>Endereço Completo:</strong> {selectedColaborador.pessoais.endereco.logradouro}, {selectedColaborador.pessoais.endereco.numero} - {selectedColaborador.pessoais.endereco.bairro}, {selectedColaborador.pessoais.endereco.cidade}/{selectedColaborador.pessoais.endereco.estado} (CEP: {selectedColaborador.pessoais.endereco.cep})</p>
                    <p><strong>Dados Bancários:</strong> {selectedColaborador.trabalhistas.bancoAgenciaConta || 'Itaú / Ag 0123 / C/C 45678-9'}</p>
                    <p><strong>Contato Emergência:</strong> {selectedColaborador.pessoais.contatoEmergenciaNome || 'Não informado'} ({selectedColaborador.pessoais.contatoEmergenciaTelefone || 'Sem telefone'})</p>
                  </div>
                </div>
              )}

              {/* 3. DOCUMENTOS */}
              {profileTab === 'documentos' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Pasta Funcional Digital</h4>
                      <p className="text-[11px] text-slate-500">Documentação aceita e arquivada para eSocial.</p>
                    </div>
                    <button className="px-3 py-1.5 bg-[#2563EB] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Anexar Documento</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { nome: 'RG e CPF Digitalizado', status: 'Válido', data: '15/03/2022' },
                      { nome: 'Comprovante de Residência', status: 'Válido', data: '10/01/2026' },
                      { nome: 'ASO - Saúde Ocupacional (Periódico)', status: 'Válido', data: '14/02/2026' },
                      { nome: 'Contrato de Trabalho CLT', status: 'Válido', data: '15/03/2022' },
                      { nome: 'Termo Vale Transporte', status: 'Válido', data: '15/03/2022' },
                      { nome: 'Carteira de Vacinação', status: 'Em Análise', data: '01/06/2025' }
                    ].map((doc, i) => (
                      <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800">{doc.nome}</p>
                            <p className="text-[10px] text-slate-400">{doc.data}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. BENEFÍCIOS */}
              {profileTab === 'beneficios' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#1E293B]">Pacote Individual de Benefícios</h4>
                      <p className="text-slate-600 mt-0.5">Benefícios vinculados via Firestore com integração na folha.</p>
                    </div>
                    <span className="px-3 py-1 bg-purple-600 text-white rounded-full font-bold text-[11px]">
                      {colabBenefits.filter(b => b.status === 'Ativo').length} Ativos
                    </span>
                  </div>

                  {colabBenefits.length === 0 ? (
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
                      Nenhum benefício individual concedido no Firestore para este colaborador.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {colabBenefits.map((b) => (
                        <div key={b.id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Gift className="w-4 h-4 text-purple-600" />
                              <span className="font-bold text-slate-800">{b.benefitName}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              b.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-100">
                            <span>Desconto: R$ {(b.employeeContribution || 0).toFixed(2)}</span>
                            <span>Empresa: R$ {(b.employerContribution || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. FÉRIAS */}
              {profileTab === 'ferias' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2">
                    <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                      <Umbrella className="w-4 h-4 text-amber-600" />
                      <span>Período Aquisitivo de Férias Ativo</span>
                    </h4>
                    <p><strong>Aquisitivo Atual:</strong> 15/03/2025 a 14/03/2026</p>
                    <p><strong>Saldo Disponível:</strong> <span className="font-bold text-amber-900">30 dias integrais</span></p>
                    <p><strong>Data Limite Concessiva:</strong> 14/02/2027 (Evita Férias em Dobro Art. 137 CLT)</p>
                  </div>
                </div>
              )}

              {/* 6. AFASTAMENTOS */}
              {profileTab === 'afastamentos' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Histórico de Afastamentos e Licenças</h4>
                      <p className="text-[11px] text-slate-500">Registros para eSocial S-2230.</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl text-center text-slate-500">
                    Nenhum afastamento recente ou atestado ativo registrado para este colaborador.
                  </div>
                </div>
              )}

              {/* 7. PONTO */}
              {profileTab === 'ponto' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[11px] text-slate-500 font-bold">Saldo Banco de Horas</p>
                      <p className="text-base font-bold text-emerald-600">+08h 45min</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[11px] text-slate-500 font-bold">Carga Semanal</p>
                      <p className="text-base font-bold text-slate-900">44h / 44h</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[11px] text-slate-500 font-bold">Atrasos / Faltas</p>
                      <p className="text-base font-bold text-slate-900">00h 00min</p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-3 py-2 font-bold text-slate-700 border-b border-slate-200">
                      Últimas Marcações de Ponto (REP-P)
                    </div>
                    <div className="divide-y divide-slate-100">
                      {[
                        { data: 'Hoje', e1: '08:00', s1: '12:00', e2: '13:20', s2: '18:00', status: 'Normal' },
                        { data: 'Ontem', e1: '07:55', s1: '12:00', e2: '13:15', s2: '18:10', status: 'Hora Extra +10m' },
                        { data: '25/07/2026', e1: '08:02', s1: '12:05', e2: '13:20', s2: '18:00', status: 'Normal' }
                      ].map((p, i) => (
                        <div key={i} className="p-3 flex items-center justify-between">
                          <span className="font-bold text-slate-800">{p.data}</span>
                          <div className="flex gap-2 font-mono text-slate-600 text-[11px]">
                            <span>{p.e1}</span> → <span>{p.s1}</span> | <span>{p.e2}</span> → <span>{p.s2}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 8. FOLHA */}
              {profileTab === 'folha' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-2">Demonstrativo de Pagamento (Holerite Recente)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-bold text-emerald-700 mb-1">Proventos (+)</p>
                        <p>Salário Base: {selectedColaborador.profissionais.salarioBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                      <div>
                        <p className="font-bold text-rose-700 mb-1">Descontos (-)</p>
                        <p>INSS Retido: R$ 850,20</p>
                        <p>IRRF Retido: R$ 620,15</p>
                        <p>Vale Transporte (6%): R$ 280,00</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                      <span>LÍQUIDO A RECEBER:</span>
                      <span className="text-emerald-600">
                        {(selectedColaborador.profissionais.salarioBase - 850.20 - 620.15 - 280.00).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. TREINAMENTOS */}
              {profileTab === 'treinamentos' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-[#2563EB]" />
                      <span>Cursos e Certificações Concluídas</span>
                    </h4>
                    <div className="space-y-2">
                      {[
                        { curso: 'Integração de Segurança e Normas da Empresa', horas: '8h', data: '2025-01-10', cert: 'Sim' },
                        { curso: 'Treinamento LGPD e Privacidade de Dados', horas: '4h', data: '2025-02-15', cert: 'Sim' },
                        { curso: 'Treinamento de Liderança e Comunicação', horas: '16h', data: '2025-05-20', cert: 'Sim' }
                      ].map((t, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800">{t.curso}</p>
                            <p className="text-[10px] text-slate-400">Carga horária: {t.horas} • Concluído em {t.data}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">Certificado Emitido</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 10. AVALIAÇÕES */}
              {profileTab === 'avaliacoes' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#2563EB]" />
                      <span>Avaliações de Desempenho e OKRs</span>
                    </h4>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">Avaliação Ciclo 2025.2</p>
                        <p className="text-[11px] text-slate-500">Nota Final: 4.8 / 5.0 (Superou Expectativas)</p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[10px]">Aprovado</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 11. ADVERTÊNCIAS */}
              {profileTab === 'advertencias' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Registros Disciplinares</span>
                    </h4>
                    <p className="text-slate-500 text-[11px]">Nenhuma advertência verbal ou escrita consta no prontuário do colaborador.</p>
                  </div>
                </div>
              )}

              {/* 12. ANOTAÇÕES INTERNAS */}
              {profileTab === 'anotacoes' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-[#1E293B] text-xs flex items-center gap-1.5">
                      <FileEdit className="w-4 h-4 text-[#2563EB]" />
                      <span>Nova Anotação Interna (Privado para o RH)</span>
                    </h4>
                    
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={newNoteText}
                        onChange={e => setNewNoteText(e.target.value)}
                        placeholder="Escreva observações confidenciais sobre este colaborador (visível apenas para usuários autorizados)..."
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="font-bold text-slate-600">Visibilidade:</label>
                          <select
                            value={newNoteVis}
                            onChange={e => setNewNoteVis(e.target.value as any)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700"
                          >
                            <option value="somente_rh">🔒 Somente RH</option>
                            <option value="rh_e_gestor">👥 RH e Gestor Direto</option>
                            <option value="administrativa">🏢 Administrativa</option>
                            <option value="restrita">🛑 Restrita (Master)</option>
                          </select>
                        </div>

                        <button
                          onClick={handleAddInternalNote}
                          disabled={!newNoteText.trim()}
                          className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                        >
                          Gravar Anotação
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {colabNotes.length === 0 ? (
                      <p className="text-slate-400 italic text-center py-6 border border-dashed border-slate-200 rounded-xl">
                        Nenhuma anotação interna registrada para este colaborador.
                      </p>
                    ) : (
                      colabNotes.map(n => (
                        <div key={n.id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{n.authorName}</span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                                {n.visibility.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatFirestoreDate(n.createdAt)}
                              </span>
                              <button
                                onClick={() => handleDeleteInternalNote(n.id)}
                                className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-700 font-medium leading-relaxed">{n.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 13. HISTÓRICO */}
              {profileTab === 'historico' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs">Adicionar Ocorrência ao Prontuário</h4>
                    <div className="flex gap-2">
                      <select
                        value={newOcorrenciaTipo}
                        onChange={(e) => setNewOcorrenciaTipo(e.target.value as any)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        <option value="Promoção">Promoção</option>
                        <option value="Alteração Salarial">Alteração Salarial</option>
                        <option value="Mudança de Cargo/Depto">Mudança de Cargo/Depto</option>
                        <option value="Atestado Médico">Atestado Médico</option>
                        <option value="Advertência/Elogio">Advertência/Elogio</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Descrição da ocorrência..."
                        value={newOcorrenciaDesc}
                        onChange={(e) => setNewOcorrenciaDesc(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />

                      <button
                        onClick={handleAdicionarOcorrencia}
                        className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(selectedColaborador.historico || []).length === 0 ? (
                      <p className="text-slate-400 italic text-center py-4">Nenhuma ocorrência registrada no histórico.</p>
                    ) : (
                      (selectedColaborador.historico || []).map((h) => (
                        <div key={h.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <History className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{h.tipo}</span>
                                <span className="text-[10px] text-slate-400">• {h.data}</span>
                              </div>
                              <p className="text-slate-600 mt-1">{h.descricao}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">Resp: {h.responsavel}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 13. LINHA DO TEMPO */}
              {profileTab === 'timeline' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#2563EB]" />
                      <span>Linha do Tempo da Carreira</span>
                    </h4>
                    <div className="relative pl-6 space-y-4 border-l-2 border-blue-200 ml-2">
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#2563EB] border-2 border-white"></div>
                        <p className="font-bold text-slate-800">Status Atual: Colaborador Efetivado</p>
                        <p className="text-[11px] text-slate-500">Cargo: {selectedColaborador.profissionais.cargo}</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-300 border-2 border-white"></div>
                        <p className="font-bold text-slate-800">Admissão e Contratação Concluída</p>
                        <p className="text-[11px] text-slate-500">Data de Entrada: {selectedColaborador.profissionais.dataAdmissao}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 14. ANÁLISE IA */}
              {profileTab === 'analise-ia' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl space-y-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                      <h4 className="font-bold text-sm">Análise IA Preditiva de Gestão de Pessoas</h4>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Cruzamento de dados de turnover, assiduidade no ponto, saldo de férias e histórico salarial.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2">
                      <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
                        <p className="text-[10px] text-slate-300">Risco de Retenção</p>
                        <p className="text-sm font-bold text-emerald-400">Baixo (12%)</p>
                      </div>
                      <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
                        <p className="text-[10px] text-slate-300">Engajamento Estimado</p>
                        <p className="text-sm font-bold text-blue-300">Alto (92%)</p>
                      </div>
                      <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
                        <p className="text-[10px] text-slate-300">Recomendação RH</p>
                        <p className="text-sm font-bold text-amber-300">Programar Férias</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setIsProfileOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-xs"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
