import { Job, Candidate, Interview, Department, Recruiter, Stage } from '../types/rh';

export const fontStages: Stage[] = [
  { id: 'inscritos', name: 'Inscritos', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { id: 'triagem', name: 'Triagem', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'entrevista_rh', name: 'Entrevista RH', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'teste_tecnico', name: 'Teste Técnico', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'entrevista_gestor', name: 'Entrevista Gestor', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'proposta', name: 'Proposta', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'contratado', name: 'Contratado', color: 'bg-teal-50 text-teal-800 border-teal-200' },
];

export const INITIAL_JOBS: Job[] = [];

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'cand-101',
    name: 'Ana Paula Mendes',
    email: 'ana.mendes@email.com',
    phone: '(11) 98765-4321',
    role: 'Especialista em Logística e Supply Chain',
    location: 'São Paulo - SP',
    experienceYears: 6,
    skills: ['Logística', 'Gestão de Estoque', 'SAP WMS', 'Supply Chain', 'Excel Avançado', 'Roteirização'],
    status: 'Em Processo',
    rating: 5,
    notes: 'Excelente vivência em otimização de frotas, armazenagem e processos logísticos end-to-end.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    appliedDate: '2026-07-28',
    source: 'LinkedIn',
    salaryExpectation: 'R$ 8.500',
    currentJobId: 'vaga-1',
    currentStageId: 'triagem'
  },
  {
    id: 'cand-102',
    name: 'Carlos Eduardo Silva',
    email: 'carlos.silva@tech.com.br',
    phone: '(11) 97123-8899',
    role: 'Analista Operacional de Logística',
    location: 'Guarulhos - SP',
    experienceYears: 4,
    skills: ['TMS', 'Roteirização', 'Indicadores KPIs', 'Gestão de Entregas', 'Power BI', 'Fretes'],
    status: 'Em Processo',
    rating: 4,
    notes: 'Sólida experiência com roteirização de entregas, acompanhamento de frota e gestão de transportadoras.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    appliedDate: '2026-07-29',
    source: 'Indicação',
    salaryExpectation: 'R$ 6.200',
    currentJobId: 'vaga-1',
    currentStageId: 'inscritos'
  },
  {
    id: 'cand-103',
    name: 'Lucas Oliveira Santos',
    email: 'lucas.oliveira@email.com',
    phone: '(19) 99888-7766',
    role: 'Coordenador de Operações e Logística',
    location: 'Campinas - SP',
    experienceYears: 7,
    skills: ['Supply Chain', 'Gestão de Equipes Logísticas', 'Lean Logistics', 'ERP Totvs', 'Armazenagem'],
    status: 'Em Processo',
    rating: 5,
    notes: 'Profissional completo com habilidade comprovada em liderança de equipes e redução de custos operacionais.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    appliedDate: '2026-07-30',
    source: 'Site Institucional',
    salaryExpectation: 'R$ 10.000',
    currentJobId: 'vaga-1',
    currentStageId: 'entrevista_rh'
  }
];

export const INITIAL_INTERVIEWS: Interview[] = [];

export const INITIAL_DEPARTMENTS: Department[] = [];

export const INITIAL_RECRUITERS: Recruiter[] = [];
