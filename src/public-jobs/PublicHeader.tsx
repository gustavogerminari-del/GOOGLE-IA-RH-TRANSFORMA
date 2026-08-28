import React from 'react';
import { 
  Building2, 
  Briefcase, 
  UserCheck, 
  LogIn, 
  PlusCircle, 
  FileText, 
  Sparkles,
  Phone,
  HelpCircle,
  Award
} from 'lucide-react';
import { PortalSectionTab } from './types';

interface PublicHeaderProps {
  activeSection: PortalSectionTab;
  onNavigateSection: (section: PortalSectionTab) => void;
  onOpenCandidateModal: () => void;
  onOpenCompanyModal: () => void;
  onGoToLogin?: () => void;
  isInternalView?: boolean;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  activeSection,
  onNavigateSection,
  onOpenCandidateModal,
  onOpenCompanyModal,
  onGoToLogin,
  isInternalView = false
}) => {
  return (
    <header className="bg-white border-b border-[#E5E7EB] text-[#1E293B] sticky top-0 z-40 shadow-xs">
      {/* Top Banner Accent */}
      <div className="bg-[#1E293B] text-[11px] py-1.5 px-4 text-center font-bold tracking-wide text-white flex items-center justify-center gap-3">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#B8963E]" />
          RH TRANSFORMA — Plataforma Profissional de Conexão entre Empresas e Talentos
        </span>
        <span className="hidden md:inline-block text-[#64748B]">•</span>
        <span className="hidden md:inline-block font-medium text-slate-300">Atendimento Corporativo: (11) 4003-8890</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        
        {/* Logo RH TRANSFORMA */}
        <div 
          onClick={() => onNavigateSection('inicio')} 
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white font-black text-xl flex items-center justify-center shadow-2xs group-hover:bg-[#1d4ed8] transition-colors">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-[#1E293B] tracking-tight">
                MAIS<span className="text-[#2563EB]">RH</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#2563EB] border border-blue-200 px-2 py-0.5 rounded-md">
                PORTAL
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] font-semibold">Conexão de Talentos</p>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E5E7EB] text-xs font-bold">
          <button
            onClick={() => onNavigateSection('inicio')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSection === 'inicio' 
                ? 'bg-[#2563EB] text-white font-black shadow-2xs' 
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
            }`}
          >
            Início
          </button>

          <button
            onClick={() => onNavigateSection('vagas')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSection === 'vagas' 
                ? 'bg-[#2563EB] text-white font-black shadow-2xs' 
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
            }`}
          >
            Vagas
          </button>

          <button
            onClick={() => onNavigateSection('empresas')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSection === 'empresas' 
                ? 'bg-[#2563EB] text-white font-black shadow-2xs' 
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
            }`}
          >
            Empresas
          </button>

          <button
            onClick={() => onNavigateSection('solucoes')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSection === 'solucoes' 
                ? 'bg-[#2563EB] text-white font-black shadow-2xs' 
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
            }`}
          >
            Soluções
          </button>

          <button
            onClick={() => onNavigateSection('planos')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSection === 'planos' 
                ? 'bg-[#2563EB] text-white font-black shadow-2xs' 
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
            }`}
          >
            Planos
          </button>

          <button
            onClick={() => onNavigateSection('sobre')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSection === 'sobre' 
                ? 'bg-[#2563EB] text-white font-black shadow-2xs' 
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
            }`}
          >
            Sobre
          </button>

          <button
            onClick={() => onNavigateSection('contato')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSection === 'contato' 
                ? 'bg-[#2563EB] text-white font-black shadow-2xs' 
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
            }`}
          >
            Contato
          </button>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCandidateModal}
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#F8FAFC] hover:bg-[#E5E7EB] text-[#1E293B] border border-[#E5E7EB] text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Cadastrar Currículo</span>
          </button>

          <button
            onClick={onOpenCompanyModal}
            className="hidden xl:inline-flex items-center gap-1.5 bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Para Empresas</span>
          </button>

          {isInternalView ? (
            <span className="text-[11px] font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
              Modo Interno
            </span>
          ) : (
            <button
              onClick={onGoToLogin}
              className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
