import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  MapPin, 
  Building2, 
  Clock, 
  Search, 
  Filter, 
  CheckCircle2, 
  Send, 
  Upload, 
  Sparkles, 
  ChevronRight, 
  X,
  FileText,
  DollarSign,
  User,
  Phone,
  Mail,
  Linkedin,
  HeartHandshake,
  Share2,
  Check,
  ShieldCheck
} from 'lucide-react';
import { PublicJob, CandidateApplicationPayload } from './types';
import { Job, Candidate } from '../types/rh';
import { formatFirestoreDate } from '../lib/firestoreUtils';

interface JobsPortalSectionProps {
  jobsList: PublicJob[];
  initialSearchKeyword?: string;
  initialSearchLocation?: string;
  onApplySubmit: (payload: CandidateApplicationPayload) => Promise<void>;
  onOpenCandidateModal: () => void;
}

export const JobsPortalSection: React.FC<JobsPortalSectionProps> = ({
  jobsList,
  initialSearchKeyword = '',
  initialSearchLocation = '',
  onApplySubmit,
  onOpenCandidateModal
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchKeyword);
  const [locationTerm, setLocationTerm] = useState(initialSearchLocation);
  const [selectedDepartment, setSelectedDepartment] = useState('Todos');
  const [selectedContractType, setSelectedContractType] = useState('Todos');
  const [selectedWorkMode, setSelectedWorkMode] = useState('Todos');

  const [selectedJob, setSelectedJob] = useState<PublicJob | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Form State for direct job application
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cityState, setCityState] = useState('');
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isPne, setIsPne] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Auto-detect job from URL hash or query param on load
  useEffect(() => {
    if (jobsList.length === 0) return;
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    const paramJobId = urlParams.get('vaga') || urlParams.get('jobId') || (hash.startsWith('#vaga-') ? hash.replace('#vaga-', '') : null);

    if (paramJobId) {
      const found = jobsList.find(j => j.id === paramJobId || j.code?.toLowerCase() === paramJobId.toLowerCase());
      if (found) {
        setSelectedJob(found);
      }
    }
  }, [jobsList]);

  // Update hash when job selection changes
  const handleSelectJob = (job: PublicJob | null) => {
    setSelectedJob(job);
    setIsApplying(false);
    if (job) {
      window.history.replaceState(null, '', `#vaga-${job.id}`);
    } else {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleShareJob = (job: PublicJob) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#vaga-${job.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Dynamic filter lists
  const departments = ['Todos', ...Array.from(new Set(jobsList.map(j => j.department)))];

  const filteredJobs = jobsList.filter(job => {
    const matchesSearch = 
      !searchTerm ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.requirements.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLocation = 
      !locationTerm ||
      job.location.toLowerCase().includes(locationTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'Todos' || job.department === selectedDepartment;
    const matchesContract = selectedContractType === 'Todos' || job.contractType === selectedContractType;
    const matchesWorkMode = selectedWorkMode === 'Todos' || job.workMode === selectedWorkMode;

    return matchesSearch && matchesLocation && matchesDepartment && matchesContract && matchesWorkMode;
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || isSubmitting) return;

    setSubmitError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setSubmitError('Informe um e-mail válido, incluindo o final .com ou equivalente.');
      return;
    }
    if (!resumeFile) {
      setSubmitError('Anexe seu currículo em PDF, DOC ou DOCX.');
      return;
    }
    if (!lgpdConsent) {
      setSubmitError('Confirme o consentimento da LGPD para continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onApplySubmit({
        jobId: selectedJob.id,
        fullName,
        email: normalizedEmail,
        phone,
        cityState,
        linkedinUrl,
        resumeFileName: resumeFile ? resumeFile.name : 'curriculo_candidato.pdf',
        resumeFile: resumeFile || undefined,
        coverNote: coverNote ? `Pretensão Salarial: ${salaryExpectation || 'A combinar'}. ${coverNote}` : `Inscrição para ${selectedJob.title}. Pretensão: ${salaryExpectation || 'A combinar'}.`,
        pne: isPne,
        lgpdConsent
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível enviar a candidatura.';
      setSubmitError(message);
      return;
    } finally {
      setIsSubmitting(false);
    }

    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setIsApplying(false);
      setSelectedJob(null);
      setFullName('');
      setEmail('');
      setPhone('');
      setCityState('');
      setSalaryExpectation('');
      setLinkedinUrl('');
      setIsPne(false);
      setCoverNote('');
      setResumeFile(null);
    }, 2500);
  };

  const decodedResumeFileName = (() => {
    if (!resumeFile) return '';
    try { return decodeURIComponent(resumeFile.name); } catch { return resumeFile.name; }
  })();

  return (
    <section id="portal-vagas" className="py-12 bg-[#F8FAFC] text-[#1E293B] border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-2xl font-black text-[#1E293B]">Portal de Vagas Ativas</h2>
            </div>
            <p className="text-xs text-[#64748B] mt-1 font-medium">
              Confira abaixo todas as oportunidades corporativas abertas nas empresas parceiras do RH TRANSFORMA.
            </p>
          </div>

          <button
            onClick={onOpenCandidateModal}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#B8963E]" />
            <span>Cadastrar Currículo Sem Vaga Específica</span>
          </button>
        </div>

        {/* Multi-Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Palavra-Chave */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#2563EB] absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cargo ou palavra-chave..."
              className="w-full text-xs font-medium pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] focus:bg-white focus:border-[#2563EB] outline-none"
            />
          </div>

          {/* Localização */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-[#2563EB] absolute left-3 top-3" />
            <input
              type="text"
              value={locationTerm}
              onChange={(e) => setLocationTerm(e.target.value)}
              placeholder="Cidade ou Estado..."
              className="w-full text-xs font-medium pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] focus:bg-white focus:border-[#2563EB] outline-none"
            />
          </div>

          {/* Área / Departamento */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] focus:bg-white focus:border-[#2563EB] outline-none"
            >
              <option value="Todos">Área: Todas as Áreas</option>
              {departments.filter(d => d !== 'Todos').map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Tipo Contrato */}
          <div>
            <select
              value={selectedContractType}
              onChange={(e) => setSelectedContractType(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] focus:bg-white focus:border-[#2563EB] outline-none"
            >
              <option value="Todos">Contrato: Todos</option>
              <option value="CLT">CLT</option>
              <option value="PJ">PJ</option>
              <option value="Estágio">Estágio</option>
              <option value="Temporário">Temporário</option>
            </select>
          </div>

          {/* Modalidade */}
          <div>
            <select
              value={selectedWorkMode}
              onChange={(e) => setSelectedWorkMode(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] focus:bg-white focus:border-[#2563EB] outline-none"
            >
              <option value="Todos">Modalidade: Todas</option>
              <option value="Presencial">Presencial</option>
              <option value="Híbrido">Híbrido</option>
              <option value="Remoto">Remoto</option>
            </select>
          </div>

        </div>

        {/* Main Jobs Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Job List Cards (Left) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-[#64748B] px-1">
              <span>Exibindo {filteredJobs.length} vaga(s) encontrada(s)</span>
              {(searchTerm || locationTerm || selectedDepartment !== 'Todos' || selectedContractType !== 'Todos' || selectedWorkMode !== 'Todos') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setLocationTerm('');
                    setSelectedDepartment('Todos');
                    setSelectedContractType('Todos');
                    setSelectedWorkMode('Todos');
                  }}
                  className="text-[#2563EB] hover:underline cursor-pointer"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#E5E7EB] shadow-2xs space-y-3">
                <Briefcase className="w-12 h-12 text-[#64748B] mx-auto opacity-50" />
                <h3 className="text-base font-bold text-[#1E293B]">Nenhum registro encontrado</h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Tente alterar os termos de busca ou cadastrar seu currículo no nosso Banco Geral de Talentos.
                </p>
                <button
                  onClick={onOpenCandidateModal}
                  className="mt-2 px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl"
                >
                  Cadastrar currículo para oportunidades
                </button>
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`bg-white rounded-2xl p-6 border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-[#2563EB] ring-2 ring-blue-100 shadow-xs' 
                        : 'border-[#E5E7EB] hover:border-blue-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        {job.featured && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 mb-2">
                            ★ Vaga em Destaque
                          </span>
                        )}
                        <h3 className="text-base font-bold text-[#1E293B] group-hover:text-[#2563EB] transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-xs font-semibold text-[#2563EB] flex items-center gap-2 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                          {job.companyName}
                          <span>•</span>
                          <span className="text-[#64748B]">{job.department}</span>
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#1E293B] bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-[#E5E7EB]">
                        {job.code}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-medium text-[#1E293B]">
                      <span className="inline-flex items-center gap-1 bg-[#F8FAFC] px-2.5 py-1 rounded-md border border-[#E5E7EB]">
                        <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-[#F8FAFC] px-2.5 py-1 rounded-md border border-[#E5E7EB]">
                        <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" />
                        {job.workMode} ({job.contractType})
                      </span>
                      {job.salaryRange && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-md border border-emerald-200">
                          {job.salaryRange}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#64748B] mt-3 line-clamp-2 leading-relaxed font-normal">
                      {job.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B] font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                        Publicado em {formatFirestoreDate(job.publishedAt)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectJob(job);
                          setIsApplying(true);
                        }}
                        className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      >
                        Ver Vaga
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Detailed Job / Application Form Drawer (Right) */}
          <div className="lg:col-span-5">
            {selectedJob ? (
              <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs sticky top-24 space-y-5">
                
                {/* Header of selected job */}
                <div className="border-b border-[#E5E7EB] pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        {selectedJob.department}
                      </span>
                      <h3 className="text-xl font-bold text-[#1E293B] mt-2">{selectedJob.title}</h3>
                      <p className="text-xs font-medium text-[#64748B] mt-0.5">{selectedJob.companyName}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleShareJob(selectedJob)}
                        className="text-[#2563EB] hover:bg-blue-50 p-1.5 rounded-lg border border-blue-200 cursor-pointer text-xs font-bold flex items-center gap-1"
                        title="Compartilhar link desta vaga"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="text-[10px] text-emerald-600">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4" />
                            <span className="text-[10px]">Compartilhar</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          handleSelectJob(null);
                          setIsApplying(false);
                        }}
                        className="text-[#64748B] hover:text-[#1E293B] p-1.5 cursor-pointer rounded-lg hover:bg-slate-100"
                        title="Fechar detalhes"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E5E7EB]">
                      <span className="text-[#64748B] block text-[11px] font-medium">Localização</span>
                      <span className="font-bold text-[#1E293B]">{selectedJob.location}</span>
                    </div>
                    <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E5E7EB]">
                      <span className="text-[#64748B] block text-[11px] font-medium">Contrato & Modelo</span>
                      <span className="font-bold text-[#1E293B]">{selectedJob.contractType} ({selectedJob.workMode})</span>
                    </div>
                  </div>
                </div>

                {!isApplying ? (
                  <>
                    <div className="space-y-4 text-xs text-[#1E293B] leading-relaxed max-h-[380px] overflow-y-auto pr-1">
                      <div>
                        <h4 className="font-extrabold text-[#1E293B] mb-1 uppercase tracking-wider text-[11px]">
                          Descrição Completa
                        </h4>
                        <p className="text-[#64748B]">{selectedJob.description}</p>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-[#1E293B] mb-2 uppercase tracking-wider text-[11px]">
                          Requisitos Necessários
                        </h4>
                        <ul className="space-y-1.5 list-disc list-inside text-[#64748B]">
                          {selectedJob.requirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-[#1E293B] mb-2 uppercase tracking-wider text-[11px]">
                          Benefícios Oferecidos
                        </h4>
                        <ul className="space-y-1.5 list-disc list-inside text-[#64748B]">
                          {selectedJob.benefits.map((ben, idx) => (
                            <li key={idx}>{ben}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => setIsApplying(true)}
                        className="flex-1 py-3.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        Candidatar-se para esta Vaga
                      </button>
                    </div>
                  </>
                ) : (
                  /* Form Application */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                      <h4 className="font-extrabold text-[#1E293B] text-xs flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#2563EB]" />
                        Inscrição Direta
                      </h4>
                      <button
                        onClick={() => setIsApplying(false)}
                        className="text-xs text-[#2563EB] hover:underline font-bold cursor-pointer"
                      >
                        Voltar aos Detalhes
                      </button>
                    </div>

                    {submittedSuccess ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                        <h5 className="font-bold text-emerald-950 text-base">Inscrição Confirmada!</h5>
                        <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                          Seu currículo foi cadastrado com sucesso para a vaga <strong className="text-emerald-950">{selectedJob.title}</strong>.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleFormSubmit} className="space-y-3">
                        {submitError && (
                          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                            {submitError}
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-bold text-[#1E293B] mb-1">Nome Completo *</label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Ex: João Santos"
                            className="w-full text-xs font-medium p-2 border border-[#E5E7EB] rounded-xl focus:border-[#2563EB] outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-[#1E293B] mb-1">E-mail *</label>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (submitError) setSubmitError('');
                              }}
                              placeholder="seu@email.com"
                              className="w-full text-xs font-medium p-2 border border-[#E5E7EB] rounded-xl focus:border-[#2563EB] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#1E293B] mb-1">Telefone / WhatsApp *</label>
                            <input
                              type="tel"
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="(11) 99999-9999"
                              className="w-full text-xs font-medium p-2 border border-[#E5E7EB] rounded-xl focus:border-[#2563EB] outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-[#1E293B] mb-1">Cidade e UF *</label>
                            <input
                              type="text"
                              required
                              value={cityState}
                              onChange={(e) => setCityState(e.target.value)}
                              placeholder="São Paulo, SP"
                              className="w-full text-xs font-medium p-2 border border-[#E5E7EB] rounded-xl focus:border-[#2563EB] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#1E293B] mb-1">Pretensão Salarial</label>
                            <input
                              type="text"
                              value={salaryExpectation}
                              onChange={(e) => setSalaryExpectation(e.target.value)}
                              placeholder="Ex: R$ 6.000"
                              className="w-full text-xs font-medium p-2 border border-[#E5E7EB] rounded-xl focus:border-[#2563EB] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#1E293B] mb-1">Anexar Currículo (PDF/DOCX) *</label>
                          <div className="border border-dashed border-blue-200 bg-blue-50/50 p-3 rounded-xl text-center">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => {
                                setResumeFile(e.target.files?.[0] || null);
                                if (submitError) setSubmitError('');
                              }}
                              className="hidden"
                              id="job-portal-file"
                            />
                            <label htmlFor="job-portal-file" className="cursor-pointer text-xs font-bold text-[#2563EB] block">
                              {resumeFile ? decodedResumeFileName : 'Clique para selecionar o arquivo PDF/DOCX'}
                            </label>
                          </div>
                        </div>

                        <div className="pt-1">
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              required
                              checked={lgpdConsent}
                              onChange={(e) => setLgpdConsent(e.target.checked)}
                              className="mt-0.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                            />
                            <span className="text-[11px] text-[#64748B] leading-tight font-medium">
                              Concordo com o tratamento dos meus dados pessoais para esta candidatura conforme a <strong className="text-[#1E293B]">LGPD</strong> e a Política de Privacidade.
                            </span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={!lgpdConsent || isSubmitting}
                          className={`w-full py-3 text-white font-bold rounded-xl shadow-2xs transition-all text-xs flex items-center justify-center gap-2 cursor-pointer ${
                            lgpdConsent && !isSubmitting ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'
                          }`}
                        >
                          <Send className="w-4 h-4" />
                          {isSubmitting ? 'Enviando inscrição...' : 'Confirmar Inscrição'}
                        </button>
                      </form>
                    )}
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] text-center sticky top-24 space-y-2 shadow-2xs">
                <Briefcase className="w-10 h-10 text-[#2563EB] mx-auto opacity-70" />
                <h4 className="text-sm font-bold text-[#1E293B]">Selecione uma vaga da lista</h4>
                <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                  Clique na vaga desejada ao lado para ver a descrição detalhada, requisitos e enviar sua candidatura.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};
