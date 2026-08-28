/**
 * MÓDULO EQUIPE INTERNA - Modal de Cadastro de Colaboradores e Funcionários
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Lock, 
  ShieldCheck, 
  Calendar,
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';
import { Department } from '../../organization';
import { RoleProfile, useAuth } from '../../auth';
import { PermissionService } from '../../services/PermissionService';
import { 
  InternalTeamMember, 
  TeamMemberRoleType, 
  TeamMemberSeniority, 
  InternalPermissions 
} from '../types/team';
import { 
  TEAM_ROLE_TYPES, 
  TEAM_SENIORITIES, 
  DEFAULT_PERMISSIONS_BY_PROFILE 
} from '../constants/teamOptions';

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (memberData: Omit<InternalTeamMember, 'id' | 'processControl' | 'metrics' | 'updatedAt'>) => void;
  editingMember?: InternalTeamMember | null;
  departments: Department[];
  isAdmin: boolean;
}

export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingMember,
  departments,
  isAdmin,
}) => {
  const { activeModules } = useAuth();
  // Tab state: 'dados' | 'acesso'
  const [activeTab, setActiveTab] = useState<'dados' | 'acesso'>('dados');

  // Form Fields - Dados Cadastrais
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [salary, setSalary] = useState<string>('');
  const [status, setStatus] = useState<string>('Ativo');
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [directCoordinator, setDirectCoordinator] = useState('');
  const [dependentsCount, setDependentsCount] = useState<number>(0);
  const [hasVT, setHasVT] = useState<boolean>(false);

  // Form Fields - Acesso ao Sistema & Permissões
  const [enableSystemAccess, setEnableSystemAccess] = useState<boolean>(true);
  const [roleProfile, setRoleProfile] = useState<RoleProfile>('Recrutador Sênior');
  const [roleType, setRoleType] = useState<TeamMemberRoleType>('Recrutador');
  const [seniority, setSeniority] = useState<TeamMemberSeniority>('Sênior');
  const [avatar, setAvatar] = useState('');
  const [notes, setNotes] = useState('');
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  // Permissões
  const [permissions, setPermissions] = useState<InternalPermissions>(
    DEFAULT_PERMISSIONS_BY_PROFILE['Recrutador Sênior']
  );

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name || '');
      setEmail(editingMember.email || '');
      setPhone(editingMember.phone || '');
      setRoleProfile(editingMember.roleProfile || 'Recrutador Sênior');
      setRoleType(editingMember.roleType || 'Recrutador');
      setJobTitle(editingMember.jobTitle || '');
      setSeniority(editingMember.seniority || 'Sênior');
      setDepartmentId(editingMember.departmentId || '');
      setAvatar(editingMember.avatar || '');
      setHireDate(editingMember.hireDate || new Date().toISOString().split('T')[0]);
      setStatus(editingMember.status || 'Ativo');
      setNotes(editingMember.notes || '');
      setPermissions(editingMember.permissions || DEFAULT_PERMISSIONS_BY_PROFILE['Recrutador Sênior']);
      setSalary(editingMember.salary ? String(editingMember.salary) : '');
      setDirectCoordinator(editingMember.directCoordinator || '');
      setDependentsCount(editingMember.dependentsCount || 0);
      setHasVT(editingMember.hasVT || false);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setRoleProfile('Recrutador Sênior');
      setRoleType('Recrutador');
      setJobTitle('');
      setSeniority('Sênior');
      setDepartmentId(departments[0]?.id || 'dept-1');
      setAvatar('');
      setHireDate(new Date().toISOString().split('T')[0]);
      setStatus('Ativo');
      setNotes('');
      setSalary('');
      setDirectCoordinator('');
      setDependentsCount(0);
      setHasVT(false);
      setPermissions(DEFAULT_PERMISSIONS_BY_PROFILE['Recrutador Sênior']);
    }
    setActiveTab('dados');
    setSecurityWarning(null);
  }, [editingMember, isOpen, departments]);

  if (!isOpen) return null;

  const handleRoleProfileChange = (newProfile: RoleProfile) => {
    setRoleProfile(newProfile);
    setPermissions(DEFAULT_PERMISSIONS_BY_PROFILE[newProfile] || DEFAULT_PERMISSIONS_BY_PROFILE['Analista de RH']);
  };

  const handleResetPermissions = () => {
    setPermissions(DEFAULT_PERMISSIONS_BY_PROFILE[roleProfile]);
  };

  const togglePermission = (key: keyof InternalPermissions) => {
    if (!isAdmin) {
      setSecurityWarning('Apenas Administradores podem alterar a matriz de permissões de acesso.');
      return;
    }
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setSecurityWarning('Apenas Administradores têm permissão para criar ou alterar cadastros de colaboradores.');
      return;
    }

    if (!name.trim() || !email.trim()) {
      alert('Por favor, preencha o Nome Completo e o E-mail Corporativo.');
      return;
    }

    const selectedDept = departments.find(d => d.id === departmentId);
    const departmentName = selectedDept ? selectedDept.name : 'Recursos Humanos';

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '(11) 98765-4321',
      roleProfile,
      roleType,
      jobTitle: jobTitle.trim() || 'Colaborador',
      seniority,
      departmentId: departmentId || 'dept-1',
      departmentName,
      specialty: 'Geral',
      avatar: avatar.trim(),
      status: (status as any) || 'Ativo',
      hireDate,
      permissions,
      notes: notes.trim(),
      salary: salary ? Number(salary) : undefined,
      directCoordinator: directCoordinator || undefined,
      dependentsCount: Number(dependentsCount) || 0,
      hasVT,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* GREEN HEADER BANNER */}
        <div className="bg-[#00875a] p-6 text-white flex items-center justify-between relative">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {editingMember ? 'Editar Colaborador' : 'Adicionar Novo Colaborador'}
            </h2>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100 mt-0.5">
              CADASTRE NO QUADRO DE FUNCIONÁRIOS
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-800/60 text-white/90 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            type="button"
            onClick={() => setActiveTab('dados')}
            className={`py-3.5 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer mr-6 ${
              activeTab === 'dados'
                ? 'border-[#00875a] text-[#00875a]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Dados Cadastrais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('acesso')}
            className={`py-3.5 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'acesso'
                ? 'border-[#00875a] text-[#00875a]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Acesso ao Sistema</span>
          </button>
        </div>

        {/* Security Warning Banner */}
        {securityWarning && (
          <div className="px-6 py-2 bg-rose-50 border-b border-rose-200 text-rose-800 flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{securityWarning}</span>
          </div>
        )}

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          
          {/* TAB 1: DADOS CADASTRAIS */}
          {activeTab === 'dados' && (
            <div className="space-y-4">
              
              {/* Row 1: Nome Completo & E-mail Corporativo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nome Completo <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome completo do funcionário"
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00875a] focus:ring-1 focus:ring-[#00875a] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    E-mail Corporativo <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@gestrh.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00875a] focus:ring-1 focus:ring-[#00875a] transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Celular corporativo & Departamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Celular corporativo
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00875a] focus:ring-1 focus:ring-[#00875a] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Departamento <span className="text-emerald-600">*</span>
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#00875a] focus:ring-1 focus:ring-[#00875a] transition-all cursor-pointer"
                  >
                    {departments.length > 0 ? (
                      departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="dept-ti">TI</option>
                        <option value="dept-rh">Recursos Humanos</option>
                        <option value="dept-fin">Financeiro</option>
                        <option value="dept-[#00875a]">Gente & Gestão</option>
                        <option value="dept-com">Comercial</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Row 3: Cargo & Salário Bruto Mensal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Cargo <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Ex: Desenvolvedor React"
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00875a] focus:ring-1 focus:ring-[#00875a] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Salário Bruto Mensal <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="Valor em Real (R$)"
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00875a] focus:ring-1 focus:ring-[#00875a] transition-all"
                  />
                </div>
              </div>

              {/* Row 4: Status Contratual & Data de Admissão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Status Contratual
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#00875a] focus:ring-1 focus:ring-[#00875a] transition-all cursor-pointer"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Em Férias">Em Férias</option>
                    <option value="Licença">Afastado / Licença</option>
                    <option value="Experiência">Experiência</option>
                    <option value="Inativo">Inativo / Desligado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Data de Admissão
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#00875a] focus:ring-1 focus:ring-[#00875a] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Coordenador Direto & Nº de Dependentes (IRRF) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Coordenador Direto
                  </label>
                  <select
                    value={directCoordinator}
                    onChange={(e) => setDirectCoordinator(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#00875a] focus:ring-1 focus:ring-[#00875a] transition-all cursor-pointer"
                  >
                    <option value="">-- Selecionar Coordenador --</option>
                    <option value="Luciana Mello">Luciana Mello (Gente & Gestão)</option>
                    <option value="Carlos Eduardo Silva">Carlos Eduardo Silva (Operações)</option>
                    <option value="Mariana Costa">Mariana Costa (Recrutamento)</option>
                    <option value="Roberto Andrade">Roberto Andrade (TI & Tech)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nº de Dependentes (IRRF)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={dependentsCount}
                    onChange={(e) => setDependentsCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#00875a] focus:ring-1 focus:ring-[#00875a] transition-all"
                  />
                </div>
              </div>

              {/* Row 6: Benefício Vale Transporte (VT CLT) Card */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-900">
                  Benefício Vale Transporte (VT CLT)
                </span>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasVT}
                    onChange={(e) => setHasVT(e.target.checked)}
                    className="w-4 h-4 text-[#00875a] rounded border-slate-300 focus:ring-[#00875a] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#00875a]">Possui VT?</span>
                </label>
              </div>

            </div>
          )}

          {/* TAB 2: ACESSO AO SISTEMA & PERMISSÕES */}
          {activeTab === 'acesso' && (
            <div className="space-y-5">
              
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-extrabold text-emerald-950">Acesso ao Painel do Sistema</h4>
                  <p className="text-[11px] text-emerald-800 font-medium">Permitir que este colaborador faça login e acesse funcionalidades</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSystemAccess}
                    onChange={(e) => setEnableSystemAccess(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00875a]"></div>
                </label>
              </div>

              {enableSystemAccess && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Perfil de Acesso do Sistema (Role)</label>
                      <select
                        value={roleProfile}
                        onChange={(e) => handleRoleProfileChange(e.target.value as RoleProfile)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00875a] cursor-pointer"
                      >
                        <option value="Administrador">Administrador (Acesso Total)</option>
                        <option value="Gestor de Seleção">Gestor de Seleção</option>
                        <option value="Recrutador Sênior">Recrutador Sênior</option>
                        <option value="Analista de RH">Analista de RH</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Classificação Funcional</label>
                      <select
                        value={roleType}
                        onChange={(e) => setRoleType(e.target.value as TeamMemberRoleType)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00875a] cursor-pointer"
                      >
                        {TEAM_ROLE_TYPES.map(rt => (
                          <option key={rt} value={rt}>{rt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Senioridade</label>
                    <select
                      value={seniority}
                      onChange={(e) => setSeniority(e.target.value as TeamMemberSeniority)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00875a] cursor-pointer"
                    >
                      {TEAM_SENIORITIES.map(sn => (
                        <option key={sn} value={sn}>{sn}</option>
                      ))}
                    </select>
                  </div>

                  {/* Permissions matrix */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Permissões Específicas Módulos</h4>
                      <button
                        type="button"
                        onClick={handleResetPermissions}
                        className="text-xs text-[#00875a] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Resetar para padrão
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { key: 'canCreateJobs', label: 'Criar Novas Vagas', module: 'vagas' },
                        { key: 'canEditJobs', label: 'Editar Vagas Existentes', module: 'vagas' },
                        { key: 'canCloseJobs', label: 'Fechar / Encerrar Vagas', module: 'vagas' },
                        { key: 'canViewSalaries', label: 'Ver Faixas Salariais', module: 'folhaPagamento' },
                        { key: 'canApproveHires', label: 'Aprovar Contratações', module: 'contratacoes' },
                        { key: 'canDeleteCandidates', label: 'Excluir Candidatos', module: 'candidatos' },
                        { key: 'canScheduleInterviews', label: 'Agendar Entrevistas', module: 'entrevistas' },
                        { key: 'canExportReports', label: 'Exportar Relatórios', module: 'relatorios' },
                        { key: 'canManageTeam', label: 'Gerenciar Quadro de Funcionários', module: 'funcionarios' },
                      ].map(item => {
                        const isCompanyContracted = PermissionService.isCompanyModuleActive(item.module, activeModules);
                        const isChecked = isCompanyContracted && permissions[item.key as keyof InternalPermissions];

                        return (
                          <div
                            key={item.key}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                              !isCompanyContracted
                                ? 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                                : isChecked
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <label className="flex items-center gap-2.5 cursor-pointer select-none w-full">
                              <input
                                type="checkbox"
                                disabled={!isCompanyContracted}
                                checked={isChecked}
                                onChange={() => togglePermission(item.key as keyof InternalPermissions)}
                                className="w-4 h-4 text-[#00875a] rounded border-slate-300 focus:ring-[#00875a] disabled:cursor-not-allowed"
                              />
                              <span className="text-xs">{item.label}</span>
                            </label>
                            {!isCompanyContracted && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0 ml-2">
                                Não Contratado
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#00875a] hover:bg-[#00734c] text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{editingMember ? 'Salvar Colaborador' : 'Cadastrar Colaborador'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
