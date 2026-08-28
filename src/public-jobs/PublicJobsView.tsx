import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Briefcase, 
  ShieldCheck, 
  HeartHandshake,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowUpRight
} from 'lucide-react';

import { PublicJob, CandidateApplicationPayload, CompanyLeadPayload, PortalSectionTab } from './types';
import { Job, Candidate } from '../types/rh';

import { PublicHeader } from './PublicHeader';
import { HeroBanner } from './HeroBanner';
import { HowItWorksSection } from './HowItWorksSection';
import { DifferentialsSection } from './DifferentialsSection';
import { JobsPortalSection } from './JobsPortalSection';
import { EnterpriseCommercialSection } from './EnterpriseCommercialSection';
import { PricingPlansSection } from './PricingPlansSection';
import { AboutUsSection } from './AboutUsSection';
import { ContactSection } from './ContactSection';

import { CandidateResumeModal } from './CandidateResumeModal';
import { CompanyRegistrationModal } from './CompanyRegistrationModal';
import { JobService } from '../services/JobService';
import { formatFirestoreDate } from '../lib/firestoreUtils';
import { PublicApplicationService } from './PublicApplicationService';
import { CandidateService } from '../services/CandidateService';
import { useAuth } from '../auth';

export interface PublicJobsViewProps {
  jobs?: Job[];
  onApplyCandidate?: (candidateData: Omit<Candidate, 'id' | 'appliedDate'>) => void;
  onGoToLogin?: () => void;
  isInternalView?: boolean;
}

export const PublicJobsView: React.FC<PublicJobsViewProps> = ({
  jobs,
  onGoToLogin,
  isInternalView = false
}) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<PortalSectionTab>('inicio');
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('Plano Profissional');

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [fetchedPublicJobs, setFetchedPublicJobs] = useState<Job[]>([]);

  React.useEffect(() => {
    JobService.listPublicJobs().then(res => {
      if (res && res.length > 0) {
        setFetchedPublicJobs(res);
      }
    }).catch(err => console.warn('Aviso ao buscar vagas públicas:', err));
  }, []);

  // Map only persisted jobs into the public list.
  const activeJobsList: PublicJob[] = useMemo(() => {
    const allSourceJobsMap = new Map<string, Job>();
    (jobs || []).forEach(j => allSourceJobsMap.set(j.id, j));
    fetchedPublicJobs.forEach(j => {
      if (!allSourceJobsMap.has(j.id)) {
        allSourceJobsMap.set(j.id, j);
      }
    });

    const customJobsMapped: PublicJob[] = Array.from(allSourceJobsMap.values())
      .filter(j => {
        const rawStatus = String(j.status || '').trim().toLowerCase();
        const rawStatusVaga = String((j as any).statusVaga || '').trim().toLowerCase();
        const terminalStatuses = ['concluída', 'concluida', 'preenchida', 'fechada', 'encerrada', 'arquivada', 'cancelada', 'closed'];
        const isArchived = j.archived === true || j.isArchived === true || rawStatus === 'arquivada' || rawStatus === 'arquivo';
        const legacyTerminalMarker = terminalStatuses.includes(rawStatus)
          || terminalStatuses.includes(rawStatusVaga)
          || Boolean((j as any).concluidaEm || (j as any).preenchidaEm);
        if (isArchived || legacyTerminalMarker) return false;
        if (rawStatus === 'pausada' || rawStatus === 'rascunho' || rawStatus === 'draft' || rawStatus === 'paused') return false;
        if ((j as any).publicada === false) return false;
        return rawStatus === 'aberta' || rawStatus === 'ativa' || rawStatus === 'open' || (!j.status && (j as any).publicada !== false);
      })
      .map(j => {
        const title = j.title || j.titulo || 'Vaga em Aberto';
        const description = j.description || j.descricao || 'Oportunidade de carreira no portal oficial RH TRANSFORMA.';
        const companyName = j.nomeEmpresa || (j as any).companyName || 'RH TRANSFORMA';
        const empresaId = j.empresaId || (j as any).companyId;
        if (!empresaId) throw new Error(`Vaga ${j.id} sem empresa proprietária.`);
        const location = j.location || (j.cidade ? `${j.cidade}${j.estado ? ` - ${j.estado}` : ''}` : 'Local não informado');
        const workMode = j.locationType || (j as any).modalidade || 'Híbrido';
        const contractType = j.type || j.tipoContrato || 'CLT';
        const salaryRange = j.salaryRange || j.salario || 'A combinar';
        const requirements = (j.requirements && j.requirements.length > 0) ? j.requirements : (j.requisitos || ['Ensino Superior Completo', 'Boa comunicação']);
        const benefits = (j.benefits && j.benefits.length > 0) ? j.benefits : (j.beneficios || ['Vale Refeição', 'Plano de Saúde', 'Seguro de Vida']);
        const rawDate = j.createdAt || j.dataCriacao || (j as any).publishedAt;
        const publishedAt = formatFirestoreDate(rawDate) || new Date().toLocaleDateString('pt-BR');

        return {
          id: j.id,
          empresaId,
          code: j.id.substring(0, 8).toUpperCase(),
          title,
          companyName,
          department: j.department || 'Geral',
          location,
          workMode,
          contractType,
          salaryRange,
          description,
          requirements,
          benefits,
          publishedAt,
          featured: (j.applicantsCount || 0) > 2
        };
      });

    return customJobsMapped;
  }, [jobs, fetchedPublicJobs]);

  const handleHeroSearch = (keyword: string, location: string) => {
    setSearchKeyword(keyword);
    setSearchLocation(location);
    setActiveSection('vagas');
    // Scroll smoothly to jobs portal section
    const el = document.getElementById('portal-vagas');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCandidateApplicationSubmit = async (payload: CandidateApplicationPayload) => {
    const targetJobId = payload.jobId?.trim();
    if (payload.submissionMode === 'talent_bank' || !targetJobId) {
      const companyId = String(user?.empresaId || user?.companyId || user?.tenantId || '').trim();
      if (!companyId) {
        throw new Error('Para cadastrar no Banco de Talentos sem vaga, acesse o portal da empresa ou entre com seu acesso interno.');
      }
      const candidateId = `cand-${Date.now()}`;
      let resumeUrl = payload.resumeUrl?.trim() || '';
      let resumeFileName = payload.resumeFileName || '';
      if (payload.resumeFile) {
        const uploaded = await CandidateService.uploadTalentResume(companyId, candidateId, payload.resumeFile);
        resumeUrl = uploaded.url;
        resumeFileName = uploaded.fileName;
      }
      await CandidateService.create({
        id: candidateId,
        companyId,
        empresaId: companyId,
        name: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone.trim(),
        role: payload.interestArea || 'Banco de Talentos',
        location: payload.cityState.trim(),
        experienceYears: Number(payload.experienceYears) || 0,
        skills: payload.courses ? payload.courses.split(',').map(item => item.trim()).filter(Boolean) : [],
        status: 'Ativo',
        currentJobId: '',
        currentStageId: '',
        rating: 0,
        notes: payload.coverNote?.trim() || '',
        source: 'Banco de Talentos',
        resumeUrl,
        resumeFileName,
        inTalentBank: true,
        lgpdConsent: payload.lgpdConsent === true,
        lgpdConsentAt: new Date().toISOString(),
      } as any);
      return;
    }
    const targetJob = [...(jobs || []), ...fetchedPublicJobs].find(j => j.id === targetJobId);
    const targetCompanyId = (targetJob as any)?.empresaId || (targetJob as any)?.companyId;
    if (!targetJob || !targetCompanyId) throw new Error('A vaga selecionada não possui empresa válida vinculada.');
    await PublicApplicationService.submit({ ...payload, jobId: targetJobId });
  };

  const handleCompanyLeadSubmit = (payload: CompanyLeadPayload) => {
    console.log('Empresa interessada cadastrada:', payload);
  };

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    setIsCompanyModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col font-sans selection:bg-[#2563EB] selection:text-white">
      
      {/* 1. Header Fixado */}
      <PublicHeader
        activeSection={activeSection}
        onNavigateSection={(sec) => {
          setActiveSection(sec);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCandidateModal={() => setIsCandidateModalOpen(true)}
        onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
        onGoToLogin={onGoToLogin}
        isInternalView={isInternalView}
      />

      {/* 2. Banner Principal (Hero) */}
      <HeroBanner
        onSearch={handleHeroSearch}
        onOpenCandidateModal={() => setIsCandidateModalOpen(true)}
        onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
        totalJobsCount={activeJobsList.length}
      />

      {/* Section Router by Navigation Tab or Scroll */}
      {activeSection === 'inicio' && (
        <>
          <HowItWorksSection />
          <DifferentialsSection />
          <JobsPortalSection
            jobsList={activeJobsList}
            initialSearchKeyword={searchKeyword}
            initialSearchLocation={searchLocation}
            onApplySubmit={handleCandidateApplicationSubmit}
            onOpenCandidateModal={() => setIsCandidateModalOpen(true)}
          />
          <EnterpriseCommercialSection onOpenCompanyModal={() => setIsCompanyModalOpen(true)} />
          <PricingPlansSection onSelectPlan={handleSelectPlan} />
          <AboutUsSection />
          <ContactSection />
        </>
      )}

      {activeSection === 'vagas' && (
        <JobsPortalSection
          jobsList={activeJobsList}
          initialSearchKeyword={searchKeyword}
          initialSearchLocation={searchLocation}
          onApplySubmit={handleCandidateApplicationSubmit}
          onOpenCandidateModal={() => setIsCandidateModalOpen(true)}
        />
      )}

      {activeSection === 'empresas' && (
        <>
          <EnterpriseCommercialSection onOpenCompanyModal={() => setIsCompanyModalOpen(true)} />
          <DifferentialsSection />
        </>
      )}

      {activeSection === 'solucoes' && (
        <>
          <HowItWorksSection />
          <DifferentialsSection />
          <EnterpriseCommercialSection onOpenCompanyModal={() => setIsCompanyModalOpen(true)} />
        </>
      )}

      {activeSection === 'planos' && (
        <PricingPlansSection onSelectPlan={handleSelectPlan} />
      )}

      {activeSection === 'sobre' && (
        <AboutUsSection />
      )}

      {activeSection === 'contato' && (
        <ContactSection />
      )}

      {/* Footer Geral do Portal */}
      <footer className="bg-[#1E293B] text-slate-300 py-12 text-xs border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-700">
            {/* Coluna 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white font-black flex items-center justify-center text-sm shadow-2xs">
                  M
                </div>
                <span className="text-lg font-black text-white tracking-tight">MAIS<span className="text-[#2563EB]">RH</span></span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed font-normal">
                Plataforma SaaS de recrutamento e seleção inteligente com suporte de Inteligência Artificial para empresas e candidatos.
              </p>
            </div>

            {/* Coluna 2 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-white tracking-wider">Navegação</h4>
              <ul className="space-y-1.5 text-slate-300">
                <li><button onClick={() => setActiveSection('inicio')} className="hover:text-blue-400 cursor-pointer">Início</button></li>
                <li><button onClick={() => setActiveSection('vagas')} className="hover:text-blue-400 cursor-pointer">Portal de Vagas</button></li>
                <li><button onClick={() => setActiveSection('empresas')} className="hover:text-blue-400 cursor-pointer">Área para Empresas</button></li>
                <li><button onClick={() => setActiveSection('planos')} className="hover:text-blue-400 cursor-pointer">Planos Corporativos</button></li>
              </ul>
            </div>

            {/* Coluna 3 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-white tracking-wider">Candidatos</h4>
              <ul className="space-y-1.5 text-slate-300">
                <li><button onClick={() => setIsCandidateModalOpen(true)} className="hover:text-blue-400 cursor-pointer">Cadastrar Currículo com IA</button></li>
                <li><button onClick={() => setActiveSection('vagas')} className="hover:text-blue-400 cursor-pointer">Buscar Oportunidades</button></li>
                <li><button onClick={() => setActiveSection('contato')} className="hover:text-blue-400 cursor-pointer">Suporte ao Candidato</button></li>
              </ul>
            </div>

            {/* Coluna 4 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-white tracking-wider">Segurança & LGPD</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Todos os dados armazenados seguem rigorosamente a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
              </p>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] pt-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Ambiente Seguro & Encriptado</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-medium">
            <p>© 2026 Grupo RH TRANSFORMA Brasil — Todos os direitos reservados.</p>
            <div className="flex items-center gap-4">
              <span>Termos de Uso</span>
              <span>•</span>
              <span>Política de Privacidade</span>
              <span>•</span>
              <span>Central de Ajuda</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Modal 1: Cadastro de Currículo para Candidatos */}
      <CandidateResumeModal
        isOpen={isCandidateModalOpen}
        onClose={() => setIsCandidateModalOpen(false)}
        jobs={jobs}
        onSuccessSubmit={handleCandidateApplicationSubmit}
      />

      {/* Modal 2: Cadastro / Solicitação Comercial de Empresa */}
      <CompanyRegistrationModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        preselectedPlan={selectedPlan}
        onSuccessSubmit={handleCompanyLeadSubmit}
      />

    </div>
  );
};
