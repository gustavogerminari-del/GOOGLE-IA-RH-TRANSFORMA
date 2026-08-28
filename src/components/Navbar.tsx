import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Bell, 
  Plus, 
  UserPlus, 
  Calendar, 
  CheckCircle2, 
  Sparkles,
  ChevronDown,
  Crown,
  Menu
} from 'lucide-react';
import { useAuth } from '../auth';
import { isMasterProfile } from '../auth/profile';

interface NavbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  openNewCandidateModal?: () => void;
  openScheduleInterviewModal: () => void;
  openNewJobModal: () => void;
  onOpenMasterPanel?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchTerm,
  setSearchTerm,
  openNewCandidateModal,
  openScheduleInterviewModal,
  openNewJobModal,
  onOpenMasterPanel,
  onToggleMobileMenu,
}) => {
  const { user, isModuleActive } = useAuth();
  const isMaster = isMasterProfile(user);
  const canCreateJob = isModuleActive('vagas');
  const canCreateCandidate = isModuleActive('bancoTalentos');
  const canScheduleInterview = isModuleActive('entrevistas');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const notifications = [
    { id: '1', title: 'Novo candidato em "Dev React Senior"', time: 'Há 12 minutos', unread: true },
    { id: '2', title: 'Entrevista com Juliana Paes confirmada', time: 'Há 45 minutos', unread: true },
    { id: '3', title: 'Proposta aceita por Rodrigo Santoro', time: 'Há 2 horas', unread: false },
  ];

  return (
    <header className="bg-white border-b border-[#D5DEE8] sticky top-0 z-30 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Menu Hamburger & Brand Logo */}
      <div className="flex items-center gap-2.5">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-[#0F172A] hover:text-[#123657] hover:bg-[#EAF2F8] rounded-xl transition-all cursor-pointer border border-[#D5DEE8]"
            title="Abrir Menu de Navegação"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="bg-[#123657] text-white p-2 rounded-xl font-bold flex items-center justify-center shadow-xs">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#0F172A]">
              RH <span className="text-[#123657]">TRANSFORMA</span>
            </h1>
            <span className="bg-[#EAF2F8] text-[#123657] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-[#D5DEE8] uppercase hidden sm:inline-block">
              RH TRANSFORMA
            </span>
          </div>
          <p className="text-xs text-[#475569] font-medium hidden sm:block">
            Gestão de Pessoas, Recrutamento & Departamento Pessoal
          </p>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="hidden md:flex items-center relative w-80 lg:w-96">
        <Search className="w-4 h-4 text-[#475569] absolute left-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar candidato, vaga ou competência..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#FFFFFF] text-[#0F172A] text-sm pl-9 pr-4 py-2 rounded-xl border border-[#CBD5E1] focus:border-[#1D4F7A] focus:bg-white focus:ring-2 focus:ring-[#1D4F7A]/15 outline-none transition-all placeholder:text-[#64748B]"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 text-xs text-[#475569] hover:text-[#0F172A] font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="bg-[#123657] hover:bg-[#082747] text-white font-semibold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ação Rápida</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {showQuickActions && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#D5DEE8] rounded-2xl shadow-xl py-2 z-50 space-y-1">
              {canCreateJob && <button
                onClick={() => { setShowQuickActions(false); openNewJobModal(); }}
                className="w-full text-left px-4 py-2 text-xs sm:text-sm text-[#0F172A] hover:bg-[#EAF2F8] hover:text-[#123657] flex items-center gap-2.5 transition-colors font-medium"
              >
                <Plus className="w-4 h-4 text-[#123657]" />
                Nova Vaga
              </button>}
              {canCreateCandidate && openNewCandidateModal && <button
                onClick={() => { setShowQuickActions(false); openNewCandidateModal(); }}
                className="w-full text-left px-4 py-2 text-xs sm:text-sm text-[#0F172A] hover:bg-[#EAF2F8] hover:text-[#123657] flex items-center gap-2.5 transition-colors font-medium"
              >
                <UserPlus className="w-4 h-4 text-[#0F9F75]" />
                Cadastrar Candidato
              </button>}
              {canScheduleInterview && <button
                onClick={() => { setShowQuickActions(false); openScheduleInterviewModal(); }}
                className="w-full text-left px-4 py-2 text-xs sm:text-sm text-[#0F172A] hover:bg-[#EAF2F8] hover:text-[#123657] flex items-center gap-2.5 transition-colors font-medium"
              >
                <Calendar className="w-4 h-4 text-[#1D4F7A]" />
                Agendar Entrevista
              </button>}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#475569] hover:text-[#123657] hover:bg-[#EAF2F8] rounded-xl transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#123657] rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#D5DEE8] rounded-2xl shadow-xl py-3 z-50">
              <div className="px-4 pb-2 border-b border-[#D5DEE8] flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A]">Notificações Recentes</span>
                <span className="text-[10px] text-[#123657] bg-[#EAF2F8] font-bold px-2 py-0.5 rounded-full">2 novas</span>
              </div>
              <div className="divide-y divide-[#D5DEE8] max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-[#F7F9FC] transition-colors">
                    <p className="text-xs font-semibold text-[#0F172A]">{n.title}</p>
                    <p className="text-[10px] text-[#475569] mt-0.5">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Super Admin Exclusive Painel Master Button */}
        {isMaster && onOpenMasterPanel && (
          <button
            onClick={onOpenMasterPanel}
            className="bg-[#1D4F7A] hover:bg-[#123657] text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-[#20D9A0]" />
            <span className="hidden sm:inline">Painel Master</span>
          </button>
        )}

        <div className="h-6 w-[1px] bg-[#D5DEE8] mx-1"></div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-1">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-xl object-cover border border-[#D5DEE8] shadow-xs"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#EAF2F8] text-[#123657] font-black text-xs flex items-center justify-center shadow-xs border border-[#D5DEE8]">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RL'}
            </div>
          )}
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-[#0F172A] leading-none">{user?.name || 'Luciana Mello'}</p>
            <p className="text-[10px] font-medium text-[#475569] mt-1">{user?.role || 'Gestor de Seleção'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
