import React, { useState, useEffect } from 'react';
import { 
  User, 
  Briefcase, 
  FileText, 
  FileCheck, 
  Calendar, 
  Clock, 
  Gift, 
  CreditCard, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Upload, 
  Trash2, 
  Eye, 
  Copy, 
  Send, 
  Check, 
  Plus, 
  UserPlus, 
  Building2, 
  Sparkles,
  Search,
  Lock,
  Mail,
  Phone,
  MapPin,
  HelpCircle,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import { 
  AdmissaoPending, 
  ColaboradorCompleto, 
  TipoContrato, 
  EstadoCivil,
  ItemChecklistAdmissao 
} from '../../types/dp';
import { 
  getColaboradoresFirestore, 
  getBeneficiosFirestore,
  saveAdmissaoFirestore, 
  concluirEfetivacaoAdmissao,
  markColaboradorAccessCreatedFirestore,
} from '../../services/dpFirestoreService';
import { auth } from '../../../lib/firebase';
import { UserService } from '../../../services/UserService';
import { storage } from '../../../lib/firebase';
import { getDownloadURL, ref, uploadBytes } from '../../../firebase/storage';
import { requireTenantId } from '../../../lib/tenant';

interface OfficialAdmissaoFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  admissaoData?: Partial<AdmissaoPending> | null;
  colaboradoresList?: ColaboradorCompleto[];
  onSaveAdmissao: (admissao: AdmissaoPending) => Promise<void>;
  onEfetivarAdmissao: (
    admissao: AdmissaoPending, 
    dadosAdicionais?: { gestor?: string; escala?: string; bancoAgencia?: string; rg?: string }
  ) => Promise<ColaboradorCompleto | void>;
  onPersistSuccess?: (message: string) => void;
  companyId: string;
  origemEntrada?: 'Recrutamento' | 'Cadastro Manual' | 'Importação';
}

type StepKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const STEPS = [
  { id: 1, title: 'Dados Básicos', subtitle: 'Dados essenciais e endereço' },
  { id: 2, title: 'Dados Profissionais', subtitle: 'Cargo, departamento, salário' },
  { id: 3, title: 'Documentos', subtitle: 'Anexos e comprovantes' },
  { id: 4, title: 'Contrato & Jornada', subtitle: 'Regime, escala e horários' },
  { id: 5, title: 'Benefícios', subtitle: 'VT, VR, Saúde, etc.' },
  { id: 6, title: 'Dados Bancários', subtitle: 'Banco, conta e PIX' },
  { id: 7, title: 'Acesso ao Sistema', subtitle: 'Usuário e permissões' },
  { id: 8, title: 'Revisão & Efetivação', subtitle: 'Validação final e aceite' },
];

const DEFAULT_DOC_TYPES = [
  { id: 'doc-rg', nome: 'RG ou CNH', obrigatorio: true },
  { id: 'doc-cpf', nome: 'CPF', obrigatorio: true },
  { id: 'doc-ctps', nome: 'Carteira de Trabalho (CTPS)', obrigatorio: true },
  { id: 'doc-pis', nome: 'PIS / PASEP', obrigatorio: false },
  { id: 'doc-residencia', nome: 'Comprovante de Residência', obrigatorio: true },
  { id: 'doc-aso', nome: 'Exame Ocupacional (ASO Admissional)', obrigatorio: true },
  { id: 'doc-banco', nome: 'Comprovante de Dados Bancários', obrigatorio: true },
  { id: 'doc-foto', nome: 'Foto 3x4 / Imagem de Perfil', obrigatorio: false },
  { id: 'doc-reservista', nome: 'Certificado de Reservista', obrigatorio: false },
  { id: 'doc-diploma', nome: 'Comprovante de Escolaridade / Diploma', obrigatorio: false },
  { id: 'doc-certidao', nome: 'Certidão de Nascimento / Casamento', obrigatorio: false },
];

// Helper to validate CPF formatting & basic length
export function validateCPF(cpfRaw: string): boolean {
  const clean = cpfRaw.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean.charAt(i)) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean.charAt(i)) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10))) return false;

  return true;
}

export const OfficialAdmissaoFlowModal: React.FC<OfficialAdmissaoFlowModalProps> = ({
  isOpen,
  onClose,
  admissaoData,
  colaboradoresList = [],
  onSaveAdmissao,
  onEfetivarAdmissao,
  onPersistSuccess,
  companyId,
  origemEntrada = 'Cadastro Manual'
}) => {
  const [currentStep, setCurrentStep] = useState<StepKey>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isEfetivando, setIsEfetivando] = useState(false);
  const [efetivadoSuccess, setEfetivadoSuccess] = useState(false);
  const [accessCreationPending, setAccessCreationPending] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [duplicateCpfWarning, setDuplicateCpfWarning] = useState<string | null>(null);
  const [catalogoBeneficios, setCatalogoBeneficios] = useState<any[]>([]);
  const [operationFeedback, setOperationFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // RH_ADMISSION_SIMPLIFIED_PILOT_V1
  // O piloto simplifica somente a apresentação. Todos os campos e dados continuam preservados.
  const [showAdditionalPersonalInfo, setShowAdditionalPersonalInfo] = useState(false);

  const notifyPersistSuccess = (message: string, admissaoId: string) => {
    try {
      onPersistSuccess?.(message);
    } catch (error) {
      console.warn('[ADMISSAO_UI_REFRESH_FAILED]', {
        admissaoId,
        empresaId: companyId,
        error,
      });
    }
  };

  // Main Admission Form State
  const [formData, setFormData] = useState<AdmissaoPending>({
    id: `adm-${Date.now()}`,
    empresaId: companyId,
    nomeCompleto: '',
    nomeSocial: '',
    email: '',
    telefone: '',
    cpf: '',
    rg: '',
    orgaoEmissor: '',
    dataNascimento: '',
    genero: 'Não informado',
    estadoCivil: 'Solteiro(a)',
    nacionalidade: 'Brasileira',
    naturalidade: '',
    nomeMae: '',
    nomePai: '',
    fotoUrl: '',

    // Endereço
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: 'SP'
    },

    // Profissionais
    cargo: '',
    departamento: 'Operações',
    salarioCombinado: 3500,
    tipoContrato: 'CLT' as TipoContrato,
    dataAdmissaoPrevista: new Date().toISOString().split('T')[0],
    matricula: '',
    centroCusto: 'CC-100',
    gestor: 'Diretoria de RH',
    unidade: 'Matriz',
    jornada: '5x2 (Segunda a Sexta 08:00 - 18:00)',
    horario: '08:00 às 18:00 (1h de intervalo)',
    modalidade: 'Presencial',
    periodoExperiencia: '45 + 45 dias',
    sindicato: 'SINDRH',
    cbo: '',
    localTrabalho: 'Escritório Central',

    // Dados Bancários
    dadosBancarios: {
      banco: 'Banco Itaú',
      agencia: '0123',
      conta: '45678-9',
      tipoConta: 'Corrente',
      chavePix: '',
      titular: '',
      cpfTitular: ''
    },

    // Benefícios
    beneficiosSelecionados: ['Vale Transporte', 'Vale Refeição', 'Plano de Saúde'],

    // Documentos Anexados
    documentosAnexados: DEFAULT_DOC_TYPES.map(d => ({
      id: d.id,
      tipo: d.nome,
      nomeArquivo: '',
      url: '',
      status: 'Pendente' as const,
      dataEnvio: ''
    })),

    // Checklist
    checklist: DEFAULT_DOC_TYPES.map(d => ({
      item: d.nome,
      obrigatorio: d.obrigatorio,
      concluido: false
    })),

    status: 'Aguardando documentos',
    createdAt: new Date().toISOString()
  });

  // State for Acesso
  const [acessoConfig, setAcessoConfig] = useState({
    gerarAcesso: true,
    emailAcesso: '',
    perfil: 'Colaborador' as 'Colaborador' | 'Gestor' | 'RH' | 'Administrador',
    modulosHabilitados: ['Portal do Colaborador', 'Ponto Eletrônico', 'Holerites', 'Documentos', 'Férias', 'Benefícios'],
    senhaProvisoria: '',
    senhaProvisoriaGerada: false,
    invitationSent: false
  });

  // Load catalog of benefits & initial data
  useEffect(() => {
    if (companyId) {
      getBeneficiosFirestore(companyId).then(setCatalogoBeneficios).catch(console.warn);
    }
  }, [companyId]);

  // Sync state when admissaoData changes or modal opens
  useEffect(() => {
    if (!isOpen) return;
    setAccessCreationPending(false);
    setEfetivadoSuccess(false);

    if (admissaoData && Object.keys(admissaoData).length > 0) {
      const savedStep = Number((admissaoData as any).etapaAtual);
      setCurrentStep(savedStep >= 1 && savedStep <= 8 ? savedStep as StepKey : 1);
      const merged: AdmissaoPending = {
        id: admissaoData.id || `adm-${Date.now()}`,
        empresaId: admissaoData.empresaId || companyId,
        candidatoId: admissaoData.candidatoId,
        contratacaoId: admissaoData.contratacaoId,
        jobId: admissaoData.jobId,
        vagaTitulo: admissaoData.vagaTitulo,
        nomeCompleto: admissaoData.nomeCompleto || '',
        nomeSocial: admissaoData.nomeSocial || '',
        email: admissaoData.email || '',
        telefone: admissaoData.telefone || '',
        cpf: admissaoData.cpf || '',
        rg: admissaoData.rg || '',
        orgaoEmissor: admissaoData.orgaoEmissor || '',
        dataNascimento: admissaoData.dataNascimento || '',
        genero: admissaoData.genero || 'Não informado',
        estadoCivil: admissaoData.estadoCivil || 'Solteiro(a)',
        nacionalidade: admissaoData.nacionalidade || 'Brasileira',
        naturalidade: admissaoData.naturalidade || '',
        nomeMae: admissaoData.nomeMae || '',
        nomePai: admissaoData.nomePai || '',
        fotoUrl: admissaoData.fotoUrl || '',

        endereco: {
          cep: admissaoData.endereco?.cep || '',
          logradouro: admissaoData.endereco?.logradouro || '',
          numero: admissaoData.endereco?.numero || '',
          complemento: admissaoData.endereco?.complemento || '',
          bairro: admissaoData.endereco?.bairro || '',
          cidade: admissaoData.endereco?.cidade || '',
          estado: admissaoData.endereco?.estado || 'SP'
        },

        cargo: admissaoData.cargo || '',
        departamento: admissaoData.departamento || 'Operações',
        salarioCombinado: admissaoData.salarioCombinado || 3500,
        tipoContrato: (admissaoData.tipoContrato as TipoContrato) || 'CLT',
        dataAdmissaoPrevista: admissaoData.dataAdmissaoPrevista || new Date().toISOString().split('T')[0],
        matricula: admissaoData.matricula || '',
        centroCusto: admissaoData.centroCusto || 'CC-100',
        gestor: admissaoData.gestor || 'Diretoria de RH',
        unidade: admissaoData.unidade || 'Matriz',
        jornada: admissaoData.jornada || '5x2 (Segunda a Sexta 08:00 - 18:00)',
        horario: admissaoData.horario || '08:00 às 18:00 (1h de intervalo)',
        modalidade: admissaoData.modalidade || 'Presencial',
        periodoExperiencia: admissaoData.periodoExperiencia || '45 + 45 dias',
        sindicato: admissaoData.sindicato || 'SINDRH',
        cbo: admissaoData.cbo || '',
        localTrabalho: admissaoData.localTrabalho || 'Escritório Central',

        dadosBancarios: {
          banco: admissaoData.dadosBancarios?.banco || 'Banco Itaú',
          agencia: admissaoData.dadosBancarios?.agencia || '0123',
          conta: admissaoData.dadosBancarios?.conta || '45678-9',
          tipoConta: admissaoData.dadosBancarios?.tipoConta || 'Corrente',
          chavePix: admissaoData.dadosBancarios?.chavePix || '',
          titular: admissaoData.dadosBancarios?.titular || admissaoData.nomeCompleto || '',
          cpfTitular: admissaoData.dadosBancarios?.cpfTitular || admissaoData.cpf || ''
        },

        beneficiosSelecionados: admissaoData.beneficiosSelecionados || ['Vale Transporte', 'Vale Refeição', 'Plano de Saúde'],

        documentosAnexados: admissaoData.documentosAnexados?.length 
          ? admissaoData.documentosAnexados 
          : DEFAULT_DOC_TYPES.map(d => ({
              id: d.id,
              tipo: d.nome,
              nomeArquivo: '',
              url: '',
              status: 'Pendente' as const,
              dataEnvio: ''
            })),

        checklist: admissaoData.checklist?.length
          ? admissaoData.checklist
          : DEFAULT_DOC_TYPES.map(d => ({
              item: d.nome,
              obrigatorio: d.obrigatorio,
              concluido: false
            })),

        status: admissaoData.status || 'Aguardando documentos',
        createdAt: admissaoData.createdAt || new Date().toISOString()
      };

      setFormData(merged);
      setAcessoConfig(prev => ({
        ...prev,
        emailAcesso: admissaoData.email || prev.emailAcesso
      }));
    } else {
      setCurrentStep(1);
      // Reset to blank for manual entry
      setFormData({
        id: `adm-${Date.now()}`,
        empresaId: companyId,
        nomeCompleto: '',
        nomeSocial: '',
        email: '',
        telefone: '',
        cpf: '',
        rg: '',
        orgaoEmissor: '',
        dataNascimento: '',
        genero: 'Não informado',
        estadoCivil: 'Solteiro(a)',
        nacionalidade: 'Brasileira',
        naturalidade: '',
        nomeMae: '',
        nomePai: '',
        fotoUrl: '',
        endereco: {
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: 'SP'
        },
        cargo: '',
        departamento: 'Operações',
        salarioCombinado: 3500,
        tipoContrato: 'CLT',
        dataAdmissaoPrevista: new Date().toISOString().split('T')[0],
        matricula: '',
        centroCusto: 'CC-100',
        gestor: 'Diretoria de RH',
        unidade: 'Matriz',
        jornada: '5x2 (Segunda a Sexta 08:00 - 18:00)',
        horario: '08:00 às 18:00 (1h de intervalo)',
        modalidade: 'Presencial',
        periodoExperiencia: '45 + 45 dias',
        sindicato: 'SINDRH',
        cbo: '',
        localTrabalho: 'Escritório Central',
        dadosBancarios: {
          banco: 'Banco Itaú',
          agencia: '0123',
          conta: '45678-9',
          tipoConta: 'Corrente',
          chavePix: '',
          titular: '',
          cpfTitular: ''
        },
        beneficiosSelecionados: ['Vale Transporte', 'Vale Refeição', 'Plano de Saúde'],
        documentosAnexados: DEFAULT_DOC_TYPES.map(d => ({
          id: d.id,
          tipo: d.nome,
          nomeArquivo: '',
          url: '',
          status: 'Pendente',
          dataEnvio: ''
        })),
        checklist: DEFAULT_DOC_TYPES.map(d => ({
          item: d.nome,
          obrigatorio: d.obrigatorio,
          concluido: false
        })),
        status: 'Aguardando documentos',
        createdAt: new Date().toISOString()
      });
    }

    setCurrentStep(1);
    setCpfError(null);
    setDuplicateCpfWarning(null);
    setEfetivadoSuccess(false);
  }, [isOpen, admissaoData, companyId]);

  // Validate CPF and check for duplicate in company
  useEffect(() => {
    if (!formData.cpf) {
      setCpfError(null);
      setDuplicateCpfWarning(null);
      return;
    }

    const cleanCpf = formData.cpf.replace(/\D/g, '');
    if (cleanCpf.length === 11) {
      if (!validateCPF(cleanCpf)) {
        setCpfError('CPF inválido. Verifique os dígitos informados.');
      } else {
        setCpfError(null);

        // Check duplicate among existing colaboradores
        const existingColab = colaboradoresList.find(c => c.pessoais?.cpf?.replace(/\D/g, '') === cleanCpf);
        if (existingColab) {
          setDuplicateCpfWarning(`Atenção: Já existe um colaborador cadastrado com este CPF (${existingColab.nomeCompleto} - Cargo: ${existingColab.profissionais?.cargo}).`);
        } else {
          setDuplicateCpfWarning(null);
        }
      }
    } else {
      setCpfError(null);
      setDuplicateCpfWarning(null);
    }
  }, [formData.cpf, colaboradoresList]);

  // Auto ViaCEP lookup
  const handleCepBlur = async (cepVal: string) => {
    const cleanCep = cepVal.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await resp.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: {
              ...prev.endereco,
              cep: cepVal,
              logradouro: data.logradouro || prev.endereco?.logradouro || '',
              bairro: data.bairro || prev.endereco?.bairro || '',
              cidade: data.localidade || prev.endereco?.cidade || '',
              estado: data.uf || prev.endereco?.estado || 'SP'
            }
          }));
        }
      } catch (e) {
        console.warn('Erro ao consultar ViaCEP:', e);
      }
    }
  };

  // Step Status Calculations
  const getStepStatus = (stepId: number) => {
    if (stepId === 1) {
      if (!formData.nomeCompleto || !formData.cpf || !formData.email) return 'Com erro';
      if (cpfError || duplicateCpfWarning) return 'Pendente';
      return 'Concluída';
    }
    if (stepId === 2) {
      if (!formData.cargo || !formData.salarioCombinado || !formData.dataAdmissaoPrevista) return 'Pendente';
      return 'Concluída';
    }
    if (stepId === 3) {
      const docsPendent = (formData.documentosAnexados || []).filter(d => {
        const isMandatory = DEFAULT_DOC_TYPES.find(dt => dt.nome === d.tipo)?.obrigatorio;
        return isMandatory && d.status !== 'Aprovado' && d.status !== 'Enviado';
      });
      if (docsPendent.length > 0) return 'Pendente';
      return 'Concluída';
    }
    if (stepId === 4) {
      if (!formData.tipoContrato || !formData.jornada) return 'Pendente';
      return 'Concluída';
    }
    if (stepId === 5) {
      if (!formData.beneficiosSelecionados || formData.beneficiosSelecionados.length === 0) return 'Em andamento';
      return 'Concluída';
    }
    if (stepId === 6) {
      if (!formData.dadosBancarios?.banco || !formData.dadosBancarios?.conta) return 'Pendente';
      return 'Concluída';
    }
    if (stepId === 7) {
      if (acessoConfig.gerarAcesso && acessoConfig.senhaProvisoriaGerada) return 'Concluída';
      return 'Em andamento';
    }
    if (stepId === 8) {
      return 'Não iniciada';
    }
    return 'Em andamento';
  };

  const handleDocumentUpload = async (docId: string, file: File) => {
    const tenantId = requireTenantId(companyId, 'anexar documento da admissão');
    if (!file || file.size === 0) throw new Error('Selecione um arquivo válido.');
    if (file.size > 20 * 1024 * 1024) throw new Error('O arquivo deve ter no máximo 20 MB.');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const employeeId = (formData as any).colaboradorId || formData.candidatoId || formData.id;
    const storageRef = ref(storage, `companies/${tenantId}/employees/${employeeId}/admission/${docId}/${safeName}`);
    await uploadBytes(storageRef, file, {
      contentType: file.type || 'application/octet-stream',
      customMetadata: { companyId: tenantId, admissionId: formData.id, documentTypeId: docId },
    });
    const downloadUrl = await getDownloadURL(storageRef);
    const updatedDocs = (formData.documentosAnexados || []).map(d => {
      if (d.id === docId) {
        return {
          ...d,
          nomeArquivo: file.name,
          url: downloadUrl,
          status: 'Enviado' as const,
          dataEnvio: new Date().toISOString()
        };
      }
      return d;
    });

    const updatedChecklist = (formData.checklist || []).map(c => {
      const matchDoc = updatedDocs.find(d => d.tipo === c.item);
      if (matchDoc && (matchDoc.status === 'Aprovado' || matchDoc.status === 'Enviado')) {
        return { ...c, concluido: true, dataConclusao: new Date().toISOString().split('T')[0] };
      }
      return c;
    });

    setFormData(prev => ({
      ...prev,
      documentosAnexados: updatedDocs,
      checklist: updatedChecklist
    }));
  };

  // Generate Temporary Access Credentials
  const handleGerarAcessoTemporario = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let tempPass = 'MaisRH@';
    for (let i = 0; i < 6; i++) {
      tempPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAcessoConfig(prev => ({
      ...prev,
      senhaProvisoria: tempPass,
      senhaProvisoriaGerada: true
    }));
  };

  // Copy Login Credentials
  const handleCopyCredentials = () => {
    const text = `Acesso ao Portal do Colaborador RH TRANSFORMA:\nEmail: ${acessoConfig.emailAcesso || formData.email}\nSenha Temporária: ${acessoConfig.senhaProvisoria}\nLink de Acesso: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Save Draft Progress
  const handleSaveDraft = async (closeAfterSave = false) => {
    setIsSaving(true);
    setOperationFeedback(null);
    try {
      const updated: AdmissaoPending = {
        ...formData,
        empresaId: companyId,
        companyId,
        etapaAtual: currentStep,
        updatedAt: new Date().toISOString()
      } as AdmissaoPending;
      await onSaveAdmissao(updated);
      console.info('[ADMISSAO_SAVE_SUCCESS]', {
        admissaoId: updated.id,
        candidatoId: updated.candidatoId || null,
        empresaId: companyId,
        etapaAtual: currentStep,
      });
      const message = closeAfterSave
        ? 'Admissão salva com sucesso. Você pode continuar posteriormente.'
        : 'Admissão salva com sucesso.';
      setOperationFeedback({ type: 'success', message });
      notifyPersistSuccess(message, updated.id);
      if (closeAfterSave) onClose();
    } catch (err: any) {
      console.error('Erro ao salvar rascunho de admissão:', err);
      setOperationFeedback({
        type: 'error',
        message: err?.message || 'Ocorreu um erro ao salvar o rascunho. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Efetivar Colaborador (Step 8 Final Action)
  const handleEfetivarSubmit = async () => {
    if (!formData.nomeCompleto || !formData.email || !formData.cpf) {
      alert('Por favor, preencha Nome Completo, CPF e E-mail antes de efetivar.');
      return;
    }

    if (duplicateCpfWarning) {
      const confirmCont = window.confirm('Atenção: Já existe um colaborador com este CPF. Deseja prosseguir mesmo assim?');
      if (!confirmCont) return;
    }

    setIsEfetivando(true);
    setOperationFeedback(null);
    let accessPending = false;
    try {
      // 1. First ensure admission doc is saved in Firestore
      const finalAdmission: AdmissaoPending = {
        ...formData,
        empresaId: companyId,
        status: 'Pronto para Efetivação',
        updatedAt: new Date().toISOString()
      };
      await onSaveAdmissao(finalAdmission);

      // 2. Call the official Efetivação procedure
      const efetivado = await onEfetivarAdmissao(finalAdmission, {
        gestor: formData.gestor,
        escala: formData.jornada,
        bancoAgencia: `${formData.dadosBancarios?.banco} | Ag ${formData.dadosBancarios?.agencia} | C/C ${formData.dadosBancarios?.conta}`,
        rg: formData.rg
      });
      const efetivadoId = efetivado && typeof efetivado === 'object' && 'id' in efetivado
        ? String((efetivado as { id?: unknown }).id || '')
        : '';

      // 3. Criar acesso é uma etapa posterior e independente da efetivação.
      // A senha provisoria nunca e persistida em texto no Firestore.
      if (acessoConfig.gerarAcesso) {
        try {
          const emailAccess = (acessoConfig.emailAcesso || formData.email || '').toLowerCase().trim();
          if (!emailAccess) throw new Error('Informe um e-mail para criar o acesso do colaborador.');
          if (!acessoConfig.senhaProvisoria || acessoConfig.senhaProvisoria.length < 6) {
            throw new Error('A senha provisória deve ter pelo menos 6 caracteres.');
          }

          await UserService.create({
            email: emailAccess,
            password: acessoConfig.senhaProvisoria,
            displayName: formData.nomeCompleto,
            companyId,
            role: acessoConfig.perfil || 'Colaborador',
            tipoUsuario: 'FUNCIONARIO',
            colaboradorId: efetivadoId || (formData as any).colaboradorId || (formData as any).colaboradorIdCriado,
            status: 'Ativo',
            permissions: acessoConfig.modulosHabilitados || [],
            allowClientSideFallback: false,
          });
          const colaboradorId = efetivadoId || (formData as any).colaboradorId || (formData as any).colaboradorIdCriado;
          if (colaboradorId) {
            await markColaboradorAccessCreatedFirestore(colaboradorId, companyId, emailAccess);
          }
          setAccessCreationPending(false);
        } catch (accessError: any) {
          accessPending = true;
          setAccessCreationPending(true);
          console.warn('[ADMISSAO_USER_ACCESS_CREATE_FAILED]', {
            uid: auth.currentUser?.uid || null,
            empresaId: companyId,
            admissaoId: finalAdmission.id,
            contratacaoId: finalAdmission.contratacaoId || null,
            collection: 'usuarios/users',
            path: 'API /api/users/create',
            operation: 'create-user-access',
            code: accessError?.code || accessError?.status || null,
            error: accessError,
          });
        }
      }

      setEfetivadoSuccess(true);
      console.info('[ADMISSAO_FINALIZE_SUCCESS]', {
        admissaoId: finalAdmission.id,
        candidatoId: finalAdmission.candidatoId || null,
        colaboradorId: efetivadoId || (finalAdmission as any).colaboradorIdCriado || null,
        empresaId: companyId,
      });
      const successMessage = accessPending
        ? 'Admissão concluída com sucesso. Colaborador efetivado. O acesso ficou pendente.'
        : 'Admissão concluída com sucesso. Colaborador efetivado.';
      notifyPersistSuccess(successMessage, finalAdmission.id);
      onClose();
    } catch (err: any) {
      console.error('Erro durante a efetivação:', err);
      setOperationFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Falha ao efetivar colaborador.',
      });
    } finally {
      setIsEfetivando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0 relative border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/30 rounded-2xl border border-indigo-500/30 text-indigo-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Admissão Simplificada — Piloto
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                  formData.candidatoId ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {formData.candidatoId ? 'Origem: Recrutamento' : 'Origem: Cadastro Manual'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {formData.nomeCompleto ? `Admissão de ${formData.nomeCompleto}` : 'Nova admissão de colaborador'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveDraft(false)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Salvar Rascunho</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PROGRESS INDICATOR BAR (8 STEPS) */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 px-4 sm:px-6 shrink-0 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-2 min-w-[760px]">
            {STEPS.map((step) => {
              const status = getStepStatus(step.id);
              const isActive = currentStep === step.id;
              const isPast = currentStep > step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id as StepKey)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isActive
                      ? 'bg-white text-indigo-600'
                      : isPast
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {step.id}
                  </span>
                  <span className="whitespace-nowrap">{step.title}</span>
                  {status === 'Concluída' && !isActive && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
                  )}
                  {status === 'Com erro' && !isActive && (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN STEP CONTENT AREA */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {operationFeedback && !efetivadoSuccess && (
            <div className={`max-w-4xl mx-auto mb-4 rounded-2xl border p-3.5 text-xs font-bold flex items-center gap-2 ${
              operationFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`} role={operationFeedback.type === 'error' ? 'alert' : 'status'}>
              {operationFeedback.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{operationFeedback.message}</span>
            </div>
          )}
          
          {efetivadoSuccess ? (
            <div className="py-12 px-6 text-center max-w-lg mx-auto space-y-5 animate-scale-up">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Colaborador Efetivado com Sucesso!</h3>
                <p className="text-xs text-slate-600">
                  {formData.nomeCompleto} foi registrado oficialmente no Departamento Pessoal e já consta na lista de colaboradores ativos da empresa.
                </p>
              </div>

              {acessoConfig.gerarAcesso && accessCreationPending && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Funcionário efetivado. O acesso ao sistema ainda precisa ser criado.</span>
                  </div>
                  <p className="text-xs text-amber-800">A efetivação foi preservada. Crie o acesso depois pelo fluxo autorizado de usuários.</p>
                </div>
              )}

              {acessoConfig.gerarAcesso && !accessCreationPending && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-left space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                    <Key className="w-4 h-4 text-indigo-600" />
                    <span>Acesso Gerado ao Portal do Colaborador</span>
                  </div>
                  <p className="text-xs text-slate-700">
                    <strong>E-mail:</strong> {acessoConfig.emailAcesso || formData.email}
                  </p>
                  {acessoConfig.senhaProvisoria && (
                    <p className="text-xs text-slate-700">
                      <strong>Senha Temporária:</strong> <code className="bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700 font-mono font-bold">{acessoConfig.senhaProvisoria}</code>
                    </p>
                  )}
                </div>
              )}

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Fechar e Concluir
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ETAPA 1 — DADOS PESSOAIS */}
              {currentStep === 1 && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-600" />
                        <span>Dados Básicos do Colaborador</span>
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">* Campos obrigatórios</span>
                    </div>

                    {duplicateCpfWarning && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>{duplicateCpfWarning}</div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-indigo-50/70 border border-indigo-100 px-4 py-3">
                      <div>
                        <p className="text-xs font-extrabold text-indigo-950">Comece apenas com o essencial</p>
                        <p className="text-[11px] text-indigo-700 mt-0.5">Informações adicionais serão solicitadas apenas quando necessário.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAdditionalPersonalInfo(value => !value)}
                        className="shrink-0 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-[11px] font-extrabold text-indigo-700 hover:bg-indigo-100 transition"
                      >
                        {showAdditionalPersonalInfo ? 'Ocultar informações adicionais' : 'Informações adicionais'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                        <input
                          type="text"
                          value={formData.nomeCompleto}
                          onChange={e => setFormData({ ...formData, nomeCompleto: e.target.value })}
                          placeholder="Nome civil completo"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      {showAdditionalPersonalInfo && (

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nome Social</label>
                        <input
                          type="text"
                          value={formData.nomeSocial || ''}
                          onChange={e => setFormData({ ...formData, nomeSocial: e.target.value })}
                          placeholder="Se houver"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">CPF *</label>
                        <input
                          type="text"
                          value={formData.cpf}
                          onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                          className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 ${
                            cpfError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-600'
                          }`}
                        />
                        {cpfError && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{cpfError}</p>}
                      </div>

                      {showAdditionalPersonalInfo && (

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">RG</label>
                        <input
                          type="text"
                          value={formData.rg || ''}
                          onChange={e => setFormData({ ...formData, rg: e.target.value })}
                          placeholder="00.000.000-0"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                      )}

                      {showAdditionalPersonalInfo && (

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Órgão Emissor</label>
                        <input
                          type="text"
                          value={formData.orgaoEmissor || ''}
                          onChange={e => setFormData({ ...formData, orgaoEmissor: e.target.value })}
                          placeholder="SSP/SP"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Data de Nascimento *</label>
                        <input
                          type="date"
                          value={formData.dataNascimento || ''}
                          onChange={e => setFormData({ ...formData, dataNascimento: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      {showAdditionalPersonalInfo && (

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Sexo / Gênero</label>
                        <select
                          value={formData.genero || 'Não informado'}
                          onChange={e => setFormData({ ...formData, genero: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        >
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Não-binário">Não-binário</option>
                          <option value="Outro">Outro</option>
                          <option value="Não informado">Prefiro não informar</option>
                        </select>
                      </div>
                      )}

                      {showAdditionalPersonalInfo && (

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Estado Civil</label>
                        <select
                          value={formData.estadoCivil || 'Solteiro(a)'}
                          onChange={e => setFormData({ ...formData, estadoCivil: e.target.value as EstadoCivil })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        >
                          <option value="Solteiro(a)">Solteiro(a)</option>
                          <option value="Casado(a)">Casado(a)</option>
                          <option value="Divorciado(a)">Divorciado(a)</option>
                          <option value="Viúvo(a)">Viúvo(a)</option>
                          <option value="União Estável">União Estável</option>
                        </select>
                      </div>
                      )}

                      {showAdditionalPersonalInfo && (

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nacionalidade</label>
                        <input
                          type="text"
                          value={formData.nacionalidade || 'Brasileira'}
                          onChange={e => setFormData({ ...formData, nacionalidade: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                      )}

                      {showAdditionalPersonalInfo && (

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Naturalidade (Cidade/UF)</label>
                        <input
                          type="text"
                          value={formData.naturalidade || ''}
                          onChange={e => setFormData({ ...formData, naturalidade: e.target.value })}
                          placeholder="São Paulo / SP"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                      )}

                      {showAdditionalPersonalInfo && (

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Mãe</label>
                        <input
                          type="text"
                          value={formData.nomeMae || ''}
                          onChange={e => setFormData({ ...formData, nomeMae: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                      )}

                      {showAdditionalPersonalInfo && (

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Pai</label>
                        <input
                          type="text"
                          value={formData.nomePai || ''}
                          onChange={e => setFormData({ ...formData, nomePai: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Pessoal *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          placeholder="colaborador@email.com"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                        <input
                          type="text"
                          value={formData.telefone || ''}
                          onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                          placeholder="(11) 99999-9999"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Endereço Residencial */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <span>Endereço Residencial</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">CEP</label>
                        <input
                          type="text"
                          value={formData.endereco?.cep || ''}
                          onChange={e => setFormData({
                            ...formData,
                            endereco: { ...formData.endereco, cep: e.target.value }
                          })}
                          onBlur={e => handleCepBlur(e.target.value)}
                          placeholder="00000-000"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Rua / Logradouro</label>
                        <input
                          type="text"
                          value={formData.endereco?.logradouro || ''}
                          onChange={e => setFormData({
                            ...formData,
                            endereco: { ...formData.endereco, logradouro: e.target.value }
                          })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Número</label>
                        <input
                          type="text"
                          value={formData.endereco?.numero || ''}
                          onChange={e => setFormData({
                            ...formData,
                            endereco: { ...formData.endereco, numero: e.target.value }
                          })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      {showAdditionalPersonalInfo && (

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Complemento</label>
                        <input
                          type="text"
                          value={formData.endereco?.complemento || ''}
                          onChange={e => setFormData({
                            ...formData,
                            endereco: { ...formData.endereco, complemento: e.target.value }
                          })}
                          placeholder="Apto 12 Bloco B"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                      )}

                      {showAdditionalPersonalInfo && (

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Bairro</label>
                        <input
                          type="text"
                          value={formData.endereco?.bairro || ''}
                          onChange={e => setFormData({
                            ...formData,
                            endereco: { ...formData.endereco, bairro: e.target.value }
                          })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
                        <input
                          type="text"
                          value={formData.endereco?.cidade || ''}
                          onChange={e => setFormData({
                            ...formData,
                            endereco: { ...formData.endereco, cidade: e.target.value }
                          })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Estado (UF)</label>
                        <input
                          type="text"
                          value={formData.endereco?.estado || 'SP'}
                          onChange={e => setFormData({
                            ...formData,
                            endereco: { ...formData.endereco, estado: e.target.value }
                          })}
                          maxLength={2}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 2 — DADOS PROFISSIONAIS */}
              {currentStep === 2 && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <span>Enquadramento Profissional & Cargo</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Cargo *</label>
                        <input
                          type="text"
                          value={formData.cargo}
                          onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                          placeholder="ex: Desenvolvedor Senior"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">CBO (Código Ocupação)</label>
                        <input
                          type="text"
                          value={formData.cbo || ''}
                          onChange={e => setFormData({ ...formData, cbo: e.target.value })}
                          placeholder="ex: 2124-05"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Departamento</label>
                        <select
                          value={formData.departamento || 'Operações'}
                          onChange={e => setFormData({ ...formData, departamento: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        >
                          <option value="Operações">Operações</option>
                          <option value="Tecnologia">Tecnologia</option>
                          <option value="Recursos Humanos">Recursos Humanos</option>
                          <option value="Financeiro">Financeiro</option>
                          <option value="Comercial">Comercial</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Logística">Logística</option>
                          <option value="Jurídico">Jurídico</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Centro de Custo</label>
                        <input
                          type="text"
                          value={formData.centroCusto || 'CC-100'}
                          onChange={e => setFormData({ ...formData, centroCusto: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Gestor Responsável</label>
                        <input
                          type="text"
                          value={formData.gestor || 'Diretoria de RH'}
                          onChange={e => setFormData({ ...formData, gestor: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Unidade / Filial</label>
                        <input
                          type="text"
                          value={formData.unidade || 'Matriz'}
                          onChange={e => setFormData({ ...formData, unidade: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Data de Admissão Prevista *</label>
                        <input
                          type="date"
                          value={formData.dataAdmissaoPrevista}
                          onChange={e => setFormData({ ...formData, dataAdmissaoPrevista: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Salário Combinado (R$) *</label>
                        <input
                          type="number"
                          value={formData.salarioCombinado}
                          onChange={e => setFormData({ ...formData, salarioCombinado: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Matrícula (Opção)</label>
                        <input
                          type="text"
                          value={formData.matricula || ''}
                          onChange={e => setFormData({ ...formData, matricula: e.target.value })}
                          placeholder="Autogerada se vazio"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Modalidade de Trabalho</label>
                        <select
                          value={formData.modalidade || 'Presencial'}
                          onChange={e => setFormData({ ...formData, modalidade: e.target.value as any })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        >
                          <option value="Presencial">Presencial</option>
                          <option value="Híbrido">Híbrido</option>
                          <option value="Home Office">Home Office (100% Remoto)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Local de Trabalho</label>
                        <input
                          type="text"
                          value={formData.localTrabalho || 'Escritório Central'}
                          onChange={e => setFormData({ ...formData, localTrabalho: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Período de Experiência</label>
                        <select
                          value={formData.periodoExperiencia || '45 + 45 dias'}
                          onChange={e => setFormData({ ...formData, periodoExperiencia: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        >
                          <option value="30 + 30 dias">30 + 30 dias (Máx. 60 dias)</option>
                          <option value="45 + 45 dias">45 + 45 dias (Máx. 90 dias - Padrão CLT)</option>
                          <option value="90 dias corridos">90 dias corridos</option>
                          <option value="Sem período de experiência">Sem período de experiência</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 3 — DOCUMENTOS E ANEXOS */}
              {currentStep === 3 && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-indigo-600" />
                          <span>Central de Documentos & Comprovantes</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Anexe os arquivos obrigatórios antes da efetivação final do colaborador.
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                        {(formData.documentosAnexados || []).filter(d => d.status === 'Aprovado' || d.status === 'Enviado').length} de {(formData.documentosAnexados || []).length} documentos anexados
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {(formData.documentosAnexados || []).map((docItem) => {
                        const isMandatory = DEFAULT_DOC_TYPES.find(dt => dt.nome === docItem.tipo)?.obrigatorio;
                        const isDone = docItem.status === 'Aprovado' || docItem.status === 'Enviado';

                        return (
                          <div
                            key={docItem.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                              isDone
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : isMandatory
                                ? 'bg-white border-slate-200 hover:border-indigo-300'
                                : 'bg-slate-50/50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-extrabold text-slate-900">{docItem.tipo}</span>
                                  {isMandatory && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded">
                                      Obrigatório
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {docItem.nomeArquivo ? docItem.nomeArquivo : 'Nenhum arquivo anexado'}
                                </p>
                              </div>

                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {docItem.status === 'Aprovado' ? 'Aprovado' : docItem.status === 'Enviado' ? 'Recebido' : 'Pendente'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                              {isDone ? (
                                <>
                                  <button
                                    onClick={() => window.open(docItem.url || '#', '_blank')}
                                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Visualizar</span>
                                  </button>
                                  <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer ml-auto">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Substituir</span>
                                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={async e => { const file = e.target.files?.[0]; if (file) await handleDocumentUpload(docItem.id, file); e.currentTarget.value = ''; }} />
                                  </label>
                                </>
                              ) : (
                                <label className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Anexar {docItem.tipo}</span>
                                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={async e => { const file = e.target.files?.[0]; if (file) await handleDocumentUpload(docItem.id, file); e.currentTarget.value = ''; }} />
                                </label>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 4 — CONTRATO E JORNADA */}
              {currentStep === 4 && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>Modelo de Contrato & Vínculo</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Contrato</label>
                        <select
                          value={formData.tipoContrato}
                          onChange={e => setFormData({ ...formData, tipoContrato: e.target.value as TipoContrato })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        >
                          <option value="CLT">CLT (Consolidação das Leis do Trabalho)</option>
                          <option value="PJ">PJ (Prestador de Serviços)</option>
                          <option value="Estágio">Estágio (Lei 11.788/08)</option>
                          <option value="Aprendiz">Jovem Aprendiz</option>
                          <option value="Temporário">Temporário (Lei 6.019/74)</option>
                          <option value="Diretor Estatutário">Diretor Estatutário</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Sindicato Representante</label>
                        <input
                          type="text"
                          value={formData.sindicato || 'SINDRH'}
                          onChange={e => setFormData({ ...formData, sindicato: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Convenção Coletiva (CCTA)</label>
                        <input
                          type="text"
                          value="CCTA Vigente 2026/2027"
                          readOnly
                          className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Jornada de Trabalho */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>Jornada, Horários & Ponto Eletrônico</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Escala de Trabalho</label>
                        <select
                          value={formData.jornada || '5x2 (Segunda a Sexta 08:00 - 18:00)'}
                          onChange={e => setFormData({ ...formData, jornada: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        >
                          <option value="5x2 (Segunda a Sexta 08:00 - 18:00)">5x2 (Segunda a Sexta 08:00 - 18:00 com 1h intervalo - 44h/sem)</option>
                          <option value="5x2 (Segunda a Sexta 09:00 - 18:00)">5x2 (Segunda a Sexta 09:00 - 18:00 com 1h intervalo - 40h/sem)</option>
                          <option value="6x1 (Escala Operacional)">6x1 (Escala Operacional 44h/semana)</option>
                          <option value="12x36 (Plantão Dia/Noite)">12x36 (Escala 12h de Trabalho x 36h de Descanso)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Banco de Horas</label>
                        <select
                          defaultValue="Ativo"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        >
                          <option value="Ativo">Ativo (Compensação em até 6 meses)</option>
                          <option value="Pagamento de Hora Extra">Pagamento de Hora Extra na Folha</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 5 — BENEFÍCIOS */}
              {currentStep === 5 && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Gift className="w-4 h-4 text-indigo-600" />
                          <span>Atribuição de Benefícios & Descontos</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Selecione os benefícios que o colaborador receberá a partir do primeiro dia de trabalho.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* RH_BENEFITS_CATALOG_ADMISSION_UI_V1 */}
                      {catalogoBeneficios
                        .filter((ben) => ben && ben.ativo !== false && ben.status !== 'Inativo')
                        .map((ben) => {
                          const selectionKey = ben.id || ben.nome;
                          const currentSelected = formData.beneficiosSelecionados || [];
                          const isSelected = currentSelected.includes(selectionKey) || currentSelected.includes(ben.nome);
                          const iconByCategory: Record<string, string> = {
                            'Vale Transporte': '🚌',
                            'Vale Refeição': '🍽️',
                            'Vale Alimentação': '🛒',
                            'Plano de Saúde': '🏥',
                            'Plano Odontológico': '🦷',
                            'Seguro de Vida': '🛡️',
                            'Auxílio Home Office': '💻',
                            'Gympass / Academia': '🏋️'
                          };
                          const desc = ben.descricao || (Number(ben.valorBeneficio || 0) > 0
                            ? `R$ ${Number(ben.valorBeneficio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • ${ben.recorrencia || 'Mensal'}`
                            : ben.tipoCalculo || 'Benefício da empresa');

                          return (
                            <div
                              key={selectionKey}
                              onClick={() => {
                                const current = formData.beneficiosSelecionados || [];
                                const withoutSameBenefit = current.filter(b => b !== selectionKey && b !== ben.nome);
                                const updated = isSelected
                                  ? withoutSameBenefit
                                  : [...withoutSameBenefit, selectionKey];
                                setFormData({ ...formData, beneficiosSelecionados: updated });
                              }}
                              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-indigo-50/50 border-indigo-400 ring-1 ring-indigo-400'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{iconByCategory[ben.categoria] || '🎁'}</span>
                                <div>
                                  <h4 className="text-xs font-extrabold text-slate-900">{ben.nome}</h4>
                                  <p className="text-[11px] text-slate-500">{desc}</p>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      {catalogoBeneficios.filter((ben) => ben && ben.ativo !== false && ben.status !== 'Inativo').length === 0 && (
                        <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                          Nenhum benefício ativo no catálogo da empresa. Cadastre ou ative um benefício em Departamento Pessoal → Benefícios.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 6 — DADOS BANCÁRIOS E PAGAMENTO */}
              {currentStep === 6 && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Conta Bancária para Pagamento de Salário</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Instituição Bancária</label>
                        <select
                          value={formData.dadosBancarios?.banco || 'Banco Itaú'}
                          onChange={e => setFormData({
                            ...formData,
                            dadosBancarios: { ...formData.dadosBancarios, banco: e.target.value }
                          })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        >
                          <option value="Banco Itaú">Banco Itaú Unibanco (341)</option>
                          <option value="Banco Bradesco">Banco Bradesco (237)</option>
                          <option value="Banco Santander">Banco Santander (033)</option>
                          <option value="Banco do Brasil">Banco do Brasil (001)</option>
                          <option value="Caixa Econômica">Caixa Econômica Federal (104)</option>
                          <option value="Nubank">Nubank Pagamentos (260)</option>
                          <option value="Banco Inter">Banco Inter (077)</option>
                          <option value="C6 Bank">C6 Bank (336)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Agência (com dígito)</label>
                        <input
                          type="text"
                          value={formData.dadosBancarios?.agencia || ''}
                          onChange={e => setFormData({
                            ...formData,
                            dadosBancarios: { ...formData.dadosBancarios, agencia: e.target.value }
                          })}
                          placeholder="0123"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Conta (com dígito)</label>
                        <input
                          type="text"
                          value={formData.dadosBancarios?.conta || ''}
                          onChange={e => setFormData({
                            ...formData,
                            dadosBancarios: { ...formData.dadosBancarios, conta: e.target.value }
                          })}
                          placeholder="45678-9"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Conta</label>
                        <select
                          value={formData.dadosBancarios?.tipoConta || 'Corrente'}
                          onChange={e => setFormData({
                            ...formData,
                            dadosBancarios: { ...formData.dadosBancarios, tipoConta: e.target.value as any }
                          })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        >
                          <option value="Corrente">Conta Corrente</option>
                          <option value="Salário">Conta Salário</option>
                          <option value="Poupança">Conta Poupança</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Chave PIX (Opção)</label>
                        <input
                          type="text"
                          value={formData.dadosBancarios?.chavePix || ''}
                          onChange={e => setFormData({
                            ...formData,
                            dadosBancarios: { ...formData.dadosBancarios, chavePix: e.target.value }
                          })}
                          placeholder="CPF, e-mail ou celular"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Titular da Conta</label>
                        <input
                          type="text"
                          value={formData.dadosBancarios?.titular || formData.nomeCompleto}
                          onChange={e => setFormData({
                            ...formData,
                            dadosBancarios: { ...formData.dadosBancarios, titular: e.target.value }
                          })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 7 — GERAR ACESSO AO SISTEMA */}
              {currentStep === 7 && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Key className="w-4 h-4 text-indigo-600" />
                          <span>Configuração de Acesso ao Portal do Colaborador</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Crie as credenciais para o funcionário bater ponto, consultar holerites e enviar atestados.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">E-mail de Login</label>
                        <input
                          type="email"
                          value={acessoConfig.emailAcesso || formData.email}
                          onChange={e => setAcessoConfig({ ...acessoConfig, emailAcesso: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Perfil de Acesso</label>
                        <select
                          value={acessoConfig.perfil}
                          onChange={e => setAcessoConfig({ ...acessoConfig, perfil: e.target.value as any })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        >
                          <option value="Colaborador">Colaborador (Portal do Colaborador)</option>
                          <option value="Gestor">Gestor de Equipe</option>
                          <option value="RH">Analista / Especialista de RH</option>
                          <option value="Administrador">Administrador da Empresa</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-900">Módulos Habilitados</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          'Portal do Colaborador',
                          'Ponto Eletrônico',
                          'Holerites & Informe',
                          'Documentos & Assinatura',
                          'Solicitações de Férias',
                          'Atestados & Benefícios'
                        ].map((m) => (
                          <label key={m} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{m}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-extrabold text-indigo-900">Gerar Senha Temporária</h4>
                        <p className="text-[11px] text-indigo-700 mt-0.5">
                          {acessoConfig.senhaProvisoria
                            ? `Senha criada: ${acessoConfig.senhaProvisoria}`
                            : 'O sistema exigirá a redefinição de senha no primeiro acesso.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {acessoConfig.senhaProvisoria ? (
                          <button
                            onClick={handleCopyCredentials}
                            className="px-3 py-1.5 bg-white border border-indigo-300 text-indigo-800 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-all cursor-pointer flex items-center gap-1"
                          >
                            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedLink ? 'Copiado!' : 'Copiar Credenciais'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleGerarAcessoTemporario}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Gerar Senha</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 8 — REVISÃO E EFETIVAÇÃO */}
              {currentStep === 8 && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <span>Resumo Geral & Auditoria Pré-Efetivação</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Confira os dados antes de consolidar o funcionário no sistema oficial do RH TRANSFORMA.
                        </p>
                      </div>
                    </div>

                    {/* Resumo Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Personal Info */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">Dados Pessoais</span>
                          <button onClick={() => setCurrentStep(1)} className="text-[11px] font-bold text-indigo-600 hover:underline">Editar</button>
                        </div>
                        <p className="text-xs text-slate-700"><strong>Nome:</strong> {formData.nomeCompleto || 'Não informado'}</p>
                        <p className="text-xs text-slate-700"><strong>CPF:</strong> {formData.cpf || 'Não informado'}</p>
                        <p className="text-xs text-slate-700"><strong>E-mail:</strong> {formData.email || 'Não informado'}</p>
                      </div>

                      {/* Professional Info */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">Dados Profissionais</span>
                          <button onClick={() => setCurrentStep(2)} className="text-[11px] font-bold text-indigo-600 hover:underline">Editar</button>
                        </div>
                        <p className="text-xs text-slate-700"><strong>Cargo:</strong> {formData.cargo || 'Não informado'}</p>
                        <p className="text-xs text-slate-700"><strong>Admissão:</strong> {formData.dataAdmissaoPrevista || 'Não informada'}</p>
                        <p className="text-xs text-slate-700"><strong>Salário:</strong> R$ {formData.salarioCombinado?.toLocaleString('pt-BR') || 0}</p>
                      </div>

                      {/* Documents */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">Documentação</span>
                          <button onClick={() => setCurrentStep(3)} className="text-[11px] font-bold text-indigo-600 hover:underline">Editar</button>
                        </div>
                        <p className="text-xs text-slate-700">
                          <strong>Anexados:</strong> {(formData.documentosAnexados || []).filter(d => d.status === 'Aprovado').length} de {(formData.documentosAnexados || []).length}
                        </p>
                      </div>

                      {/* Benefits & Access */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">Benefícios & Acesso</span>
                          <button onClick={() => setCurrentStep(5)} className="text-[11px] font-bold text-indigo-600 hover:underline">Editar</button>
                        </div>
                        <p className="text-xs text-slate-700"><strong>Benefícios:</strong> {(formData.beneficiosSelecionados || []).join(', ') || 'Nenhum'}</p>
                        <p className="text-xs text-slate-700"><strong>Acesso ao Portal:</strong> {acessoConfig.gerarAcesso ? 'Ativado' : 'Desativado'}</p>
                      </div>

                    </div>

                    {/* Final Action Button */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                      <button
                        onClick={handleEfetivarSubmit}
                        disabled={isEfetivando || !formData.nomeCompleto || !formData.cpf || !formData.email || !formData.cargo}
                        className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl transition-all shadow-lg cursor-pointer flex items-center gap-2"
                      >
                        {isEfetivando ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Efetivando Colaborador no DP...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Efetivar Colaborador Oficialmente</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* FOOTER CONTROLS */}
        {!efetivadoSuccess && (
          <div className="bg-white border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1) as StepKey)}
              disabled={currentStep === 1}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar Etapa</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSaveDraft(true)}
                disabled={isSaving}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Salvar e Continuar Depois
              </button>

              {currentStep < 8 ? (
                <button
                  onClick={() => setCurrentStep(prev => Math.min(8, prev + 1) as StepKey)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Próxima Etapa</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
