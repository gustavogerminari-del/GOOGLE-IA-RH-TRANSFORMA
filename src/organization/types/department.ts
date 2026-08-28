/**
 * MÓDULO ESTRUTURA ORGANIZACIONAL - Tipos e Interfaces
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 */

export interface Sector {
  id: string;
  name: string;
  code?: string;
  activeEmployeeCount: number;
}

export interface DepartmentManager {
  name: string;
  role: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface Department {
  id: string;
  code: string; // Ex: "ENG", "RH", "FIN"
  name: string;
  manager: DepartmentManager;
  employeeCount: number; // Colaboradores ativos no departamento
  monthlyBudgetLimit: number; // Orçamento Limite Mensal em Reais
  monthlyBudgetSpent: number; // Orçamento Executado/Gasto em Reais
  openJobsCount: number; // Vagas abertas vinculadas
  sectors: Sector[];
  description?: string;
  costCenter?: string; // Centro de Custo (Ex: "CC-102")
  updatedAt?: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  tradingName: string; // Nome Fantasia
  cnpj: string;
  isVerified: boolean; // Selo de Verificação RH TRANSFORMA
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contact: {
    email: string;
    phone: string;
    website: string;
  };
  industryCategory: string; // Setor / Ramo de Atuação
  foundedYear?: number;
}

export interface DepartmentFilterParams {
  searchTerm?: string;
  sortBy?: 'name' | 'employees' | 'budget';
}
