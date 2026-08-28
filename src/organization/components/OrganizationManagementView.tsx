import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  Plus,
  Layers,
  PieChart,
  Lock,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Department, CompanyProfile } from '../types/department';
import { CompanyProfileHeader } from './CompanyProfileHeader';
import { DepartmentCard } from './DepartmentCard';
import { DepartmentFormModal } from './DepartmentFormModal';
import { CompanyEditModal } from './CompanyEditModal';
import { useAuth } from '../../auth';
import { Button, Card, SearchBar } from '../../shared';
import { logger } from '../../core';

export interface OrganizationManagementViewProps {
  initialCompany?: CompanyProfile;
  initialDepartments?: Department[];
  openJobsCountTotal?: number;
}

export const OrganizationManagementView: React.FC<OrganizationManagementViewProps> = ({
  initialCompany,
  initialDepartments,
  openJobsCountTotal,
}) => {
  const { user, hasActionAccess } = useAuth();

  // Permission check: Admin or HR Manager/Gestor role can manage organizational structure and budget
  const canManageStructure =
    user?.role === 'Administrador' ||
    user?.role === 'Gestor de Seleção' ||
    hasActionAccess('edit_budget') ||
    hasActionAccess('edit_settings');

  const [company, setCompany] = useState<CompanyProfile>(
    initialCompany || {
      id: user?.empresaId || 'emp-default',
      name: 'Sua Empresa',
      tradingName: 'Sua Empresa',
      cnpj: '00.000.000/0001-00',
      isVerified: false,
      address: { street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '' },
      contact: { email: user?.email || '', phone: '', website: '' },
      industryCategory: 'Não informado'
    }
  );

  const [departments, setDepartments] = useState<Department[]>(
    initialDepartments || []
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // Dynamic calculations across all departments
  const totalCompanyEmployees = useMemo(() => {
    return departments.reduce((acc, d) => acc + (d.employeeCount || 0), 0);
  }, [departments]);

  const totalCompanyBudgetLimit = useMemo(() => {
    return departments.reduce((acc, d) => acc + (d.monthlyBudgetLimit || 0), 0);
  }, [departments]);

  const totalCompanyBudgetSpent = useMemo(() => {
    return departments.reduce((acc, d) => acc + (d.monthlyBudgetSpent || 0), 0);
  }, [departments]);

  const totalOpenJobs = useMemo(() => {
    if (typeof openJobsCountTotal === 'number') return openJobsCountTotal;
    return departments.reduce((acc, d) => acc + (d.openJobsCount || 0), 0);
  }, [departments, openJobsCountTotal]);

  const totalSectorsCount = useMemo(() => {
    return departments.reduce((acc, d) => acc + (d.sectors?.length || 0), 0);
  }, [departments]);

  // Filtered Departments
  const filteredDepartments = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return departments;
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.code.toLowerCase().includes(term) ||
        d.manager.name.toLowerCase().includes(term) ||
        d.sectors.some((s) => s.name.toLowerCase().includes(term))
    );
  }, [departments, searchTerm]);

  const handleSaveDepartment = (
    deptData: Omit<Department, 'id'>,
    existingId?: string
  ) => {
    if (existingId) {
      setDepartments((prev) =>
        prev.map((d) => (d.id === existingId ? { ...d, ...deptData } : d))
      );
      logger.info(`Departamento atualizado: ${existingId}`, 'Organization');
    } else {
      const newDept: Department = {
        ...deptData,
        id: `dept-${Date.now()}`,
      };
      setDepartments((prev) => [...prev, newDept]);
      logger.info(`Novo departamento criado: ${newDept.name}`, 'Organization');
    }
  };

  const handleDeleteDepartment = (departmentId: string) => {
    if (!canManageStructure) {
      alert('Acesso Negado: Apenas Administradores do RH podem remover estruturas organizacionais.');
      return;
    }
    if (confirm('Tem certeza de que deseja remover este departamento da estrutura?')) {
      setDepartments((prev) => prev.filter((d) => d.id !== departmentId));
      logger.info(`Departamento removido: ${departmentId}`, 'Organization');
    }
  };

  const handleSaveCompany = (updatedCompany: CompanyProfile) => {
    setCompany(updatedCompany);
    logger.info(`Dados da empresa atualizados: ${updatedCompany.name}`, 'Organization');
  };

  const handleOpenCreateDept = () => {
    if (!canManageStructure) {
      alert('Acesso Restrito: Apenas Administradores e Líderes de RH podem alterar a estrutura e orçamento.');
      return;
    }
    setEditingDept(null);
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: Department) => {
    if (!canManageStructure) {
      alert('Acesso Restrito: Apenas Administradores e Líderes de RH podem alterar a estrutura e orçamento.');
      return;
    }
    setEditingDept(dept);
    setIsDeptModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Company Profile Header */}
      <CompanyProfileHeader
        company={company}
        totalCompanyEmployees={totalCompanyEmployees}
        totalOpenJobs={totalOpenJobs}
        onEditCompany={() => setIsCompanyModalOpen(true)}
        canEditCompany={canManageStructure}
      />

      {/* Top Organization Macro Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Colaboradores</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-slate-900">{totalCompanyEmployees}</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Departamentos & Setores</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-slate-900">
              {departments.length} <span className="text-xs font-semibold text-slate-400">({totalSectorsCount} setores)</span>
            </span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Orçamento Limite Global</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-emerald-700">
              R$ {(totalCompanyBudgetLimit / 1000).toFixed(0)}k <span className="text-[10px] font-normal text-slate-400">/mês</span>
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Executado no Mês</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-indigo-900">
              R$ {(totalCompanyBudgetSpent / 1000).toFixed(0)}k
            </span>
            <PieChart className="w-4 h-4 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Controls & Search Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            placeholder="Buscar por departamento, código sigla, setor ou responsável..."
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canManageStructure ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateDept}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Novo Departamento
            </Button>
          ) : (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" /> Somente Leitura (Consulte Admin)
            </div>
          )}
        </div>
      </div>

      {/* Departments Grid */}
      {filteredDepartments.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800">
            Nenhum departamento encontrado
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Refine a busca por nome ou sigla do departamento.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
            Limpar Busca
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              onEditDepartment={handleOpenEditDept}
              onDeleteDepartment={handleDeleteDepartment}
              canManageStructure={canManageStructure}
            />
          ))}
        </div>
      )}

      {/* Department Form Modal */}
      <DepartmentFormModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        onSaveDepartment={handleSaveDepartment}
        initialDepartment={editingDept}
      />

      {/* Company Edit Modal */}
      <CompanyEditModal
        company={company}
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSaveCompany={handleSaveCompany}
      />
    </div>
  );
};
