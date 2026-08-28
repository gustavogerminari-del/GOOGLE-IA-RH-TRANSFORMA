/**
 * Módulo BANCO DE TALENTOS - Constantes e Opções
 */

import { CandidateClassification, CandidateStatus, AvailabilityType } from '../types/candidate';

export const CANDIDATE_CLASSIFICATION_OPTIONS: CandidateClassification[] = [
  'Recomendado',
  'Alto Potencial',
  'Pendente',
  'Arquivado',
];

export const CANDIDATE_STATUS_OPTIONS: CandidateStatus[] = [
  'Ativo',
  'Em Processo',
  'Contratado',
  'Banco de Reserva',
  'Desqualificado',
];

export const AVAILABILITY_OPTIONS: AvailabilityType[] = [
  'Imediata',
  '15 dias',
  '30 dias',
  'A combinar',
];

export const DEPARTMENT_AREAS = [
  'Tecnologia & Engenharia',
  'Produtos & UX Design',
  'Vendas & Expansão Comercial',
  'Operações & Atendimento',
  'Gente & Gestão (RH)',
  'Financeiro & Controladoria',
  'Marketing & Growth',
];

export const COMMON_SKILLS = [
  'React.js',
  'Node.js',
  'TypeScript',
  'Tailwind CSS',
  'Product Management',
  'Figma',
  'SQL',
  'Scrum / Agile',
  'Vendas B2B',
  'Inside Sales',
  'Customer Success',
  'Gestão de Pessoas',
  'Power BI',
  'Marketing Digital',
  'Google Ads',
];
