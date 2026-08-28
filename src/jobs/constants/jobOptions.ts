/**
 * Módulo GESTÃO DE VAGAS - Opções e Constantes Corporativas
 */

import { JobStatus, JobType, JobLocationType } from '../types/job';

export const JOB_STATUS_OPTIONS: JobStatus[] = [
  'Aberta',
  'Pausada',
  'Fechada',
  'Arquivada',
  'Rascunho',
];

export const JOB_TYPE_OPTIONS: JobType[] = [
  'CLT',
  'PJ',
  'Estágio',
  'Temporário',
];

export const JOB_LOCATION_OPTIONS: JobLocationType[] = [
  'Presencial',
  'Remoto',
  'Híbrido',
];

export const CORPORATE_DEPARTMENTS = [
  'Tecnologia & Engenharia',
  'Produtos & UX Design',
  'Vendas & Expansão Comercial',
  'Operações & Atendimento',
  'Gente & Gestão (RH)',
  'Financeiro & Controladoria',
  'Marketing & Growth',
];

export const CORPORATE_RECRUITERS = [
  { id: 'usr-admin-01', name: 'Luciana Mello', role: 'Administradora RH' },
  { id: 'usr-gestor-02', name: 'Carlos Eduardo Silva', role: 'Gestor de Seleção' },
  { id: 'usr-recrutador-03', name: 'Mariana Costa', role: 'Recrutador Sênior' },
  { id: 'usr-analista-04', name: 'Roberto Andrade', role: 'Analista de RH' },
];
