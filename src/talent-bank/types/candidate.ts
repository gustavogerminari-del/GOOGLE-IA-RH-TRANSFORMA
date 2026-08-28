/**
 * Módulo BANCO DE TALENTOS - Contratos e Tipos de Dados
 * Depende exclusivamente do Módulo NÚCLEO, COMPARTILHADO, AUTENTICAÇÃO e GESTÃO DE VAGAS.
 */

export type CandidateClassification = 'Recomendado' | 'Alto Potencial' | 'Pendente' | 'Arquivado';
export type CandidateStatus = 'Ativo' | 'Em Processo' | 'Contratado' | 'Banco de Reserva' | 'Desqualificado';
export type AvailabilityType = 'Imediata' | '15 dias' | '30 dias' | 'A combinar';

export interface WorkExperience {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface EducationInfo {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  completionYear: string;
}

export interface CandidateDocument {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  fileSize: string;
  downloadUrl: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  departmentArea: string;
  location: string;
  avatar: string;
  experienceYears: number;
  salaryExpectation: string;
  availability: AvailabilityType;
  status: CandidateStatus;
  classification: CandidateClassification;
  skills: string[];
  workHistory?: WorkExperience[];
  educationHistory?: EducationInfo[];
  documents?: CandidateDocument[];
  currentJobId?: string;
  notes: string;
  source: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CandidateFilterParams {
  searchTerm: string;
  departmentArea: string;
  classification: string;
  status: string;
  skill: string;
  availability: string;
  includeArchived: boolean;
}
