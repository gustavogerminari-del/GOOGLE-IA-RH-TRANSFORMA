import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, Copy, Plus, AlertCircle, Wand2 } from 'lucide-react';
import { JobAiGenerationResult } from '../types';
import { useAuth } from '../../auth';
import { getCompanyId } from '../../auth/profile';
import { AIService } from '../services/centralAiService';

interface JobGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGeneratedJob?: (jobData: JobAiGenerationResult) => void;
}

export const JobGeneratorModal: React.FC<JobGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyGeneratedJob,
}) => {
  const { user } = useAuth();
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState('Tecnologia & Engenharia');
  const [nivel, setNivel] = useState('Pleno');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JobAiGenerationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiError, setAiError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setAiError('');
    try {
      const companyId = getCompanyId(user);
      if (!companyId) throw new Error('Empresa não identificada para utilizar a IA.');
      const data = await AIService.execute<JobAiGenerationResult>('gerar_descricao_vaga', companyId, { cargo, departamento, nivel, prompt });
      const raw = ((data as any)?.data || data || {}) as any;
      const normalizedResult = {
        ...raw,
        title: String(raw.title || raw.titulo || cargo || ''),
        summary: String(raw.summary || raw.description || raw.descricao || ''),
        responsibilities: Array.isArray(raw.responsibilities)
          ? raw.responsibilities
          : Array.isArray(raw.responsabilidades) ? raw.responsabilidades : [],
        requirements: Array.isArray(raw.requirements)
          ? raw.requirements
          : Array.isArray(raw.requisitos) ? raw.requisitos : [],
        benefits: Array.isArray(raw.benefits)
          ? raw.benefits
          : Array.isArray(raw.beneficios) ? raw.beneficios : [],
        schemaMarker: 'RH_JOB_GENERATOR_SAFE_RESULT_V1',
      } as JobAiGenerationResult;
      setResult(normalizedResult);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Não foi possível concluir a análise por IA no momento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result && onApplyGeneratedJob) {
      onApplyGeneratedJob(result);
      onClose();
    }
  };

  const handleCopyText = () => {
    if (!result) return;
    const text = `TITULO: ${result.title}\n\nRESUMO:\n${result.summary}\n\nRESPONSABILIDADES:\n${(result.responsibilities || []).map(r => `• ${r}`).join('\n')}\n\nREQUISITOS:\n${(result.requirements || []).map(r => `• ${r}`).join('\n')}\n\nBENEFÍCIOS:\n${(result.benefits || []).map(b => `• ${b}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Gerador Inteligente de Vagas IA</h2>
              <p className="text-xs text-emerald-100 font-medium">
                Crie descrições completas e atrativas com a inteligência do RH TRANSFORMA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>
        {aiError && <div role="alert" className="mx-6 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{aiError}</div>}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Preset options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cargo Desejado</label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Vendedor Interno, Dev Senior..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Área / Departamento</label>
              <select
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="Comercial & Vendas">Comercial & Vendas</option>
                <option value="Tecnologia & Engenharia">Tecnologia & Engenharia</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Marketing & Comunicação">Marketing & Comunicação</option>
                <option value="Financeiro & Contábil">Financeiro & Contábil</option>
                <option value="Operações & Logística">Operações & Logística</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Senioridade</label>
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="Estágio / Trainee">Estágio / Trainee</option>
                <option value="Júnior">Júnior</option>
                <option value="Pleno">Pleno</option>
                <option value="Sênior">Sênior</option>
                <option value="Especialista / Lead">Especialista / Lead</option>
                <option value="Gerência / Executivo">Gerência / Executivo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Instruções Adicionais (Opcional)
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Vaga urgente para filiais de SP e RJ, foco em prospecção B2B e perfil consultivo..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando com IA...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-amber-300" />
                  <span>Gerar Descrição de Vaga</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Result */}
          {result && (
            <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-extrabold text-slate-800 text-sm">Resultado Gerado com Sucesso</span>
                </div>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">{result.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{result.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                    Responsabilidades
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {(result.responsibilities || []).map((r, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                    Requisitos
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {(result.requirements || []).map((req, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-teal-500 font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                    Benefícios
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {(result.benefits || []).map((b, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle className="w-4 h-4 text-emerald-600" />
            <span>Você poderá revisar todas as informações antes de publicar.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100"
            >
              Cancelar
            </button>
            {result && onApplyGeneratedJob && (
              <button
                onClick={handleApply}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Utilizar Esta Vaga</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
