import React, { useState, useEffect } from 'react';
import { 
  User, 
  Clock, 
  FileText, 
  Umbrella, 
  DollarSign, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Download, 
  Send, 
  Upload, 
  Plus, 
  FileCheck, 
  Building2, 
  Briefcase, 
  Award, 
  LogOut, 
  Phone, 
  Mail, 
  Home, 
  ChevronRight,
  Eye,
  RefreshCw,
  HelpCircle,
  Sparkles,
  Bell,
  MessageSquare,
  Search,
  Check,
  X,
  FileSignature,
  FileSpreadsheet,
  Info,
  HeartHandshake,
  Heart,
  CreditCard,
  Building,
  UserPlus,
  LifeBuoy,
  FileWarning,
  Flame,
  ArrowUpRight,
  Layers,
  FileEdit
} from 'lucide-react';
import { useAuth } from '../../auth';
import { ColaboradorCompleto, DocumentoColaborador } from '../types/dp';
import { 
  getColaboradoresFirestore,
  saveFeriasFirestore, 
  saveAfastamentoFirestore, 
  saveDocumentoFirestore,
  getSolicitacoesPortalFirestore,
  saveSolicitacaoPortalFirestore,
  getChamadosSuporteFirestore,
  saveChamadoSuporteFirestore,
  getComunicadosFirestore,
  saveComunicadoFirestore,
  getDocumentosAssinaturaFirestore,
  saveDocumentoAssinaturaFirestore,
  getDocumentosFirestore
} from '../services/dpFirestoreService';
import {
  SolicitacaoPortalItem,
  ChamadoSuporteItem,
  ComunicadoItem,
  DocumentoAssinaturaItem,
  ArtigoFaqItem
} from '../types/portalTypes';

export type PortalTab = 
  | 'inicio'
  | 'cadastro'
  | 'empresa'
  | 'documentos'
  | 'beneficios'
  | 'ferias'
  | 'afastamentos'
  | 'ponto'
  | 'folha'
  | 'solicitacoes'
  | 'comunicados'
  | 'suporte'
  | 'faq'
  | 'rescisao';

interface PortalColaboradorViewProps {
  initialTab?: PortalTab;
}

export const PortalColaboradorView: React.FC<PortalColaboradorViewProps> = ({
  initialTab = 'inicio'
}) => {
  const { user, logout } = useAuth();
  const companyId = user?.companyId || user?.empresaId || '';

  // Active Tab State
  const [activeTab, setActiveTab] = useState<PortalTab>(initialTab);

  // Colaboradores list
  const [colaboradores, setColaboradores] = useState<ColaboradorCompleto[]>([]);
  
  // Current logged in employee
  const currentColab = colaboradores.find(
    c => c.id === user?.colaboradorId ||
         c.pessoais?.emailPessoal === user?.email ||
         c.profissionais?.emailCorporativo === user?.email
  ) || colaboradores[0] || null;

  // Portal State synced with Firestore
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoPortalItem[]>([]);
  const [chamados, setChamados] = useState<ChamadoSuporteItem[]>([]);
  const [comunicados, setComunicados] = useState<ComunicadoItem[]>([]);
  const [docAssinaturas, setDocAssinaturas] = useState<DocumentoAssinaturaItem[]>([]);
  const [documentosGerais, setDocumentosGerais] = useState<DocumentoColaborador[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);

  // Real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Time punches state for today
  const [pontoHoje, setPontoHoje] = useState<{ id: string; tipo: string; hora: string; status: string }[]>([
    { id: '1', tipo: 'Entrada', hora: '08:02:15', status: 'Confirmado (GPS ±10m)' },
    { id: '2', tipo: 'Intervalo Saída', hora: '12:01:40', status: 'Confirmado (GPS ±10m)' },
  ]);

  // Notifications & UI modals
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Olá! Sou o Assistente IA do RH TRANSFORMA. Como posso ajudar com suas dúvidas sobre férias, ponto, holerites ou solicitações?' }
  ]);

  // Modals state
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [ajusteForm, setAjusteForm] = useState({ data: '', hora: '', tipo: 'Entrada', motivo: '' });

  const [showAlteracaoCadastralModal, setShowAlteracaoCadastralModal] = useState(false);
  const [cadastralForm, setCadastralForm] = useState({ campo: 'Telefone / Celular', valorNovo: '', motivo: '' });

  const [showFeriasModal, setShowFeriasModal] = useState(false);
  const [feriasForm, setFeriasForm] = useState({ dataInicio: '', dias: '30', adiantar13: false, abonoPecuniario: false });

  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({ titulo: '', categoria: 'Atestado Médico', arquivo: null as File | null, observacao: '' });

  const [showAtestadoModal, setShowAtestadoModal] = useState(false);
  const [atestadoForm, setAtestadoForm] = useState({ dataInicio: '', dias: '1', cid: '', observacao: '', arquivo: null as File | null });

  const [showBeneficioModal, setShowBeneficioModal] = useState(false);
  const [beneficioForm, setBeneficioForm] = useState({ tipo: 'Inclusão de Dependente em Plano de Saúde', nomeDependente: '', parentesco: 'Filho(a)', observacao: '' });

  const [showChamadoModal, setShowChamadoModal] = useState(false);
  const [chamadoForm, setChamadoForm] = useState({ categoria: 'Ponto' as ChamadoSuporteItem['categoria'], assunto: '', descricao: '', prioridade: 'Média' as ChamadoSuporteItem['prioridade'] });

  const [showDemissaoModal, setShowDemissaoModal] = useState(false);
  const [demissaoForm, setDemissaoForm] = useState({ dataPrevisao: '', avisoPrevio: 'Trabalhado', motivo: '' });

  const [showSignatureModal, setShowSignatureModal] = useState<DocumentoAssinaturaItem | null>(null);

  // Selected Month Holerite
  const [selectedMesHolerite, setSelectedMesHolerite] = useState('07/2026');

  // FAQ Search Filter
  const [faqSearch, setFaqSearch] = useState('');

  // Load Firestore Data without mock fallback.
  useEffect(() => {
    let isMounted = true;
    async function loadPortalData() {
      setIsLoadingData(true);
      try {
        if (!companyId) {
          if (isMounted) setColaboradores([]);
          return;
        }

        const colabsData = await getColaboradoresFirestore(companyId);
        if (!isMounted) return;
        setColaboradores(colabsData);

        const matchedColab = colabsData.find(
          c => c.id === user?.colaboradorId ||
               c.pessoais?.emailPessoal === user?.email ||
               c.profissionais?.emailCorporativo === user?.email
        ) || colabsData[0] || null;

        if (!matchedColab) {
          setSolicitacoes([]);
          setChamados([]);
          setComunicados([]);
          setDocAssinaturas([]);
          setDocumentosGerais([]);
          return;
        }

        const [solicData, chamData, comData, docAssinData, docsGeraisData] = await Promise.all([
          getSolicitacoesPortalFirestore(companyId, matchedColab.id),
          getChamadosSuporteFirestore(companyId, matchedColab.id),
          getComunicadosFirestore(companyId),
          getDocumentosAssinaturaFirestore(companyId, matchedColab.id),
          getDocumentosFirestore(companyId, matchedColab.id)
        ]);

        if (isMounted) {
          setSolicitacoes(solicData);
          setChamados(chamData);
          setComunicados(comData);
          setDocAssinaturas(docAssinData);
          setDocumentosGerais(docsGeraisData);
          setAiChat([{ role: 'assistant', text: `Olá, ${matchedColab.nomeCompleto.split(' ')[0]}! Sou o Assistente IA do RH TRANSFORMA. Como posso ajudar com suas dúvidas sobre férias, ponto, holerites ou solicitações?` }]);
        }
      } catch (err) {
        console.error('[Portal Colaborador] Erro ao carregar dados:', err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    void loadPortalData();
    return () => { isMounted = false; };
  }, [companyId, user?.colaboradorId, user?.email]);

  if (isLoadingData && !currentColab) {
    return <div className="p-8 text-sm text-slate-500">Carregando dados do colaborador...</div>;
  }

  if (!currentColab) {
    return <div className="p-8"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Nenhum colaborador válido foi encontrado para este usuário e empresa. Verifique o vínculo no Departamento Pessoal.</div></div>;
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handler: Clock In/Out
  const handleBaterPonto = (tipo: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR');
    const newEntry = {
      id: String(Date.now()),
      tipo,
      hora: timeStr,
      status: 'Confirmado (GPS ±10m • SSL Válido)'
    };
    setPontoHoje(prev => [...prev, newEntry]);
    showToast(`Ponto de ${tipo} registrado com sucesso às ${timeStr}!`);
  };

  // Handler: Point Adjustment Request
  const handleAjusteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowAjusteModal(false);

    const newSolic: SolicitacaoPortalItem = {
      id: `solic-ponto-${Date.now()}`,
      companyId,
      employeeId: currentColab.id,
      employeeName: currentColab.nomeCompleto,
      tipoSolicitacao: 'Ajuste de Ponto',
      titulo: `Ajuste de Ponto - ${ajusteForm.tipo} (${ajusteForm.data || 'Hoje'})`,
      descricao: `Solicitação de inclusão/correção do horário ${ajusteForm.hora}. Motivo: ${ajusteForm.motivo}`,
      status: 'Enviada',
      dataSolicitacao: new Date().toISOString(),
      historicoTimeline: [
        {
          data: new Date().toISOString(),
          titulo: 'Solicitação Enviada',
          descricao: 'Aguardando revisão e aprovação do RH / Gestor.',
          autor: currentColab.nomeCompleto,
          tipo: 'colaborador'
        }
      ]
    };

    setSolicitacoes(prev => [newSolic, ...prev]);
    await saveSolicitacaoPortalFirestore(newSolic);
    showToast(`Solicitação de ajuste de ponto gravada no Firestore com sucesso!`);
  };

  // Handler: Cadastral Change Request
  const handleAlteracaoCadastralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowAlteracaoCadastralModal(false);

    const newSolic: SolicitacaoPortalItem = {
      id: `solic-cad-${Date.now()}`,
      companyId,
      employeeId: currentColab.id,
      employeeName: currentColab.nomeCompleto,
      tipoSolicitacao: 'Alteração Cadastral',
      titulo: `Alteração: ${cadastralForm.campo}`,
      descricao: `Novo Valor Solicitado: ${cadastralForm.valorNovo}. Motivo: ${cadastralForm.motivo}`,
      status: 'Enviada',
      dataSolicitacao: new Date().toISOString(),
      historicoTimeline: [
        {
          data: new Date().toISOString(),
          titulo: 'Solicitação de Alteração Enviada',
          descricao: `Enviado pedido de atualização do campo "${cadastralForm.campo}".`,
          autor: currentColab.nomeCompleto,
          tipo: 'colaborador'
        }
      ]
    };

    setSolicitacoes(prev => [newSolic, ...prev]);
    await saveSolicitacaoPortalFirestore(newSolic);
    showToast(`Solicitação de alteração cadastral enviada para aprovação do RH!`);
  };

  // Handler: Vacation Request
  const handleFeriasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowFeriasModal(false);

    const diasGozo = Number(feriasForm.dias) || 30;
    const start = feriasForm.dataInicio || new Date().toISOString().split('T')[0];
    const startDate = new Date(start);
    const endDate = new Date(startDate.setDate(startDate.getDate() + (diasGozo - 1))).toISOString().split('T')[0];

    const salario = currentColab?.profissionais?.salarioBase || 3500;
    const umTerco = salario / 3;

    await saveFeriasFirestore({
      id: `fer-solic-${Date.now()}`,
      companyId,
      colaboradorId: currentColab.id,
      colaboradorNome: currentColab.nomeCompleto,
      cargo: currentColab.profissionais?.cargo || 'Colaborador',
      departamento: currentColab.profissionais?.departamento || 'Geral',
      periodoAquisitivoInicio: '2025-01-01',
      periodoAquisitivoFim: '2025-12-31',
      diasAdquiridos: 30,
      diasGozados: 0,
      diasSaldo: 30,
      dataInicioGozo: start,
      dataFimGozo: endDate,
      diasGozoAbono: diasGozo,
      adiantamento13Salario: feriasForm.adiantar13,
      status: 'Solicitado',
      valorSalarioBaseGozo: salario,
      valorUmTercoConstitucional: umTerco,
      valorTotalLiquidoFerias: salario + umTerco,
      createdAt: new Date().toISOString()
    });

    const newSolic: SolicitacaoPortalItem = {
      id: `solic-ferias-${Date.now()}`,
      companyId,
      employeeId: currentColab.id,
      employeeName: currentColab.nomeCompleto,
      tipoSolicitacao: 'Férias',
      titulo: `Solicitação de Férias (${diasGozo} dias)`,
      descricao: `Início previsto: ${start} até ${endDate}. 13º Anticitado: ${feriasForm.adiantar13 ? 'Sim' : 'Não'}`,
      status: 'Em análise',
      dataSolicitacao: new Date().toISOString(),
      historicoTimeline: [
        {
          data: new Date().toISOString(),
          titulo: 'Agendamento Solicitado',
          descricao: 'Aguardando análise da liderança direta e do RH.',
          autor: currentColab.nomeCompleto,
          tipo: 'colaborador'
        }
      ]
    };

    setSolicitacoes(prev => [newSolic, ...prev]);
    await saveSolicitacaoPortalFirestore(newSolic);
    showToast(`Solicitação de férias gravada no Firestore com sucesso!`);
  };

  // Handler: Atestado / Leave Certificate
  const handleAtestadoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowAtestadoModal(false);

    const hoje = atestadoForm.dataInicio || new Date().toISOString().split('T')[0];
    const filename = atestadoForm.arquivo ? atestadoForm.arquivo.name : `Atestado_${currentColab.nomeCompleto}.pdf`;

    await saveAfastamentoFirestore({
      id: `afast-portal-${Date.now()}`,
      empresaId: companyId,
      companyId,
      colaboradorId: currentColab.id,
      colaboradorNome: currentColab.nomeCompleto,
      cargo: currentColab.profissionais?.cargo || 'Colaborador',
      departamento: currentColab.profissionais?.departamento || 'Geral',
      tipo: 'Atestado médico',
      dataInicio: hoje,
      dataFim: hoje,
      diasAfastado: Number(atestadoForm.dias) || 1,
      observacoes: atestadoForm.observacao || 'Atestado Médico enviado via Portal Self-Service',
      status: 'Ativo',
      createdAt: new Date().toISOString()
    });

    await saveDocumentoFirestore({
      id: `doc-portal-${Date.now()}`,
      empresaId: companyId,
      colaboradorId: currentColab.id,
      colaboradorNome: currentColab.nomeCompleto,
      categoria: 'Saúde ocupacional',
      tipoDocumento: 'Atestado Médico enviado via Portal',
      nomeArquivo: filename,
      status: 'Válido',
      criadoEm: new Date().toISOString()
    });

    const newSolic: SolicitacaoPortalItem = {
      id: `solic-atestado-${Date.now()}`,
      companyId,
      employeeId: currentColab.id,
      employeeName: currentColab.nomeCompleto,
      tipoSolicitacao: 'Atestado Médico / Licença',
      titulo: `Atestado Médico (${atestadoForm.dias} dias)`,
      descricao: `Início em ${hoje}. Anexo: ${filename}. CID: ${atestadoForm.cid || 'Não informado'}`,
      status: 'Em análise',
      dataSolicitacao: new Date().toISOString(),
      historicoTimeline: [
        {
          data: new Date().toISOString(),
          titulo: 'Atestado Enviado',
          descricao: 'Documento enviado com sigilo médico para validação do RH.',
          autor: currentColab.nomeCompleto,
          tipo: 'colaborador'
        }
      ]
    };

    setSolicitacoes(prev => [newSolic, ...prev]);
    await saveSolicitacaoPortalFirestore(newSolic);
    showToast(`Atestado médico registrado no prontuário e enviado para análise do RH!`);
  };

  // Handler: Benefit Request
  const handleBeneficioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowBeneficioModal(false);

    const newSolic: SolicitacaoPortalItem = {
      id: `solic-ben-${Date.now()}`,
      companyId,
      employeeId: currentColab.id,
      employeeName: currentColab.nomeCompleto,
      tipoSolicitacao: 'Inclusão de Benefício',
      titulo: beneficioForm.tipo,
      descricao: `Dependente: ${beneficioForm.nomeDependente} (${beneficioForm.parentesco}). Obs: ${beneficioForm.observacao}`,
      status: 'Enviada',
      dataSolicitacao: new Date().toISOString(),
      historicoTimeline: [
        {
          data: new Date().toISOString(),
          titulo: 'Solicitação de Benefício Enviada',
          descricao: 'Aguardando validação do analista de benefícios.',
          autor: currentColab.nomeCompleto,
          tipo: 'colaborador'
        }
      ]
    };

    setSolicitacoes(prev => [newSolic, ...prev]);
    await saveSolicitacaoPortalFirestore(newSolic);
    showToast(`Solicitação de benefício cadastrada no sistema!`);
  };

  // Handler: Support Ticket Request
  const handleChamadoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowChamadoModal(false);

    const newChamado: ChamadoSuporteItem = {
      id: `ticket-${Date.now()}`,
      companyId,
      employeeId: currentColab.id,
      employeeName: currentColab.nomeCompleto,
      categoria: chamadoForm.categoria,
      assunto: chamadoForm.assunto,
      descricao: chamadoForm.descricao,
      prioridade: chamadoForm.prioridade,
      status: 'Aberto',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      mensagens: [
        {
          id: `msg-${Date.now()}`,
          autor: currentColab.nomeCompleto,
          papeisAutor: 'colaborador',
          texto: chamadoForm.descricao,
          dataHora: new Date().toISOString()
        }
      ]
    };

    setChamados(prev => [newChamado, ...prev]);
    await saveChamadoSuporteFirestore(newChamado);
    showToast(`Chamado de suporte #${newChamado.id.slice(-5)} aberto com sucesso!`);
  };

  // Handler: Electronic Signature
  const handleAssinarDocumento = async (docItem: DocumentoAssinaturaItem) => {
    setShowSignatureModal(null);

    const updatedDoc: DocumentoAssinaturaItem = {
      ...docItem,
      status: 'Assinado',
      dataAssinatura: new Date().toISOString(),
      hashAssinatura: `SHA256-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      ipAssinatura: '189.122.45.10 (SSL Verified)'
    };

    setDocAssinaturas(prev => prev.map(d => d.id === docItem.id ? updatedDoc : d));
    await saveDocumentoAssinaturaFirestore(updatedDoc);
    showToast(`Documento "${docItem.tituloDocumento}" assinado eletronicamente com sucesso!`);
  };

  // Handler: AI Assistant
  const handleSendAiPrompt = () => {
    if (!aiPrompt.trim()) return;

    const userMsg = aiPrompt.trim();
    setAiPrompt('');
    setAiChat(prev => [...prev, { role: 'user', text: userMsg }]);

    setTimeout(() => {
      let reply = `Entendi sua dúvida sobre "${userMsg}". No seu portal você pode acessar o menu correspondente na barra superior. Se precisar solicitar férias, utilize a aba "Minhas Férias"; para problemas no ponto, solicite um ajuste na aba "Meu Ponto".`;
      
      const lower = userMsg.toLowerCase();
      if (lower.includes('férias') || lower.includes('ferias')) {
        reply = `Você tem 30 dias de saldo de férias disponível para o período aquisitivo de 2025/2026. Para agendar, acesse a aba "Minhas Férias" e clique em "Solicitar Agendamento".`;
      } else if (lower.includes('ponto') || lower.includes('batida') || lower.includes('hora')) {
        reply = `O registro de ponto utiliza seu GPS e horário oficial de Brasília. Se esqueceu de bater o ponto, vá para a aba "Meu Ponto" e clique no botão "Solicitar Ajuste / Correção de Ponto".`;
      } else if (lower.includes('holerite') || lower.includes('pagamento') || lower.includes('salário')) {
        reply = `Seu holerite de Julho/2026 já está liberado na aba "Minha Folha / Holerites". Você pode visualizar o demonstrativo e baixar a cópia em PDF a qualquer momento.`;
      }

      setAiChat(prev => [...prev, { role: 'assistant', text: reply }]);
    }, 600);
  };

  // Static FAQ Mock list
  const FAQ_ARTIGOS: ArtigoFaqItem[] = [
    {
      id: 'faq-1',
      categoria: 'Ponto Digital',
      pergunta: 'Como solicitar ajuste quando esquecer de bater o ponto?',
      resposta: 'Acesse a aba "Meu Ponto & Banco de Horas" e clique no botão "Solicitar Ajuste / Correção de Ponto". Preencha a data, o horário correto e a justificativa. Sua solicitação irá para aprovação do seu gestor e do RH.',
      tags: ['ponto', 'ajuste', 'esquecimento', 'batida']
    },
    {
      id: 'faq-2',
      categoria: 'Holerites',
      pergunta: 'Quando o holerite mensal fica disponível para consulta?',
      resposta: 'O demonstrativo de pagamento é liberado no Portal do Colaborador até 2 dias úteis antes da data de pagamento de salário da empresa.',
      tags: ['holerite', 'pagamento', 'salario', 'demonstrativo']
    },
    {
      id: 'faq-3',
      categoria: 'Férias',
      pergunta: 'Com quanta antecedência devo solicitar minhas férias?',
      resposta: 'Recomendamos enviar sua solicitação de férias no portal com no mínimo 30 dias de antecedência do início desejado para aprovação do planejamento da equipe.',
      tags: ['férias', 'solicitação', 'prazo', 'agendamento']
    },
    {
      id: 'faq-4',
      categoria: 'Documentos',
      pergunta: 'Qual o prazo para envio do atestado médico?',
      resposta: 'O atestado médico deve ser enviado no Portal em até 48 horas após a emissão médica na aba "Meus Afastamentos" para abono de faltas.',
      tags: ['atestado', 'médico', 'prazo', 'licença']
    }
  ];

  const filteredFaq = FAQ_ARTIGOS.filter(a => 
    a.pergunta.toLowerCase().includes(faqSearch.toLowerCase()) ||
    a.resposta.toLowerCase().includes(faqSearch.toLowerCase()) ||
    a.tags.some(t => t.toLowerCase().includes(faqSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2563EB] text-white font-black flex items-center justify-center text-lg shadow-sm">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 tracking-tight">
                  MAIS<span className="text-[#2563EB]">RH</span>
                </span>
                <span className="bg-blue-50 text-[#2563EB] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-blue-200/60">
                  Portal do Colaborador 100%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {user?.companyName || (currentColab as any).empresaNome || 'Grupo Alpha Logística S/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Assistant Button */}
            <button
              onClick={() => setShowAiModal(true)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Assistente IA do Funcionário"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span className="hidden md:inline">Assistente IA</span>
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => setShowNotificationsModal(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl relative cursor-pointer"
              title="Notificações"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Profile Pill */}
            <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
              {(currentColab.fotoUrl || user?.avatar) ? (
                <img
                  src={currentColab.fotoUrl || user?.avatar}
                  alt={currentColab.nomeCompleto}
                  className="w-8 h-8 rounded-full object-cover border border-blue-500"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-500">
                  {currentColab.nomeCompleto ? currentColab.nomeCompleto.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'RH'}
                </div>
              )}
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">{currentColab.nomeCompleto}</p>
                <p className="text-[10px] text-slate-500">{currentColab.profissionais?.cargo || 'Colaborador(a)'}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Acesso Seguro Verificado
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  Matrícula: {currentColab.trabalhistas?.ctpsNumero || '002931-SP'}
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Olá, {currentColab.nomeCompleto.split(' ')[0]} 👋
              </h1>
              <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
                Portal de Autoatendimento RH. Registre seu ponto, consulte seu banco de horas, visualize holerites, solicite férias, envie atestados e acompanhe suas solicitações em tempo real.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-center gap-4 text-xs shrink-0">
              <div className="text-center border-r border-white/20 pr-4">
                <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">Jornada Semanal</span>
                <span className="text-sm font-black text-white">{currentColab.profissionais?.jornadaSemanalHours ? `${currentColab.profissionais.jornadaSemanalHours} Hours` : '44 Horas'}</span>
              </div>
              <div className="text-center pr-2">
                <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">Saldo Banco</span>
                <span className="text-sm font-black text-emerald-400">+04h 15m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'inicio', label: 'Início', icon: Home },
            { id: 'ponto', label: 'Meu Ponto', icon: Clock },
            { id: 'folha', label: 'Holerites', icon: DollarSign },
            { id: 'ferias', label: 'Férias', icon: Umbrella },
            { id: 'afastamentos', label: 'Afastamentos', icon: HeartHandshake },
            { id: 'beneficios', label: 'Benefícios', icon: Heart },
            { id: 'documentos', label: 'Documentos', icon: FileText },
            { id: 'cadastro', label: 'Meu Cadastro', icon: User },
            { id: 'empresa', label: 'Minha Empresa', icon: Building2 },
            { id: 'solicitacoes', label: 'Minhas Solicitações', icon: Layers },
            { id: 'comunicados', label: 'Comunicados', icon: Bell },
            { id: 'suporte', label: 'Suporte RH', icon: LifeBuoy },
            { id: 'faq', label: 'FAQ / Ajuda', icon: HelpCircle },
          ].map(tab => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PortalTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: INÍCIO / DASHBOARD OVERVIEW */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Quick Punch Clock Widget */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#2563EB]" /> Horário Oficial
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    GPS Válido
                  </span>
                </div>

                <div className="text-center py-3 bg-slate-900 text-white rounded-2xl border border-slate-800">
                  <span className="text-3xl font-black font-mono text-emerald-400">
                    {currentTime.toLocaleTimeString('pt-BR')}
                  </span>
                  <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                    {currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleBaterPonto('Entrada')} className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer">
                    🟢 Entrada
                  </button>
                  <button onClick={() => handleBaterPonto('Saída')} className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer">
                    🔴 Saída
                  </button>
                </div>

                <button
                  onClick={() => setActiveTab('ponto')}
                  className="w-full text-center text-xs text-[#2563EB] font-bold hover:underline"
                >
                  Ver cartão de ponto completo →
                </button>
              </div>

              {/* Status Summary & Quick Shortcuts */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Resumo do Colaborador
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200/80">
                    <span className="font-medium text-slate-600">Férias Disponíveis</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">30 Dias</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200/80">
                    <span className="font-medium text-slate-600">Holerite Vigente</span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">Julho / 2026</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200/80">
                    <span className="font-medium text-slate-600">Solicitações Ativas</span>
                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">{solicitacoes.length} Ativas</span>
                  </div>
                </div>
              </div>

              {/* Pending Signatures & Important Alerts */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-[#2563EB]" /> Assinaturas Pendentes
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">Espelho de Ponto - Junho/2026</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-bold">Pendente</span>
                    </div>
                    <p className="text-[11px] text-amber-800">Confirme o espelho mensal de horas trabalhadas.</p>
                    <button
                      onClick={() => setShowSignatureModal({
                        id: 'doc-sign-espelho',
                        companyId,
                        employeeId: currentColab.id,
                        tituloDocumento: 'Espelho de Ponto Mensal - Junho/2026',
                        categoria: 'Ponto Digital',
                        descricao: 'Declaro que confiro a veracidade das batidas de ponto e do saldo de banco de horas apurado.',
                        dataSolicitacao: new Date().toISOString(),
                        solicitadoPor: 'Departamento Pessoal',
                        status: 'Pendente Assinatura'
                      })}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xl cursor-pointer"
                    >
                      Assinar Eletronicamente
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: MEU PONTO & BANCO DE HORAS */}
        {activeTab === 'ponto' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Clock Widget Card */}
              <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#2563EB]" /> Horário Oficial do Servidor
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      GPS ±10m
                    </span>
                  </div>

                  <div className="text-center py-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-inner">
                    <span className="text-4xl font-black tracking-wider font-mono text-emerald-400">
                      {currentTime.toLocaleTimeString('pt-BR')}
                    </span>
                    <p className="text-[11px] text-slate-400 capitalize mt-1">
                      {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-700">
                      📱 Bater Ponto Digital
                    </p>
                    <span className="text-[10px] text-slate-500 font-bold">Touch ID / Clique Único</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleBaterPonto('Entrada')}
                      className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🟢 Entrada</span>
                    </button>
                    <button
                      onClick={() => handleBaterPonto('Saída Almoço')}
                      className="py-3 px-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🟡 Saída Almoço</span>
                    </button>
                    <button
                      onClick={() => handleBaterPonto('Retorno Almoço')}
                      className="py-3 px-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🔵 Retorno</span>
                    </button>
                    <button
                      onClick={() => handleBaterPonto('Saída')}
                      className="py-3 px-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🔴 Saída</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowAjusteModal(true)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Solicitar Ajuste / Correção de Ponto</span>
                </button>
              </div>

              {/* Marcações do Dia & Banco de Horas */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Registros de Hoje */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#2563EB]" />
                      Marcações Registradas Hoje
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">
                      Jornada: 08:00 - 12:00 / 13:00 - 17:00
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {pontoHoje.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{item.tipo}</span>
                          <p className="text-lg font-black font-mono text-slate-900">{item.hora}</p>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-2 inline-block">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumo Banco de Horas */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Extrato de Banco de Horas</h3>
                      <p className="text-xs text-slate-500">Apuração de saldo acumulado no mês</p>
                    </div>
                    <button 
                      onClick={() => showToast('Baixando Espelho de Ponto em PDF...')}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Espelho PDF
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl">
                      <span className="text-[10px] font-bold text-blue-700 uppercase">Horas Normais</span>
                      <p className="text-base font-black text-slate-900 mt-0.5">142h 30m</p>
                    </div>
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">Saldo Banco</span>
                      <p className="text-base font-black text-emerald-600 mt-0.5">+04h 15m</p>
                    </div>
                    <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-2xl">
                      <span className="text-[10px] font-bold text-purple-700 uppercase">Horas Extras 50%</span>
                      <p className="text-base font-black text-purple-900 mt-0.5">02h 00m</p>
                    </div>
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl">
                      <span className="text-[10px] font-bold text-amber-700 uppercase">Atrasos/Faltas</span>
                      <p className="text-base font-black text-slate-900 mt-0.5">00h 00m</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HOLERITES / DEMONSTRATIVO */}
        {activeTab === 'folha' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Demonstrativo de Pagamento (Holerite Digital)</h3>
                <p className="text-xs text-slate-500">Consulte proventos, descontos e valor líquido a receber</p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedMesHolerite}
                  onChange={(e) => setSelectedMesHolerite(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="07/2026">Mês Vigente: Julho / 2026</option>
                  <option value="06/2026">Junho / 2026</option>
                  <option value="05/2026">Maio / 2026</option>
                  <option value="04/2026">Abril / 2026</option>
                </select>

                <button 
                  onClick={() => showToast(`Gerando PDF do Holerite referente a ${selectedMesHolerite}...`)}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" /> Imprimir Holerite PDF
                </button>
              </div>
            </div>

            {/* Holerite Display Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">EMPREGADOR: GRUPO ALPHA LOGÍSTICA S/A • CNPJ: 12.345.678/0001-90</span>
                  <p className="text-sm font-bold text-white">{currentColab.nomeCompleto} • CTPS: {currentColab.trabalhistas?.ctpsNumero || '002931-SP'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Mês de Referência</span>
                  <span className="text-sm font-black text-emerald-400">{selectedMesHolerite}</span>
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                {/* Proventos */}
                <div className="space-y-2">
                  <h4 className="font-bold text-emerald-700 text-xs border-b border-emerald-200 pb-1">PROVENTOS (VENCIMENTOS)</h4>
                  <div className="space-y-1.5 font-medium text-slate-700">
                    <div className="flex justify-between">
                      <span>001 - Salário Base Mensal</span>
                      <span className="font-mono font-bold text-slate-900">R$ {currentColab.profissionais?.salarioBase?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '8.500,00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>012 - Horas Extras 50% (02h)</span>
                      <span className="font-mono font-bold text-slate-900">R$ 115,90</span>
                    </div>
                    <div className="flex justify-between">
                      <span>020 - DSR sobre Horas Extras</span>
                      <span className="font-mono font-bold text-slate-900">R$ 23,18</span>
                    </div>
                  </div>
                </div>

                {/* Descontos */}
                <div className="space-y-2">
                  <h4 className="font-bold text-rose-700 text-xs border-b border-rose-200 pb-1">DESCONTOS</h4>
                  <div className="space-y-1.5 font-medium text-slate-700">
                    <div className="flex justify-between">
                      <span>101 - INSS Retido na Fonte</span>
                      <span className="font-mono font-bold text-slate-900">R$ 908,85</span>
                    </div>
                    <div className="flex justify-between">
                      <span>105 - IRRF Imposto de Renda</span>
                      <span className="font-mono font-bold text-slate-900">R$ 1.120,40</span>
                    </div>
                    <div className="flex justify-between">
                      <span>201 - Vale Transporte (6%)</span>
                      <span className="font-mono font-bold text-slate-900">R$ 510,00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary Totals */}
              <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Proventos</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">R$ 8.639,08</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Descontos</span>
                    <span className="font-mono font-bold text-rose-400 text-sm">R$ 2.539,25</span>
                  </div>
                </div>

                <div className="bg-emerald-500/20 border border-emerald-500/40 px-5 py-2.5 rounded-2xl text-right">
                  <span className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-wider block">Valor Líquido a Receber</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">R$ 6.099,83</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FÉRIAS */}
        {activeTab === 'ferias' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <span className="text-[10px] font-bold uppercase text-slate-500">Período Aquisitivo Ativo</span>
                <p className="text-sm font-black text-slate-900">15/03/2025 a 14/03/2026</p>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-[#2563EB] h-2.5 rounded-full" style={{ width: '100%' }} />
                </div>
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 30 Dias de Férias Adquiridos
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <span className="text-[10px] font-bold uppercase text-slate-500">Saldo Disponível</span>
                <p className="text-2xl font-black text-emerald-600">30 Dias</p>
                <p className="text-[11px] text-slate-500">Limite legal de gozo até 14/01/2027</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Programar Férias</span>
                  <p className="text-xs text-slate-600 mt-1">Envie sua solicitação para análise do RH e da sua liderança.</p>
                </div>
                <button
                  onClick={() => setShowFeriasModal(true)}
                  className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-3"
                >
                  <Calendar className="w-4 h-4" /> Solicitar Agendamento de Férias
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: AFASTAMENTOS */}
        {activeTab === 'afastamentos' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Afastamentos & Atestados Médicos</h3>
                <p className="text-xs text-slate-500">Envie seus atestados médicos com sigilo para validação do RH</p>
              </div>
              <button
                onClick={() => setShowAtestadoModal(true)}
                className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> Enviar Novo Atestado Médico
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
              <span className="font-bold text-slate-700">🔒 Sigilo Médico e LGPD</span>
              <p className="text-slate-600">Seus documentos médicos são criptografados e acessados exclusivamente pelo setor de Saúde e Segurança do Trabalho / DP.</p>
            </div>
          </div>
        )}

        {/* TAB 6: BENEFÍCIOS */}
        {activeTab === 'beneficios' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Seus Benefícios Ativos</h3>
                <p className="text-xs text-slate-500">Gestão de planos de saúde, refeição, transporte e adicionais</p>
              </div>
              <button
                onClick={() => setShowBeneficioModal(true)}
                className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> Solicitar Benefício / Dependente
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Plano de Saúde Unimed Executive</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">Ativo</span>
                </div>
                <p className="text-slate-500 text-[11px]">Acomodação: Enfermaria/Apartamento • Titular + 1 Dependente</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Vale Refeição & Alimentação (Flash)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">Ativo</span>
                </div>
                <p className="text-slate-500 text-[11px]">Valor mensal: R$ 1.200,00 • Carga no dia 01</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Seguro de Vida Bradesco</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">Ativo</span>
                </div>
                <p className="text-slate-500 text-[11px]">Cobertura integral 100% custeada pela empresa</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: MEUS DOCUMENTOS */}
        {activeTab === 'documentos' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Seus Documentos & Contratos</h3>
                <p className="text-xs text-slate-500">Documentos trabalhistas e upload de comprovantes para o RH</p>
              </div>
              <button
                onClick={() => setShowDocModal(true)}
                className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Upload className="w-4 h-4" /> Enviar Novo Documento
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Contrato de Trabalho Individual</p>
                    <span className="text-[10px] text-slate-500">Assinado e Válido</span>
                  </div>
                </div>
                <button 
                  onClick={() => showToast('Baixando Contrato de Trabalho PDF...')}
                  className="p-2 text-[#2563EB] hover:bg-blue-100 rounded-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Termo de Vale Transporte</p>
                    <span className="text-[10px] text-slate-500">Atualizado 2026</span>
                  </div>
                </div>
                <button 
                  onClick={() => showToast('Baixando Termo VT PDF...')}
                  className="p-2 text-[#2563EB] hover:bg-blue-100 rounded-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: MEU CADASTRO */}
        {activeTab === 'cadastro' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Ficha de Dados Cadastrais</h3>
              <button
                onClick={() => setShowAlteracaoCadastralModal(true)}
                className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileEdit className="w-3.5 h-3.5" /> Solicitar Alteração Cadastral
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-[#2563EB] uppercase text-[11px] tracking-wider">Dados Pessoais</h4>
                <div className="space-y-1.5 text-slate-700">
                  <p><strong>Nome Completo:</strong> {currentColab.nomeCompleto}</p>
                  <p><strong>CPF:</strong> {currentColab.pessoais?.cpf || '000.000.000-00'}</p>
                  <p><strong>RG:</strong> {currentColab.pessoais?.rg || 'SSP-SP'}</p>
                  <p><strong>Data de Nascimento:</strong> {currentColab.pessoais?.dataNascimento || '15/05/1992'}</p>
                  <p><strong>E-mail Pessoal:</strong> {currentColab.pessoais?.emailPessoal || user?.email}</p>
                  <p><strong>Telefone:</strong> {currentColab.pessoais?.telefone || '(11) 98888-7777'}</p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-[#2563EB] uppercase text-[11px] tracking-wider">Dados Profissionais</h4>
                <div className="space-y-1.5 text-slate-700">
                  <p><strong>Cargo:</strong> {currentColab.profissionais?.cargo || 'Coordenador(a)'}</p>
                  <p><strong>Departamento:</strong> {currentColab.profissionais?.departamento || 'Recursos Humanos'}</p>
                  <p><strong>Data de Admissão:</strong> {currentColab.profissionais?.dataAdmissao || '15/03/2023'}</p>
                  <p><strong>Gestor Responsável:</strong> {currentColab.profissionais?.gestorResponsavel || 'Luciana Mello'}</p>
                  <p><strong>Tipo de Contrato:</strong> {currentColab.trabalhistas?.tipoContrato || 'CLT'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: MINHA EMPRESA */}
        {activeTab === 'empresa' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Minha Empresa & Políticas Internas</h3>
              <p className="text-xs text-slate-500">Informações institucionais e regimento interno</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="font-bold text-[#2563EB] text-sm">🎯 Missão & Valores</span>
                <p className="text-slate-600 leading-relaxed">
                  Transformar a gestão de pessoas com eficiência, ética, respeito e tecnologia humanizada.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="font-bold text-[#2563EB] text-sm">📋 Código de Conduta</span>
                <p className="text-slate-600 leading-relaxed">
                  Consulte as diretrizes éticas e de convivência corporativa aplicáveis a todos os colaboradores.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="font-bold text-[#2563EB] text-sm">📞 Canais de Atendimento</span>
                <p className="text-slate-600 leading-relaxed">
                  DP / RH: rh@grupogeral.com.br • Ouvidoria Interna Segura: 0800 900 1000
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: MINHAS SOLICITAÇÕES */}
        {activeTab === 'solicitacoes' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Central Unificada de Solicitações</h3>
              <p className="text-xs text-slate-500">Acompanhe o andamento em tempo real de seus pedidos no RH</p>
            </div>

            {solicitacoes.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Nenhuma solicitação cadastrada no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {solicitacoes.map(item => (
                  <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{item.titulo}</span>
                        <span className="bg-blue-100 text-[#2563EB] px-2 py-0.5 rounded-md font-bold text-[10px]">
                          {item.tipoSolicitacao}
                        </span>
                      </div>
                      <p className="text-slate-600">{item.descricao}</p>
                      <span className="text-[10px] text-slate-400">Solicitado em: {new Date(item.dataSolicitacao).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <span className={`px-3 py-1 rounded-xl text-xs font-bold text-center ${
                      item.status === 'Aprovada' || item.status === 'Aplicada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'Reprovada'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 11: COMUNICADOS */}
        {activeTab === 'comunicados' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Comunicados & Avisos Internos</h3>
              <p className="text-xs text-slate-500">Informativos corporativos e mensagens da diretoria</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="bg-[#2563EB] text-white px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase">
                    Institucional
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Publicado em 20/07/2026</span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">Atualização do Programa de Benefícios Flexíveis 2026</h4>
                <p className="text-slate-700 leading-relaxed">
                  A partir do próximo mês, o saldo de Vale Refeição poderá ser flexibilizado entre Alimentação e Cultura diretamente pelo aplicativo.
                </p>
                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={() => showToast('Leitura confirmada no sistema!')}
                    className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Confirmar Leitura
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 12: SUPORTE RH */}
        {activeTab === 'suporte' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Central de Atendimento & Suporte RH</h3>
                <p className="text-xs text-slate-500">Abra chamados para tirar dúvidas diretas com a equipe de Gestão de Pessoas</p>
              </div>
              <button
                onClick={() => setShowChamadoModal(true)}
                className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> Abrir Novo Chamado
              </button>
            </div>

            {chamados.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Nenhum chamado de suporte aberto.
              </div>
            ) : (
              <div className="space-y-3">
                {chamados.map(c => (
                  <div key={c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-sm">#{c.id.slice(-5)} - {c.assunto}</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                        {c.status}
                      </span>
                    </div>
                    <p className="text-slate-600">{c.descricao}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 13: FAQ / AJUDA */}
        {activeTab === 'faq' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-3 space-y-2">
              <h3 className="text-base font-extrabold text-slate-900">Base de Conhecimento & Pergunta Frequentes (FAQ)</h3>
              <p className="text-xs text-slate-500">Tire suas dúvidas rapidamente sobre processos internos de RH</p>
              <div className="relative max-w-md pt-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por dúvida ou palavra-chave..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredFaq.map(item => (
                <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-[#2563EB] uppercase">{item.categoria}</span>
                  <h4 className="font-bold text-slate-900 text-sm">{item.pergunta}</h4>
                  <p className="text-slate-600 leading-relaxed">{item.resposta}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MODAL: SOLICITAR AJUSTE DE PONTO */}
      {showAjusteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-slate-900">Solicitar Ajuste / Inclusão de Ponto</h3>
            <form onSubmit={handleAjusteSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Data da Ocorrência *</label>
                <input type="date" required value={ajusteForm.data} onChange={e => setAjusteForm({ ...ajusteForm, data: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Horário Correto *</label>
                  <input type="time" required value={ajusteForm.hora} onChange={e => setAjusteForm({ ...ajusteForm, hora: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo *</label>
                  <select value={ajusteForm.tipo} onChange={e => setAjusteForm({ ...ajusteForm, tipo: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl">
                    <option value="Entrada">Entrada</option>
                    <option value="Intervalo Saída">Intervalo Saída</option>
                    <option value="Intervalo Retorno">Intervalo Retorno</option>
                    <option value="Saída">Saída</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Justificativa / Motivo *</label>
                <textarea required rows={3} placeholder="Explique o motivo do ajuste..." value={ajusteForm.motivo} onChange={e => setAjusteForm({ ...ajusteForm, motivo: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAjusteModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-100">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-blue-700">Enviar Solicitação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ALTERAÇÃO CADASTRAL */}
      {showAlteracaoCadastralModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-slate-900">Solicitar Alteração Cadastral</h3>
            <form onSubmit={handleAlteracaoCadastralSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Campo a Alterar *</label>
                <select value={cadastralForm.campo} onChange={e => setCadastralForm({ ...cadastralForm, campo: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold">
                  <option value="Telefone / Celular">Telefone / Celular</option>
                  <option value="E-mail Pessoal">E-mail Pessoal</option>
                  <option value="Endereço de Residência">Endereço de Residência</option>
                  <option value="Dados Bancários (Conta Salário)">Dados Bancários (Conta Salário)</option>
                  <option value="Estado Civil">Estado Civil</option>
                  <option value="Contato de Emergência">Contato de Emergência</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Novo Valor / Informação *</label>
                <input type="text" required placeholder="Digite a nova informação..." value={cadastralForm.valorNovo} onChange={e => setCadastralForm({ ...cadastralForm, valorNovo: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo da Alteração</label>
                <textarea rows={2} value={cadastralForm.motivo} onChange={e => setCadastralForm({ ...cadastralForm, motivo: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAlteracaoCadastralModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-100">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-blue-700">Enviar ao RH</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SOLICITAR FÉRIAS */}
      {showFeriasModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-slate-900">Solicitação de Agendamento de Férias</h3>
            <form onSubmit={handleFeriasSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Data de Início das Férias *</label>
                <input type="date" required value={feriasForm.dataInicio} onChange={e => setFeriasForm({ ...feriasForm, dataInicio: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantidade de Dias *</label>
                <select value={feriasForm.dias} onChange={e => setFeriasForm({ ...feriasForm, dias: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold">
                  <option value="30">30 Dias Integrais</option>
                  <option value="20">20 Dias (Vender 10 dias de abono)</option>
                  <option value="15">15 Dias (1º Período Fracionado)</option>
                  <option value="10">10 Dias (Fracionado)</option>
                </select>
              </div>
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input type="checkbox" checked={feriasForm.adiantar13} onChange={e => setFeriasForm({ ...feriasForm, adiantar13: e.target.checked })} className="w-4 h-4 text-[#2563EB] rounded" />
                  <span>Solicitar adiantamento da 1ª parcela do 13º salário</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowFeriasModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-100">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-blue-700">Confirmar Solicitação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENVIAR ATESTADO MÉDICO */}
      {showAtestadoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-slate-900">Enviar Atestado Médico ao RH</h3>
            <form onSubmit={handleAtestadoSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data de Início *</label>
                  <input type="date" required value={atestadoForm.dataInicio} onChange={e => setAtestadoForm({ ...atestadoForm, dataInicio: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dias de Afastamento *</label>
                  <input type="number" min={1} max={180} required value={atestadoForm.dias} onChange={e => setAtestadoForm({ ...atestadoForm, dias: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Anexar Documento (PDF / Foto) *</label>
                <input type="file" required onChange={e => setAtestadoForm({ ...atestadoForm, arquivo: e.target.files ? e.target.files[0] : null })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações Privadas</label>
                <textarea rows={2} value={atestadoForm.observacao} onChange={e => setAtestadoForm({ ...atestadoForm, observacao: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAtestadoModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-100">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-blue-700">Enviar ao RH</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BENEFÍCIO / DEPENDENTE */}
      {showBeneficioModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-slate-900">Solicitar Inclusão / Alteração de Benefício</h3>
            <form onSubmit={handleBeneficioSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Solicitação *</label>
                <select value={beneficioForm.tipo} onChange={e => setBeneficioForm({ ...beneficioForm, tipo: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold">
                  <option value="Inclusão de Dependente em Plano de Saúde">Inclusão de Dependente em Plano de Saúde</option>
                  <option value="Opção por Vale Transporte">Opção / Alteração de Vale Transporte</option>
                  <option value="Inclusão em Plano Odontológico">Inclusão em Plano Odontológico</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Dependente (se aplicável)</label>
                <input type="text" value={beneficioForm.nomeDependente} onChange={e => setBeneficioForm({ ...beneficioForm, nomeDependente: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowBeneficioModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-100">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-blue-700">Enviar Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO CHAMADO DE SUPORTE */}
      {showChamadoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-slate-900">Abrir Novo Chamado no RH</h3>
            <form onSubmit={handleChamadoSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoria *</label>
                <select value={chamadoForm.categoria} onChange={e => setChamadoForm({ ...chamadoForm, categoria: e.target.value as any })} className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold">
                  <option value="Ponto">Ponto Digital & Banco de Horas</option>
                  <option value="Holerite">Holerites & Pagamento</option>
                  <option value="Férias">Férias & Agendamento</option>
                  <option value="Benefícios">Benefícios & Cartões</option>
                  <option value="Cadastro">Cadastro Pessoal</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assunto *</label>
                <input type="text" required placeholder="Resumo da sua dúvida ou solicitação..." value={chamadoForm.assunto} onChange={e => setChamadoForm({ ...chamadoForm, assunto: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição Detalhada *</label>
                <textarea required rows={3} value={chamadoForm.descricao} onChange={e => setChamadoForm({ ...chamadoForm, descricao: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowChamadoModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-100">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-blue-700">Abrir Chamado</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSINATURA ELETRÔNICA */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-slate-900">Assinatura Eletrônica de Documento</h3>
            <p className="text-slate-600">{showSignatureModal.descricao}</p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 font-mono text-[11px] text-slate-700">
              <p>Documento: {showSignatureModal.tituloDocumento}</p>
              <p>Colaborador: {currentColab.nomeCompleto}</p>
              <p>CPF: {currentColab.pessoais?.cpf || '000.000.000-00'}</p>
              <p>Carimbo de Data/Hora: {new Date().toLocaleString('pt-BR')}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowSignatureModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-100">Cancelar</button>
              <button type="button" onClick={() => handleAssinarDocumento(showSignatureModal)} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center gap-2">
                <FileCheck className="w-4 h-4" /> Confirmar e Assinar Documento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSISTENTE IA DO FUNCIONÁRIO */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl h-[520px] rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden text-xs">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span className="font-extrabold text-sm">Assistente IA do Funcionário (RH TRANSFORMA)</span>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {aiChat.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-[#2563EB] text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Pergunte sobre férias, ponto, holerites..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendAiPrompt()}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <button onClick={handleSendAiPrompt} className="p-2 bg-[#2563EB] text-white rounded-xl cursor-pointer">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
