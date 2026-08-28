import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Sparkles, 
  FileText, 
  Building2, 
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Zap
} from 'lucide-react';

interface HeroBannerProps {
  onSearch: (keyword: string, location: string) => void;
  onOpenCandidateModal: () => void;
  onOpenCompanyModal: () => void;
  totalJobsCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onSearch,
  onOpenCandidateModal,
  onOpenCompanyModal,
  totalJobsCount
}) => {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(keyword, location);
  };

  return (
    <section className="relative bg-[#F8FAFC] text-[#1E293B] py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E5E7EB]">
      <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
        
        {/* Profile Mode Switcher Pill */}
        <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs">
          <button
            onClick={onOpenCandidateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] text-white shadow-2xs hover:bg-[#1d4ed8] transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Sou Candidato</span>
          </button>
          
          <button
            onClick={onOpenCompanyModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] transition-all cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-[#2563EB]" />
            <span>Sou Empresa</span>
          </button>
        </div>

        {/* Main Headline */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#B8963E]" />
            Portal Oficial RH TRANSFORMA — Plataforma Corporativa de Talentos
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-[#1E293B]">
            Conectando talentos às <br />
            <span className="text-[#2563EB]">
              melhores oportunidades
            </span>
          </h1>

          <p className="text-[#64748B] text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed">
            Uma plataforma profissional para empresas encontrarem talentos e candidatos descobrirem novas vagas.
          </p>
        </div>

        {/* Interactive Search Bar Form */}
        <form 
          onSubmit={handleSearchSubmit} 
          className="mt-8 bg-white p-3 rounded-2xl shadow-xs text-[#1E293B] grid grid-cols-1 sm:grid-cols-12 gap-2 border border-[#E5E7EB] max-w-4xl mx-auto"
        >
          {/* Campo 1: Cargo / Palavra-chave */}
          <div className="sm:col-span-5 relative flex items-center">
            <Search className="w-4 h-4 text-[#2563EB] absolute left-3.5" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cargo, palavra-chave ou habilidades..."
              className="w-full pl-10 pr-3 py-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#2563EB] font-medium text-[#1E293B]"
            />
          </div>

          {/* Campo 2: Localização */}
          <div className="sm:col-span-4 relative flex items-center">
            <MapPin className="w-4 h-4 text-[#2563EB] absolute left-3.5" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Cidade ou Estado (ex: SP, Remoto)"
              className="w-full pl-10 pr-3 py-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#2563EB] font-medium text-[#1E293B]"
            />
          </div>

          {/* Botão Buscar Vagas */}
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="w-full h-full min-h-[44px] bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Buscar Vagas</span>
            </button>
          </div>
        </form>

        {/* Secondary Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={onOpenCandidateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Cadastrar Currículo Grátis</span>
          </button>

          <button
            onClick={onOpenCompanyModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#1E293B] text-xs font-bold border border-[#E5E7EB] transition-all cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-[#2563EB]" />
            <span>Anunciar Vagas da Minha Empresa</span>
          </button>
        </div>

        {/* Quick Highlights Bar */}
        <div className="pt-6 border-t border-[#E5E7EB] flex flex-wrap items-center justify-center gap-6 text-xs text-[#64748B] font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
            <strong>{totalJobsCount}</strong> Vagas Abertas Hoje
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#B8963E]" />
            Mapeamento IA com RH TRANSFORMA
          </span>
          <span className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Empresas Verificadas em todo o Brasil
          </span>
        </div>

      </div>
    </section>
  );
};
