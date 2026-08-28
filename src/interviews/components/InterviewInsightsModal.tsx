import React, { useEffect, useState } from 'react';
import { Brain, CheckCircle2, ExternalLink, FileText, RefreshCw, ShieldAlert, Video, X } from 'lucide-react';
import { GoogleWorkspaceService } from '../../services/GoogleWorkspaceService';
import { Interview } from '../types/interview';

interface InterviewInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview | null;
  companyId: string;
  onInterviewUpdate?: (interview: Interview) => void;
}

export const InterviewInsightsModal: React.FC<InterviewInsightsModalProps> = ({ isOpen, onClose, interview, companyId, onInterviewUpdate }) => {
  const [transcript, setTranscript] = useState<any>(null);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [agreement, setAgreement] = useState<'Concordo com a IA' | 'Concordo parcialmente' | 'Discordo'>('Concordo parcialmente');
  const [comment, setComment] = useState('');

  const load = async () => {
    if (!interview || !companyId) return;
    setLoading(true);
    try {
      const [artifacts, diagnosis] = await Promise.all([
        GoogleWorkspaceService.getArtifacts(companyId, interview.id),
        GoogleWorkspaceService.getDiagnostic(companyId, interview.id),
      ]);
      setTranscript(artifacts.transcript || null);
      setDiagnostic(diagnosis.diagnostic || null);
      if (diagnosis.diagnostic?.recruiterReview) {
        setAgreement(diagnosis.diagnostic.recruiterReview.agreement || 'Concordo parcialmente');
        setComment(diagnosis.diagnostic.recruiterReview.comment || '');
      }
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'Não foi possível carregar os dados da entrevista.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) void load(); }, [isOpen, interview?.id, companyId]);
  if (!isOpen || !interview) return null;

  const run = async (kind: 'sync' | 'diagnosis' | 'reprocess' | 'review') => {
    setAction(kind);
    setFeedback(null);
    try {
      if (kind === 'sync') {
        const result = await GoogleWorkspaceService.syncArtifacts(companyId, interview.id);
        setTranscript(result.transcript || null);
        if (result.interview) onInterviewUpdate?.(result.interview);
        setFeedback({ type: 'success', message: result.conferenceFound ? 'Gravação, transcrição e participantes sincronizados.' : result.message });
        if (result.transcript && interview.aiAnalysisEnabled) {
          const aiResult = await GoogleWorkspaceService.generateDiagnostic(companyId, interview.id);
          setDiagnostic(aiResult.diagnostic);
          setFeedback({ type: 'success', message: 'Transcrição sincronizada e diagnóstico IA gerado.' });
        }
      } else if (kind === 'diagnosis' || kind === 'reprocess') {
        const result = await GoogleWorkspaceService.generateDiagnostic(companyId, interview.id, kind === 'reprocess');
        setDiagnostic(result.diagnostic);
        setFeedback({ type: 'success', message: kind === 'reprocess' ? 'Diagnóstico IA reprocessado.' : 'Diagnóstico IA gerado.' });
      } else {
        const result = await GoogleWorkspaceService.reviewDiagnostic(companyId, interview.id, {
          agreement, comment, validationPoints: diagnostic?.validationPoints || [],
        });
        setDiagnostic(result.diagnostic);
        setFeedback({ type: 'success', message: result.message });
      }
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'A operação não pôde ser concluída.' });
    } finally {
      setAction('');
    }
  };

  const updateValidation = (id: string, reviewStatus: 'validated' | 'ignored') => {
    setDiagnostic((current: any) => ({
      ...current,
      validationPoints: (current?.validationPoints || []).map((point: any) => point.id === id ? { ...point, reviewStatus } : point),
    }));
  };

  const updateValidationComment = (id: string, recruiterComment: string) => {
    setDiagnostic((current: any) => ({
      ...current,
      validationPoints: (current?.validationPoints || []).map((point: any) => point.id === id ? { ...point, recruiterComment } : point),
    }));
  };

  const recommendationColor = diagnostic?.recommendation?.level === 'Boa aderência'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
    : diagnostic?.recommendation?.level === 'Baixa aderência aos requisitos apresentados'
      ? 'bg-rose-50 border-rose-200 text-rose-900'
      : 'bg-amber-50 border-amber-200 text-amber-900';

  return (
    <div className="fixed inset-0 z-[75] bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-50 rounded-3xl max-w-5xl w-full max-h-[94vh] overflow-y-auto shadow-2xl my-4">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 p-5 flex items-start justify-between gap-4 rounded-t-3xl">
          <div><p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Entrevistas & IA</p><h2 className="text-xl font-black text-slate-900">Diagnóstico da Entrevista</h2><p className="text-xs text-slate-500">{interview.candidateName} • {interview.jobTitle}</p></div>
          <button type="button" onClick={onClose} className="p-2 rounded-full bg-slate-100 text-slate-500" aria-label="Fechar"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          {feedback && <div role="status" className={`rounded-xl border p-3 text-xs font-semibold ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>{feedback.message}</div>}
          {loading ? <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">Carregando dados seguros da entrevista...</div> : (
            <>
              <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-black text-slate-900 flex items-center gap-2"><Video className="w-4 h-4 text-blue-600" /> Artefatos do Google Meet</h3><button type="button" disabled={Boolean(action)} onClick={() => run('sync')} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"><RefreshCw className={`w-3.5 h-3.5 ${action === 'sync' ? 'animate-spin' : ''}`} /> Sincronizar agora</button></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl"><span className="block text-[10px] uppercase text-slate-400 font-bold">Gravação</span><strong>{interview.recordingAvailable ? 'Disponível' : interview.recordingEnabled ? 'Aguardando Google' : 'Não solicitada'}</strong>{transcript?.googleRecordingUrl && <a className="block mt-1 text-blue-600 font-bold" href={transcript.googleRecordingUrl} target="_blank" rel="noreferrer">Abrir gravação <ExternalLink className="inline w-3 h-3" /></a>}</div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl"><span className="block text-[10px] uppercase text-slate-400 font-bold">Transcrição</span><strong>{transcript?.googleTranscriptName ? 'Disponível' : interview.transcriptionEnabled ? 'Aguardando Google' : 'Não solicitada'}</strong>{transcript?.googleDocumentUrl && <a className="block mt-1 text-blue-600 font-bold" href={transcript.googleDocumentUrl} target="_blank" rel="noreferrer">Abrir documento <ExternalLink className="inline w-3 h-3" /></a>}</div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl"><span className="block text-[10px] uppercase text-slate-400 font-bold">Participantes</span><strong>{interview.participantCount ?? 'Aguardando sincronização'}</strong></div>
                </div>
              </section>

              {transcript && <details className="bg-white rounded-2xl border border-slate-200 p-4"><summary className="cursor-pointer font-black text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" /> Ver Transcrição ({transcript.entryCount || transcript.entries?.length || 0} falas)</summary><div className="mt-4 max-h-72 overflow-y-auto space-y-2">{(transcript.entries || []).map((entry: any) => <div key={entry.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs"><strong className="text-indigo-700">{entry.speaker}</strong><p className="text-slate-700 mt-1 leading-relaxed">{entry.text}</p></div>)}</div></details>}

              {!diagnostic ? (
                <section className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-3"><Brain className="w-9 h-9 text-indigo-300 mx-auto" /><h3 className="font-black text-slate-900">Diagnóstico IA ainda não gerado</h3><p className="text-xs text-slate-500">A análise só utiliza a transcrição oficial, a vaga e o cadastro profissional do candidato.</p><button type="button" disabled={!transcript || Boolean(action)} onClick={() => run('diagnosis')} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-50">Gerar Diagnóstico IA</button></section>
              ) : (
                <section className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4"><span className="text-[10px] uppercase font-bold text-slate-400">Aderência geral</span><p className="text-3xl font-black text-indigo-700">{diagnostic.adherence?.score || 0}%</p></div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4"><span className="text-[10px] uppercase font-bold text-slate-400">Conhecimento técnico</span><p className="text-sm font-black text-slate-900 mt-2">{diagnostic.technicalKnowledge?.classification}</p></div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4"><span className="text-[10px] uppercase font-bold text-slate-400">Consistência</span><p className="text-sm font-black text-slate-900 mt-2">{diagnostic.informationConsistency?.filter((item: any) => item.result === 'Informação consistente').length || 0} evidência(s)</p></div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4"><span className="text-[10px] uppercase font-bold text-slate-400">Pontos para validação</span><p className="text-3xl font-black text-amber-700">{diagnostic.validationPoints?.length || 0}</p></div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2"><h3 className="font-black">Resumo da entrevista</h3><p className="text-sm text-slate-700 leading-relaxed">{diagnostic.summary}</p><p className="text-xs text-slate-600"><strong>Justificativa da aderência:</strong> {diagnostic.adherence?.explanation}</p></div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4"><span className="text-[10px] uppercase font-bold text-slate-400">Pretensão salarial</span><p className="text-sm font-bold mt-1">{diagnostic.salaryExpectation}</p></div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4"><span className="text-[10px] uppercase font-bold text-slate-400">Disponibilidade</span><p className="text-sm font-bold mt-1">{diagnostic.availability}</p></div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4"><span className="text-[10px] uppercase font-bold text-slate-400">Motivação profissional</span><p className="text-sm font-bold mt-1">{diagnostic.professionalMotivation}</p></div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"><h3 className="font-black">Comparação com a vaga</h3>{(diagnostic.adherence?.criteria || []).map((criterion: any, index: number) => <div key={`${criterion.requirement}-${index}`} className="p-3 bg-slate-50 rounded-xl text-xs"><strong>{criterion.requirement}</strong><p className="text-indigo-700 font-bold">{criterion.result}</p><p className="text-slate-600 mt-1">{criterion.evidence}</p></div>)}</div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"><h3 className="font-black">Competências comportamentais observáveis</h3>{(diagnostic.behavioralCompetencies || []).map((item: any, index: number) => <div key={`${item.competency}-${index}`} className="text-xs border-b border-slate-100 pb-2"><strong>{item.competency}: {item.classification}</strong><p className="text-slate-600">{item.evidence}</p></div>)}</div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2"><h3 className="font-black">Experiência profissional</h3><p className="text-sm font-bold">{diagnostic.professionalExperience?.result}</p>{(diagnostic.professionalExperience?.evidence || []).map((item: string, index: number) => <p key={index} className="text-xs text-slate-600">• {item}</p>)}</div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2"><h3 className="font-black">Conhecimento técnico</h3><p className="text-sm font-bold">{diagnostic.technicalKnowledge?.classification}</p><p className="text-xs text-slate-600">{diagnostic.technicalKnowledge?.explanation}</p>{(diagnostic.technicalKnowledge?.evidence || []).map((item: string, index: number) => <p key={index} className="text-xs text-slate-600">• {item}</p>)}</div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"><h3 className="font-black">Consistência das Informações</h3>{(diagnostic.informationConsistency || []).map((item: any, index: number) => <div key={index} className="p-3 bg-slate-50 rounded-xl text-xs"><strong>{item.source}</strong><p>{item.interviewEvidence}</p><p className="font-bold text-indigo-700">{item.result}</p></div>)}</div>

                  <div className="bg-white border border-amber-200 rounded-2xl p-5 space-y-3"><h3 className="font-black text-amber-950">Pontos para Validação</h3>{(diagnostic.validationPoints || []).map((point: any) => <div key={point.id} className="p-3 bg-amber-50 rounded-xl text-xs"><strong>{point.title}</strong><p className="text-slate-700">{point.description}</p><p className="text-slate-500 mt-1">Evidência: {point.evidence}</p><textarea value={point.recruiterComment || ''} onChange={event => updateValidationComment(point.id, event.target.value)} rows={2} placeholder="Comentário do recrutador sobre este ponto" className="w-full mt-2 border border-amber-200 bg-white rounded-lg p-2" /><div className="flex gap-2 mt-2"><button type="button" onClick={() => updateValidation(point.id, 'validated')} className={`px-2 py-1 rounded-lg font-bold ${point.reviewStatus === 'validated' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>Marcar validado</button><button type="button" onClick={() => updateValidation(point.id, 'ignored')} className={`px-2 py-1 rounded-lg font-bold ${point.reviewStatus === 'ignored' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>Ignorar</button></div></div>)}</div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div className="bg-white border border-slate-200 rounded-2xl p-5"><h3 className="font-black mb-2">Pontos fortes</h3><ul className="list-disc pl-5 text-xs space-y-1 text-slate-700">{(diagnostic.strengths || []).map((item: string) => <li key={item}>{item}</li>)}</ul></div><div className="bg-white border border-slate-200 rounded-2xl p-5"><h3 className="font-black mb-2">Pontos de atenção</h3><ul className="list-disc pl-5 text-xs space-y-1 text-slate-700">{(diagnostic.attentionPoints || []).map((item: string) => <li key={item}>{item}</li>)}</ul></div></div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2"><h3 className="font-black">Segurança percebida nas respostas</h3><p className="text-sm font-bold">{diagnostic.responseConfidence?.level}</p><p className="text-xs text-slate-700">{diagnostic.responseConfidence?.observation}</p><div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600"><ShieldAlert className="w-4 h-4 shrink-0" />{diagnostic.responseConfidence?.disclaimer || 'Hesitação pode ocorrer por diferentes motivos e não comprova mentira.'}</div></div>

                  {(diagnostic.suggestedQuestions || []).length > 0 && <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5"><h3 className="font-black text-indigo-950 mb-2">Sugestões de aprofundamento</h3><ol className="list-decimal pl-5 text-xs space-y-2 text-indigo-900">{diagnostic.suggestedQuestions.map((item: string, index: number) => <li key={index}>{item}</li>)}</ol></div>}

                  <div className={`rounded-2xl border p-5 ${recommendationColor}`}><h3 className="font-black">Recomendação da IA: {diagnostic.recommendation?.level}</h3><p className="text-xs mt-2">{diagnostic.recommendation?.justification}</p><p className="text-[10px] mt-3 font-bold">A decisão final permanece exclusivamente com o recrutador.</p></div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"><h3 className="font-black">Avaliação do recrutador</h3><div className="flex flex-wrap gap-2">{(['Concordo com a IA', 'Concordo parcialmente', 'Discordo'] as const).map(value => <button key={value} type="button" onClick={() => setAgreement(value)} className={`px-3 py-2 rounded-xl text-xs font-bold border ${agreement === value ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-700'}`}>{value}</button>)}</div><textarea value={comment} onChange={event => setComment(event.target.value)} rows={3} placeholder="Comentário do recrutador" className="w-full border border-slate-200 rounded-xl p-3 text-xs" /><div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={Boolean(action)} onClick={() => run('reprocess')} className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold">Reprocessar diagnóstico</button><button type="button" disabled={Boolean(action)} onClick={() => run('review')} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Salvar avaliação</button></div></div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
