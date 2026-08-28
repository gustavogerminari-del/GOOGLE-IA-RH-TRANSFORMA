import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Award, 
  FileText,
  Bot,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { CandidateApplicationPayload } from './types';
import { Job } from '../types/rh';

interface CandidateResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs?: Job[];
  onSuccessSubmit: (payload: CandidateApplicationPayload) => Promise<void>;
}

export const CandidateResumeModal: React.FC<CandidateResumeModalProps> = ({
  isOpen,
  onClose,
  jobs = [],
  onSuccessSubmit
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cityState, setCityState] = useState('');
  const [interestArea, setInterestArea] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [courses, setCourses] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [lgpdConsent, setLgpdConsent] = useState(false);
  // RH_PUBLIC_TALENT_CONSENT_V1
  const [talentBankConsent, setTalentBankConsent] = useState(false);

  // AI Parsing Simulation State
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [parsedData, setParsedData] = useState<{
    extractedSkills: string[];
    seniority: string;
    score: number;
    summary: string;
  } | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      // O arquivo só é marcado como selecionado. Análise de IA só deve aparecer quando houver resultado real.
      setParsedData(null);
      setIsAiProcessing(false);
      setAiStep(0);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CandidateApplicationPayload = {
      submissionMode: selectedJobId ? 'application' : 'talent_bank',
      jobId: selectedJobId || undefined,
      fullName,
      email,
      phone,
      cityState,
      interestArea,
      experienceYears,
      educationLevel,
      courses,
      resumeFileName: resumeFile ? resumeFile.name : 'curriculo_candidato.pdf',
      resumeFile: resumeFile || undefined,
      coverNote,
      lgpdConsent,
      talentBankConsent,
    };

    try {
      setFormError('');
      await onSuccessSubmit(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível enviar o currículo.';
      setFormError(message);
      return;
    }
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setParsedData(null);
      setResumeFile(null);
      setFullName('');
      setEmail('');
      setPhone('');
      setCityState('');
      setCourses('');
      setCoverNote('');
      setLgpdConsent(false);
      setTalentBankConsent(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight">Cadastrar Currículo — RH TRANSFORMA IA</h3>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Gratuito
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Envie seu currículo e seja encontrado pelas melhores empresas do país.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {submitted ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-black text-slate-900">Currículo Cadastrado com Sucesso!</h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto font-medium leading-relaxed">
                {selectedJobId
                  ? 'Sua candidatura foi registrada com segurança para a empresa responsável pela vaga. O currículo não é compartilhado com outras empresas.'
                  : 'Seu currículo foi cadastrado com segurança no Banco de Talentos, sem criar candidatura ou vínculo com vaga.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold" role="alert">
                  {formError}
                </div>
              )}
              
              {/* Box upload + Leitura IA */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-slate-50 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-5 text-center transition-all relative">
                <input
                  type="file"
                  id="resume-modal-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="resume-modal-upload" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-indigo-950 block">
                      {resumeFile ? resumeFile.name : 'Clique para Anexar seu Currículo (PDF, DOC ou DOCX)'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      O RH TRANSFORMA IA fará a leitura e extração automática dos seus dados
                    </span>
                  </div>
                </label>

                {/* AI Loading State */}
                {isAiProcessing && (
                  <div className="mt-4 pt-4 border-t border-indigo-200/60 flex items-center justify-center gap-3 text-xs font-bold text-indigo-900 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>
                      {aiStep === 1 && 'Lendo estrutura e texto do documento...'}
                      {aiStep === 2 && 'Extraindo competências e experiências com RH TRANSFORMA IA...'}
                    </span>
                  </div>
                )}

                {/* AI Parsed Results Card */}
                {parsedData && !isAiProcessing && (
                  <div className="mt-4 pt-4 border-t border-indigo-200 text-left bg-white p-4 rounded-xl shadow-xs border border-indigo-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-indigo-600" />
                        Análise de Perfil Concluída
                      </span>
                      <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                        Score IA: {parsedData.score}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{parsedData.summary}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {parsedData.extractedSkills.map((sk, idx) => (
                        <span key={idx} className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Informações Pessoais */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                  1. Dados Pessoais & Contato
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ex: Carlos Eduardo Lima"
                        className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Principal *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="carlos@email.com"
                        className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 98888-7777"
                        className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cidade e Estado *</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={cityState}
                        onChange={(e) => setCityState(e.target.value)}
                        placeholder="São Paulo, SP"
                        className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trajetória & Qualificações */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                  2. Perfil Profissional
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Área de Interesse *</label>
                    <select
                      value={interestArea}
                      onChange={(e) => setInterestArea(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Recrutamento & Seleção">Recrutamento & Seleção</option>
                      <option value="Operações de RH / DP">Operações de RH / DP</option>
                      <option value="Tecnologia / TI">Tecnologia / TI</option>
                      <option value="Comercial / Vendas">Comercial / Vendas</option>
                      <option value="Financeiro / Contábil">Financeiro / Contábil</option>
                      <option value="Marketing / Comunicação">Marketing / Comunicação</option>
                      <option value="Administrativo">Administrativo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Anos de Experiência</label>
                    <select
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="1">Menos de 1 ano</option>
                      <option value="2">1 a 2 anos</option>
                      <option value="3">3 a 5 anos</option>
                      <option value="5">Mais de 5 anos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Escolaridade</label>
                    <select
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Ensino Médio">Ensino Médio</option>
                      <option value="Superior Incompleto">Superior Incompleto</option>
                      <option value="Superior Completo">Superior Completo</option>
                      <option value="Pós-Graduação">Pós-Graduação / MBA</option>
                      <option value="Mestrado">Mestrado / Doutorado</option>
                    </select>
                  </div>
                </div>

                {jobs.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Vincular a uma vaga específica (Opcional)</label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Banco Geral de Talentos (Sem vaga vinculada)</option>
                      {jobs.map(j => (
                        <option key={j.id} value={j.id}>{j.title} ({j.nomeEmpresa || j.companyName || 'RH TRANSFORMA'})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cursos & Certificações Extra</label>
                  <input
                    type="text"
                    value={courses}
                    onChange={(e) => setCourses(e.target.value)}
                    placeholder="Ex: Certificação RH Ágil, Inglês Avançado, Excel Avançado"
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Resumo das Suas Experiências</label>
                  <textarea
                    rows={2}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Conte resumidamente sobre seus principais resultados e objetivos profissionais..."
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required={!selectedJobId}
                      checked={talentBankConsent}
                      onChange={(e) => setTalentBankConsent(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed font-medium">
                      {selectedJobId
                        ? 'Também autorizo esta empresa a manter meu perfil no Banco de Talentos para futuras oportunidades. Esta autorização é opcional e separada da candidatura atual.'
                        : 'Autorizo esta empresa a manter meu perfil e currículo no Banco de Talentos para futuras oportunidades.'}
                    </span>
                  </label>
                  <p className="mt-2 pl-6 text-[11px] leading-relaxed text-slate-500">
                    Você poderá solicitar a exclusão dos seus dados conforme a Política de Privacidade e a LGPD.
                  </p>
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={lgpdConsent}
                      onChange={(e) => setLgpdConsent(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-600 leading-tight font-medium">
                      Estou ciente e concordo com a coleta e o processamento dos meus dados pessoais conforme a <strong className="text-slate-900">LGPD (Lei nº 13.709/2018)</strong> e a Política de Privacidade.
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!lgpdConsent || (!selectedJobId && !talentBankConsent)}
                  className={`px-6 py-3 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                    (lgpdConsent && (selectedJobId || talentBankConsent))
                      ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 hover:from-amber-600 hover:to-indigo-800 text-white shadow-indigo-500/20' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>Enviar currículo com segurança</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
