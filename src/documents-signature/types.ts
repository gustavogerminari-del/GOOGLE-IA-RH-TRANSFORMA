/**
 * MÓDULO ASSINATURA E GESTÃO DE DOCUMENTOS - Tipos TypeScript
 * RH TRANSFORMA - Sistema de Gestão de Pessoas (Prompt 06 100%)
 */

export type DocumentCategory = 
  | 'Contrato de Trabalho' 
  | 'Termo de Admissão' 
  | 'NDA / Sigilo' 
  | 'Declaração de Benefícios' 
  | 'Atestado / Laudo' 
  | 'Regulamento Interno'
  | 'Aditivo Contratual'
  | 'Documento Pessoal (RG/CPF/CNH)'
  | 'Termo de Equipamentos'
  | 'Outros';

export type SignatureStatus = 
  | 'Pendente de Assinatura' 
  | 'Assinado Digitalmente' 
  | 'Recusado' 
  | 'Em Análise';

export type ValidityStatus = 'Válido' | 'A Vencer' | 'Vencido' | 'Sem Validade';

export type ContractType = 'CLT' | 'PJ' | 'Estágio' | 'Trainee' | 'Temporário' | 'Aditivo';

export type ContractStatus = 'Ativo' | 'Renovado' | 'Encerrado' | 'Aditivado' | 'Pendente';

export interface Signer {
  id?: string;
  name: string;
  email: string;
  cpf?: string;
  role: 'Colaborador' | 'Gestor' | 'Testemunha' | 'Representante Legal RH';
  hasSigned: boolean;
  signedAt?: string;
  ipAddress?: string;
  sha256Hash?: string;
  signaturePadImage?: string;
}

export interface DocumentVersionHistory {
  version: number;
  updatedAt: string;
  updatedBy: string;
  changeDescription: string;
  fileName: string;
  fileUrl?: string;
}

export interface DocumentAuditLog {
  id: string;
  action: 'Criação' | 'Visualização' | 'Assinatura' | 'Download' | 'Atualização' | 'Exclusão' | 'Envio Lembrete';
  performedBy: string;
  userEmail: string;
  ipAddress: string;
  timestamp: string;
  details: string;
}

export interface ContractDetails {
  contractType: ContractType;
  salaryBase?: number;
  startDate?: string;
  endDate?: string;
  status: ContractStatus;
  renewalCount?: number;
  clauses?: string[];
  addendumsCount?: number;
}

export interface HRDocument {
  id: string;
  companyId: string;
  colaboradorId?: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  category: DocumentCategory;
  linkedEntityName: string; // Ex: Nome do Colaborador, Candidato ou Vaga
  linkedType: 'Colaborador' | 'Candidato' | 'Vaga' | 'Empresa';
  uploadedAt: string;
  expirationDate?: string; // AAA-MM-DD
  validityStatus?: ValidityStatus;
  signatureStatus: SignatureStatus;
  signers: Signer[];
  accessPermissions: {
    canView: boolean;
    canSign: boolean;
    canDownload: boolean;
    canDelete: boolean;
  };
  content?: string; // Rendered text or HTML for document preview/signature
  version: number;
  history?: DocumentVersionHistory[];
  auditTrail?: DocumentAuditLog[];
  contractDetails?: ContractDetails;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentTemplate {
  id: string;
  companyId: string;
  title: string;
  category: DocumentCategory;
  description: string;
  templateText: string; // Text with placeholders like {{nomeColaborador}}, {{cpf}}, {{cargo}}, {{salario}}, {{dataAdmissao}}, {{empresaNome}}, {{cnpj}}, {{dataAtual}}
  requiredSignerRoles: ('Colaborador' | 'Gestor' | 'Testemunha' | 'Representante Legal RH')[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentCategoryConfig {
  id: string;
  companyId: string;
  name: DocumentCategory;
  description: string;
  requiresExpiration: boolean;
  defaultExpirationDays?: number;
  active: boolean;
}
