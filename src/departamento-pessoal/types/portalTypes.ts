export type TipoSolicitacaoPortal = 
  | 'Alteração Cadastral'
  | 'Férias'
  | 'Inclusão de Benefício'
  | 'Ajuste de Ponto'
  | 'Atestado Médico / Licença'
  | 'Compensação Banco de Horas'
  | 'Pedido de Demissão'
  | 'Reembolso / Despesa'
  | 'Suporte Interno';

export type StatusSolicitacaoPortal = 
  | 'Rascunho'
  | 'Enviada'
  | 'Em análise'
  | 'Aguardando documento'
  | 'Aprovada'
  | 'Reprovada'
  | 'Aplicada'
  | 'Cancelada';

export interface SolicitacaoPortalItem {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  tipoSolicitacao: TipoSolicitacaoPortal;
  titulo: string;
  descricao: string;
  detalhes?: Record<string, any>;
  anexoNome?: string;
  anexoUrl?: string;
  status: StatusSolicitacaoPortal;
  dataSolicitacao: string;
  dataAnalise?: string;
  analisadoPor?: string;
  parecerRh?: string;
  historicoTimeline: {
    data: string;
    titulo: string;
    descricao: string;
    autor: string;
    tipo: 'sistema' | 'colaborador' | 'rh';
  }[];
}

export interface ChamadoSuporteItem {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  categoria: 'Acesso' | 'Cadastro' | 'Ponto' | 'Férias' | 'Holerite' | 'Benefícios' | 'Afastamentos' | 'Rescisão' | 'Outro';
  assunto: string;
  descricao: string;
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  status: 'Aberto' | 'Em atendimento' | 'Aguardando Colaborador' | 'Resolvido' | 'Fechado';
  criadoEm: string;
  atualizadoEm: string;
  mensagens: {
    id: string;
    autor: string;
    papeisAutor: 'colaborador' | 'rh' | 'suporte';
    texto: string;
    dataHora: string;
    anexoNome?: string;
  }[];
}

export interface ComunicadoItem {
  id: string;
  companyId: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  categoria: 'Institucional' | 'Benefícios' | 'Eventos' | 'Segurança' | 'Políticas' | 'Geral';
  dataPublicacao: string;
  dataExpiracao?: string;
  exigeConfirmacaoLeitura: boolean;
  lido: boolean;
  dataLeitura?: string;
  autor: string;
  prioridade: 'Normal' | 'Importante' | 'Urgente';
  imagemUrl?: string;
  anexoNome?: string;
}

export interface ArtigoFaqItem {
  id: string;
  categoria: 'Primeiro Acesso' | 'Ponto Digital' | 'Holerites' | 'Férias' | 'Benefícios' | 'Documentos';
  pergunta: string;
  resposta: string;
  tags: string[];
}

export interface DocumentoAssinaturaItem {
  id: string;
  companyId: string;
  employeeId: string;
  tituloDocumento: string;
  categoria: string;
  descricao: string;
  dataSolicitacao: string;
  prazoLimite?: string;
  solicitadoPor: string;
  status: 'Pendente Assinatura' | 'Assinado' | 'Recusado';
  dataAssinatura?: string;
  hashAssinatura?: string;
  ipAssinatura?: string;
  motivoRecusa?: string;
}
