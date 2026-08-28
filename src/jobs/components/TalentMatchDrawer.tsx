import React, { useState } from 'react';
import { AlertCircle, Briefcase, CheckCircle2, FileText, Loader2, MapPin, RefreshCw, Sparkles, UserRound, X } from 'lucide-react';
import { Job } from '../types/job';
import { TalentMatchResult } from '../../recruitment-core/services/talentMatchService';

interface TalentMatchDrawerProps {
  job: Job;
  matches: TalentMatchResult[];
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onRefresh: () => void;
  onAnalyze: (match: TalentMatchResult) => void;
  onLink: (match: TalentMatchResult) => Promise<void>;
}

export const TalentMatchDrawer: React.FC<TalentMatchDrawerProps> = ({
  job, matches, loading, error, onClose, onRefresh, onAnalyze, onLink,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const handleLink = async (match: TalentMatchResult) => {
    setLinkingId(match.candidateId);
    try { await onLink(match); } finally { setLinkingId(null); }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-xs flex justify-end" role="dialog" aria-modal="true" aria-label="Match com Banco de Talentos">
      <div className="w-full max-w-3xl h-full bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="bg-white border-b border-slate-200 px-5 sm:px-7 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center"><Sparkles className="w-5 h-5" /></span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">✨ MATCH COM BANCO DE TALENTOS</h2>
                <p className="text-xs text-slate-500 font-medium">{job.title || job.titulo}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">Candidatos do seu banco de talentos com maior aderência para esta vaga.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 sm:px-7 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-500">{matches.length} candidato(s) compatível(is)</span>
          <button onClick={onRefresh} disabled={loading} className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-black flex items-center gap-1.5 disabled:opacity-60">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> ↻ Atualizar matches
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4">
          {error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}
          {loading && matches.length === 0 ? (
            <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /><p className="text-xs font-bold text-slate-500 mt-3">Comparando dados reais da vaga e do Banco de Talentos...</p></div>
          ) : matches.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 py-16 px-6 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-black text-slate-800 mt-3">Nenhum candidato compatível encontrado no Banco de Talentos.</h3>
            </div>
          ) : matches.map(match => {
            const candidate = match.candidate;
            const expanded = expandedId === match.candidateId;
            return (
              <article key={match.candidateId} className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0"><UserRound className="w-6 h-6" /></div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-slate-900 truncate">{candidate.name}</h3>
                      <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-1"><Briefcase className="w-3.5 h-3.5" /> {candidate.role || 'Cargo não informado'}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {candidate.location || 'Localização não informada'} · Banco de Talentos</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-2 text-center shrink-0">
                    <span className="text-xl font-black text-indigo-700">{match.score}%</span>
                    <span className="block text-[10px] uppercase font-black text-indigo-600">Match</span>
                    {match.provider && match.provider !== 'objective' && <span className="text-[9px] font-bold text-slate-500">{match.provider === 'openai' ? 'ChatGPT' : 'Gemini'}</span>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 p-3">
                    <h4 className="font-black text-emerald-800 mb-2">Pontos fortes</h4>
                    {match.strengths.length ? <ul className="space-y-1.5">{match.strengths.map(item => <li key={item} className="flex gap-1.5 text-slate-700"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />{item}</li>)}</ul> : <p className="text-slate-500">Nenhum ponto forte confirmado nos dados atuais.</p>}
                  </div>
                  <div className="rounded-2xl bg-amber-50/70 border border-amber-100 p-3">
                    <h4 className="font-black text-amber-800 mb-2">Pontos de atenção</h4>
                    {match.attentionPoints.length ? <ul className="space-y-1.5">{match.attentionPoints.map(item => <li key={item} className="flex gap-1.5 text-slate-700"><AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />{item}</li>)}</ul> : <p className="text-slate-500">Nenhum ponto de atenção identificado.</p>}
                  </div>
                </div>

                {expanded && (
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs grid sm:grid-cols-2 gap-2">
                    <p><strong>E-mail:</strong> {candidate.email || 'Não informado'}</p>
                    <p><strong>Telefone:</strong> {candidate.phone || 'Não informado'}</p>
                    <p><strong>Experiência:</strong> {candidate.experienceYears || 0} ano(s)</p>
                    <p><strong>Pretensão:</strong> {candidate.salaryExpectation || 'Não informada'}</p>
                    <p className="sm:col-span-2"><strong>Competências:</strong> {(candidate.skills || []).join(', ') || 'Não informadas'}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <button onClick={() => setExpandedId(expanded ? null : match.candidateId)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-black hover:bg-slate-50">Ver perfil</button>
                  <button onClick={() => onAnalyze(match)} disabled={loading} className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-black hover:bg-indigo-100 disabled:opacity-60">✨ Analisar com IA</button>
                  <button onClick={() => handleLink(match)} disabled={match.alreadyLinked || linkingId === match.candidateId} className="sm:ml-auto px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 disabled:bg-emerald-100 disabled:text-emerald-800">
                    {linkingId === match.candidateId ? 'Vinculando...' : match.alreadyLinked ? '✓ Já vinculado' : '🔗 Vincular à vaga'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

