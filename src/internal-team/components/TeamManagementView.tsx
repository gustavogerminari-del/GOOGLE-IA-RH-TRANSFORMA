/**
 * MÓDULO EQUIPE INTERNA - Visão Principal de Gestão da Equipe
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 * 
 * Regra Arquitetural: Depende apenas do NÚCLEO, COMPARTILHADO, AUTENTICAÇÃO e ESTRUTURA ORGANIZACIONAL.
 */

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  BarChart2, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRightLeft, 
  Building2, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../auth';
import { Department } from '../../organization';
import { InternalTeamMember, TeamMemberFilterParams } from '../types/team';
import { InternalTeamService } from '../services/teamService';
import { TEAM_ROLE_TYPES, TEAM_STATUSES } from '../constants/teamOptions';
import { TeamMemberCard } from './TeamMemberCard';
import { TeamMemberModal } from './TeamMemberModal';
import { TeamMemberMetricsModal } from './TeamMemberMetricsModal';
import { ReassignJobsModal } from './ReassignJobsModal';
import { TeamPerformanceOverview } from './TeamPerformanceOverview';
import { ContextualAiModal } from '../../ai/components/ContextualAiModal';
import { employeeAiService } from '../../ai/services/aiService';

interface TeamManagementViewProps {
  departments?: Department[];
}

export const TeamManagementView: React.FC<TeamManagementViewProps> = ({
  departments = [],
}) => {
  const { user } = useAuth();

  // State principal de membros da equipe
  const [members, setMembers] = useState<InternalTeamMember[]>([]);

  // Tab ativa: 'membros' | 'tabela' | 'desempenho'
  const [activeTab, setActiveTab] = useState<'membros' | 'tabela' | 'desempenho'>('membros');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('Todos');
  const [selectedRoleType, setSelectedRoleType] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [selectedWorkload, setSelectedWorkload] = useState<string>('Todos');

  // Modais
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<InternalTeamMember | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [selectedMetricsMember, setSelectedMetricsMember] = useState<InternalTeamMember | null>(null);

  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedReassignMember, setSelectedReassignMember] = useState<InternalTeamMember | null>(null);

  // Controle de Simulação de Perfil para testes de Segurança/RBAC
  const [simulatedIsAdmin, setSimulatedIsAdmin] = useState<boolean>(true);

  // Checa se usuário logado ou simulação possui privilégio admin
  const isAdmin = user?.role === 'Administrador' || simulatedIsAdmin;

  // Filtra lista de membros
  const filteredMembers = InternalTeamService.filterMembers(members, {
    searchTerm,
    departmentId: selectedDeptId,
    roleType: selectedRoleType,
    status: selectedStatus as any,
    workloadStatus: selectedWorkload as any,
  });

  // Handlers CRUD
  const handleSaveMember = (memberData: Omit<InternalTeamMember, 'id' | 'processControl' | 'metrics' | 'updatedAt'>) => {
    try {
      InternalTeamService.validateAdminPermission(isAdmin ? 'Administrador' : 'Analista de RH');
    } catch (err: any) {
      alert(err.message || 'Apenas Administradores podem realizar esta operação.');
      return;
    }

    if (editingMember) {
      setMembers(prev => prev.map(m => {
        if (m.id === editingMember.id) {
          return {
            ...m,
            ...memberData,
            updatedAt: new Date().toISOString().split('T')[0]
          };
        }
        return m;
      }));
    } else {
      const newMember: InternalTeamMember = {
        ...memberData,
        id: `team-${Date.now()}`,
        processControl: {
          maxJobCapacity: 7,
          activeJobsCount: 0,
          assignedProcesses: []
        },
        metrics: {
          avgTimeToHireDays: 20,
          slaTargetDays: 25,
          slaComplianceRate: 90,
          interviewsConductedMonth: 0,
          screenedCandidatesMonth: 0,
          hiredCandidatesYear: 0,
          managerNpsScore: 4.8,
          offerAcceptanceRate: 90
        },
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setMembers(prev => [newMember, ...prev]);
    }
    setIsMemberModalOpen(false);
    setEditingMember(null);
  };

  const handleToggleStatus = (member: InternalTeamMember) => {
    if (!isAdmin) {
      alert('Regra de Segurança RBAC: Apenas o Administrador pode alterar o status de um usuário.');
      return;
    }

    const nextStatus = member.status === 'Inativo' ? 'Ativo' : 'Inativo';
    setMembers(prev => prev.map(m => {
      if (m.id === member.id) {
        return { ...m, status: nextStatus, updatedAt: new Date().toISOString().split('T')[0] };
      }
      return m;
    }));
  };

  const handleConfirmReassign = (jobId: string, sourceMemberId: string, targetMemberId: string) => {
    try {
      const updatedMembers = InternalTeamService.reassignProcess(
        members,
        { jobId, sourceMemberId, targetMemberId },
        isAdmin ? 'Administrador' : 'Analista de RH'
      );
      setMembers(updatedMembers);
    } catch (err: any) {
      alert(err.message || 'Erro ao realocar vaga.');
    }
  };

  const handleOpenEdit = (member: InternalTeamMember) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleOpenMetrics = (member: InternalTeamMember) => {
    setSelectedMetricsMember(member);
    setIsMetricsModalOpen(true);
  };

  const handleOpenReassign = (member: InternalTeamMember) => {
    setSelectedReassignMember(member);
    setIsReassignModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDeptId('Todos');
    setSelectedRoleType('Todos');
    setSelectedStatus('Todos');
    setSelectedWorkload('Todos');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Gestão da Equipe Interna de RH
                </h1>
                <p className="text-xs text-slate-500">
                  Módulo Comercial RH TRANSFORMA • Gestão de recrutadores, BPs, permissões e processos sob responsabilidade
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowAiModal(true)}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Sugerir PDI com IA</span>
            </button>

            {/* Quick Action Button for Reassignment */}
            <button
              onClick={() => {
                const activeMem = members.find(m => m.processControl.activeJobsCount > 0);
                if (activeMem) handleOpenReassign(activeMem);
              }}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-slate-600" />
              <span>Realocar Vagas</span>
            </button>

            {/* Main Action: New Team Member */}
            <button
              onClick={() => {
                setEditingMember(null);
                setIsMemberModalOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Novo Membro</span>
            </button>
          </div>
        </div>

        {/* Security Rule Context Bar */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${isAdmin ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span className="text-slate-700">
              Sessão Atual: <strong>{user?.name || 'Luciana Mello'}</strong> ({user?.role || 'Administrador'})
            </span>
          </div>

          {/* Quick Simulation Toggle for Testing RBAC */}
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200 shrink-0">
            <span className="text-slate-500 text-[11px] font-medium">Permissão RBAC:</span>
            <button
              onClick={() => setSimulatedIsAdmin(!simulatedIsAdmin)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isAdmin ? '🛡️ Perfil Admin (Ativo)' : '👤 Perfil Limitado'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Navigation Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          
          {/* Main Tab Switchers */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('membros')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'membros'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards da Equipe ({filteredMembers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tabela')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'tabela'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista Detalhada</span>
            </button>

            <button
              onClick={() => setActiveTab('desempenho')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'desempenho'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Painel de Desempenho & KPIs</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, e-mail, cargo ou especialidade..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          
          <div>
            <label className="block font-semibold text-slate-500 mb-1">Departamento</label>
            <select
              value={selectedDeptId}
              onChange={e => setSelectedDeptId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Todos">Todos os Departamentos</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Função / Cargo</label>
            <select
              value={selectedRoleType}
              onChange={e => setSelectedRoleType(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Todos">Todas as Funções</option>
              {TEAM_ROLE_TYPES.map(rt => (
                <option key={rt} value={rt}>{rt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Todos">Todos os Status</option>
              {TEAM_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Carga de Vagas</label>
            <select
              value={selectedWorkload}
              onChange={e => setSelectedWorkload(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Todos">Todas as Cargas</option>
              <option value="Livre">Livre (&lt; 40%)</option>
              <option value="Ideal">Ideal (40% - 85%)</option>
              <option value="Sobrecarregado">Sobrecarregado (&gt; 85%)</option>
            </select>
          </div>

        </div>

      </div>

      {/* Main View Router Content */}
      {activeTab === 'membros' && (
        <>
          {filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  isAdmin={isAdmin}
                  onViewMetrics={handleOpenMetrics}
                  onEditMember={handleOpenEdit}
                  onReassignJobs={handleOpenReassign}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Nenhum profissional encontrado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Nenhum membro da equipe corresponde aos filtros ou busca aplicados.
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-xl hover:bg-indigo-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar Filtros
              </button>
            </div>
          )}
        </>
      )}

      {/* Tabela View */}
      {activeTab === 'tabela' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Profissional</th>
                  <th className="p-4">Cargo & Função</th>
                  <th className="p-4">Departamento</th>
                  <th className="p-4">Processos Ativos</th>
                  <th className="p-4 text-center">SLA Médio</th>
                  <th className="p-4 text-center">NPS Gestor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-slate-900">{m.name}</p>
                          <p className="text-[11px] text-slate-500">{m.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{m.jobTitle}</p>
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-medium">
                        {m.roleType} ({m.seniority})
                      </span>
                    </td>

                    <td className="p-4 text-slate-700 font-medium">
                      {m.departmentName}
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-slate-900">
                        {m.processControl.activeJobsCount} / {m.processControl.maxJobCapacity} vagas
                      </span>
                    </td>

                    <td className="p-4 text-center font-bold text-slate-800">
                      {m.metrics.avgTimeToHireDays}d
                    </td>

                    <td className="p-4 text-center font-bold text-amber-600">
                      ★ {m.metrics.managerNpsScore}
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        m.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {m.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenMetrics(m)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold rounded-lg"
                        >
                          Métricas
                        </button>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Desempenho View */}
      {activeTab === 'desempenho' && (
        <TeamPerformanceOverview
          members={members}
          onSelectMember={handleOpenMetrics}
        />
      )}

      {/* Modais */}
      <TeamMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSubmit={handleSaveMember}
        editingMember={editingMember}
        departments={departments}
        isAdmin={isAdmin}
      />

      <TeamMemberMetricsModal
        isOpen={isMetricsModalOpen}
        onClose={() => setIsMetricsModalOpen(false)}
        member={selectedMetricsMember}
      />

      <ReassignJobsModal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        sourceMember={selectedReassignMember}
        allMembers={members}
        onConfirmReassign={handleConfirmReassign}
      />

      <ContextualAiModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="Geração Inteligente de PDI & Plano de Desenvolvimento"
        subtitle="Sugestão de metas, competências e trilha de treinamento para a equipe interna"
        onExecute={() => employeeAiService.suggestDevelopmentPlan({ employee: members[0] || { name: 'Colaborador' } })}
        confirmText="Anotar PDI"
      />
    </div>
  );
};
