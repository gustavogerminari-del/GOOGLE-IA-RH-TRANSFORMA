import React from 'react';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  UserRoundSearch,
  CalendarDays,
  Handshake,
  UserCog,
  Sparkles,
  FileText,
  Clock3,
  Calculator,
  Umbrella,
  BarChart3,
  Globe2,
  ShieldCheck,
  Settings,
  X,
  Plus,
  UserPlus,
  CalendarPlus,
  Building2,
  Database,
} from 'lucide-react';
import { useAuth } from '../auth';
import { isMasterProfile } from '../auth/profile';

export type MainTab =
  | 'dashboard'
  | 'mais-rh-ia'
  | 'vagas'
  | 'banco-talentos'
  | 'candidatos'
  | 'entrevistas'
  | 'contratacoes'
  | 'agenda'
  | 'relatorios'
  | 'empresa'
  | 'equipe-interna'
  | 'site-vagas'
  | 'headhunter'
  | `headhunter-${string}`
  | 'consultor-rh'
  | 'departamento-pessoal'
  | 'colaboradores'
  | 'admissoes'
  | 'organograma'
  | 'ponto-digital'
  | 'jornada'
  | 'beneficios'
  | 'ferias'
  | 'rescisao'
  | 'documentos'
  | 'afastamentos'
  | 'sst'
  | 'acessos-portal'
  | 'relatorios-dp'
  | 'configuracoes-trabalhistas'
  | 'folha-pagamento'
  | 'ferias-beneficios'
  | 'auditoria'
  | 'planos-saas'
  | 'acesso-master'
  | `master-${string}`
  | 'configuracoes'
  | 'implantacao-migracao'
  | 'suporte-ajuda';

type SidebarProps = {
  activeTab: MainTab;
  setActiveTab: React.Dispatch<React.SetStateAction<MainTab>>;
  openNewJobModal: () => void;
  openNewCandidateModal: () => void;
  openScheduleInterviewModal: () => void;
  jobsCount?: number;
  candidatesCount?: number;
  interviewsCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
};

type MenuItem = {
  tab: MainTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  moduleKey?: string;
  badge?: number | string;
  masterOnly?: boolean;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openNewJobModal,
  openNewCandidateModal,
  openScheduleInterviewModal,

  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user, isModuleActive } = useAuth();
  const isMaster = isMasterProfile(user);

  const allowed = (moduleKey?: string, masterOnly?: boolean) => {
    if (masterOnly) return isMaster;
    if (!moduleKey) return true;
    return isModuleActive(moduleKey);
  };

  const groups: MenuGroup[] = [
    {
      title: 'INÍCIO',
      items: [
        { tab: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
      ],
    },
    {
      title: 'RECRUTAMENTO & SELEÇÃO',
      items: [
        { tab: 'vagas', label: 'Vagas', icon: BriefcaseBusiness, moduleKey: 'vagas' },
        { tab: 'candidatos', label: 'Candidatos & Pipeline', icon: Users, moduleKey: 'recrutamento' },
        { tab: 'banco-talentos', label: 'Banco de Talentos', icon: UserRoundSearch, moduleKey: 'bancoTalentos' },
        { tab: 'entrevistas', label: 'Entrevistas', icon: CalendarDays, moduleKey: 'entrevistas' },
        { tab: 'contratacoes', label: 'Contratações', icon: Handshake, moduleKey: 'recrutamento' },
      ],
    },
    {
      title: 'HEADHUNTER',
      items: [
        { tab: 'headhunter', label: 'Headhunter', icon: Handshake, moduleKey: 'headhunter' },
      ],
    },
    {
      title: 'DEPARTAMENTO PESSOAL',
      items: [
        { tab: 'departamento-pessoal', label: 'Departamento Pessoal', icon: Building2, moduleKey: 'departamentoPessoal' },
        { tab: 'equipe-interna', label: 'Equipe Interna', icon: UserCog, moduleKey: 'equipeInterna' },
        { tab: 'ponto-digital', label: 'Ponto e Jornada', icon: Clock3, moduleKey: 'ponto' },
        { tab: 'ferias-beneficios', label: 'Férias e Benefícios', icon: Umbrella, moduleKey: 'feriasBeneficios' },
        { tab: 'documentos', label: 'Documentos e Assinatura', icon: FileText, moduleKey: 'documentosAssinatura' },
        { tab: 'folha-pagamento', label: 'Folha', icon: Calculator, moduleKey: 'folha' },
      ],
    },
    {
      title: 'GESTÃO & PLATAFORMA',
      items: [
        { tab: 'mais-rh-ia', label: 'Consultor de RH', icon: Sparkles, moduleKey: 'consultorRH' },
        { tab: 'relatorios', label: 'Relatórios Avançados', icon: BarChart3, moduleKey: 'relatoriosAvancados' },
        { tab: 'site-vagas', label: 'Site de Vagas', icon: Globe2, moduleKey: 'siteVagasPersonalizado' },
        { tab: 'auditoria', label: 'Auditoria e Logs', icon: ShieldCheck, moduleKey: 'auditoriaLogs' },
        { tab: 'implantacao-migracao', label: 'Implantação e Migração', icon: Database, moduleKey: 'implantacaoMigracao' } /* RH_IMPLANTACAO_MIGRACAO_MODULE_V3 */,
        { tab: 'configuracoes', label: 'Configurações da Empresa', icon: Settings },
      ],
    },
  ];

  const visibleGroups = groups
    .map(group => ({ ...group, items: group.items.filter(item => allowed(item.moduleKey, item.masterOnly)) }))
    .filter(group => group.items.length > 0);

  // RH_DP_NAVIGATION_ADMISSION_MODAL_V2
  // Mantém a página ativa disponível para fluxos operacionais e fecha a admissão
  // sempre que a navegação sair do contexto oficial de DP/Admissões.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem('rh:active-tab', activeTab);
    window.dispatchEvent(new CustomEvent('rh:navigation-changed', { detail: { tab: activeTab } }));
    const admissionAllowed = ["departamento-pessoal","admissoes"].includes(activeTab);
    if (!admissionAllowed) {
      window.localStorage.removeItem('selectedAdmissionId');
      window.dispatchEvent(new CustomEvent('rh:close-admission-flow', { detail: { tab: activeTab } }));
    }
  }, [activeTab]);

  const navigate = (tab: MainTab) => {
    // O efeito acima é a fonte única para sincronizar/fechar o modal.
    setActiveTab(tab);
    onCloseMobile?.();
  };

  const sidebarClass = [
    'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#1e3858] bg-[#0B1D33] text-slate-200 shadow-xl transition-transform lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:shadow-none',
    isOpenMobile ? 'translate-x-0' : '-translate-x-full',
  ].join(' ');

  return <>
    {isOpenMobile && <button type="button" aria-label="Fechar menu" onClick={onCloseMobile} className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" />}
    <aside className={sidebarClass} data-menu-contadores="off">
      <div className="flex items-center justify-between border-b border-[#1e3858] px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1D4F7A] text-xs font-black text-white">RH</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black tracking-wide text-white">RH TRANSFORMA</div>
            <div className="truncate text-[10px] font-semibold text-slate-400">{user?.companyName || (isMaster ? 'Plataforma RH TRANSFORMA' : 'Empresa')}</div>
          </div>
        </div>
        <button type="button" onClick={onCloseMobile} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Fechar menu">
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {visibleGroups.map(group => (
            <section key={group.title}>
              <h2 className="mb-1.5 px-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{group.title}</h2>
              <div className="space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const selected = activeTab === item.tab;
                  return (
                    <button
                      type="button"
                      key={item.tab}
                      onClick={() => navigate(item.tab)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${selected ? 'bg-[#1D4F7A] text-white shadow-sm' : 'text-slate-300 hover:bg-[#132c4a] hover:text-white'}`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Icon className={`h-4 w-4 shrink-0 ${selected ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>

      <div className="border-t border-[#1e3858] bg-[#081628] p-3">
        <div className="mb-2 text-[10px] font-semibold text-slate-400">AÇÕES RÁPIDAS</div>
        <div className="grid grid-cols-3 gap-1.5">
          {isModuleActive('vagas') && <button type="button" title="Nova vaga" onClick={() => { openNewJobModal(); onCloseMobile?.(); }} className="flex items-center justify-center rounded-lg bg-[#132c4a] p-2 text-slate-300 hover:bg-[#1D4F7A] hover:text-white"><Plus className="h-4 w-4" /></button>}
          {isModuleActive('bancoTalentos') && <button type="button" title="Novo candidato" onClick={() => { openNewCandidateModal(); onCloseMobile?.(); }} className="flex items-center justify-center rounded-lg bg-[#132c4a] p-2 text-slate-300 hover:bg-[#1D4F7A] hover:text-white"><UserPlus className="h-4 w-4" /></button>}
          {isModuleActive('entrevistas') && <button type="button" title="Agendar entrevista" onClick={() => { openScheduleInterviewModal(); onCloseMobile?.(); }} className="flex items-center justify-center rounded-lg bg-[#132c4a] p-2 text-slate-300 hover:bg-[#1D4F7A] hover:text-white"><CalendarPlus className="h-4 w-4" /></button>}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="truncate">Firebase • {user?.role || 'Usuário'}</span>
        </div>
      </div>
    </aside>
  </>;
};
