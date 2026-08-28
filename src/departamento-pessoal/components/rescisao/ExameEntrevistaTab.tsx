import React, { useState } from 'react';
import { 
  Stethoscope, 
  MessageSquare, 
  UserCheck, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Upload,
  Save
} from 'lucide-react';
import { 
  ProcessoRescisaoCompleto, 
  ExameAsoDemissional, 
  EntrevistaDesligamento, 
  DadoElegibilidadeRehire 
} from '../../types/terminationTypes';

interface ExameEntrevistaTabProps {
  process: ProcessoRescisaoCompleto;
  onUpdateMedicalExam: (exam: ExameAsoDemissional) => void;
  onSaveExitInterview: (interview: EntrevistaDesligamento) => void;
  onSaveRehireInfo: (info: DadoElegibilidadeRehire) => void;
}

export const ExameEntrevistaTab: React.FC<ExameEntrevistaTabProps> = ({
  process,
  onUpdateMedicalExam,
  onSaveExitInterview,
  onSaveRehireInfo
}) => {
  // ASO State
  const [examResult, setExamResult] = useState<'Apto' | 'Inapto' | 'Pendente'>(
    process.medicalExam?.result || 'Pendente'
  );
  const [clinicName, setClinicName] = useState(process.medicalExam?.clinicName || '');
  const [doctorName, setDoctorName] = useState(process.medicalExam?.doctorName || '');
  const [doctorCrm, setDoctorCrm] = useState(process.medicalExam?.doctorCrm || '');
  const [examDate, setExamDate] = useState(process.medicalExam?.examDate || new Date().toISOString().split('T')[0]);

  // Exit Interview State
  const [reasonForLeaving, setReasonForLeaving] = useState(
    process.exitInterview?.reasonForLeaving || 'Busca por novas oportunidades profissionais.'
  );
  const [leadershipRating, setLeadershipRating] = useState(process.exitInterview?.leadershipRating || 4);
  const [environmentRating, setEnvironmentRating] = useState(process.exitInterview?.environmentRating || 4);
  const [compensationRating, setCompensationRating] = useState(process.exitInterview?.compensationRating || 3);
  const [cultureRating, setCultureRating] = useState(process.exitInterview?.cultureRating || 4);
  const [growthRating, setGrowthRating] = useState(process.exitInterview?.growthRating || 3);
  const [wouldRecommend, setWouldRecommend] = useState(process.exitInterview?.wouldRecommend ?? true);
  const [wouldReturn, setWouldReturn] = useState(process.exitInterview?.wouldReturn ?? true);
  const [openFeedback, setOpenFeedback] = useState(process.exitInterview?.openFeedback || '');

  // Rehire State
  const [rehireEligibility, setRehireEligibility] = useState<any>(
    process.rehireInfo?.rehireEligibility || 'Elegível'
  );
  const [rehireReason, setRehireReason] = useState(process.rehireInfo?.rehireReason || '');

  const handleSaveAso = () => {
    onUpdateMedicalExam({
      needsExam: true,
      clinicName,
      doctorName,
      doctorCrm,
      examDate,
      result: examResult
    });
    alert('Exame ASO Demissional atualizado!');
  };

  const handleSaveInterview = () => {
    const now = new Date().toISOString();
    const interviewData: EntrevistaDesligamento = {
      id: process.exitInterview?.id || `int-${Date.now()}`,
      companyId: process.companyId,
      terminationId: process.id,
      employeeId: process.employeeId,
      reasonForLeaving,
      leadershipRating,
      environmentRating,
      compensationRating,
      cultureRating,
      growthRating,
      wouldRecommend,
      wouldReturn,
      openFeedback,
      interviewerName: 'Analista RH',
      completedAt: now
    };

    onSaveExitInterview(interviewData);
    alert('Entrevista de Desligamento salva!');
  };

  const handleSaveRehire = () => {
    onSaveRehireInfo({
      rehireEligibility,
      rehireReason,
      approvedBy: 'Gestor RH',
      approvedAt: new Date().toISOString()
    });
    alert('Dados de Elegibilidade para Recontratação salvos!');
  };

  return (
    <div className="space-y-6">
      {/* 1. Exame Médico Demissional (ASO) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-rose-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Exame Médico Demissional (ASO)</h3>
              <p className="text-xs text-slate-500">Exigência legal conforme NR-7 e eSocial S-2220</p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            examResult === 'Apto' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : examResult === 'Inapto' 
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            ASO Status: {examResult}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Resultado do ASO *</label>
            <select
              value={examResult}
              onChange={e => setExamResult(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="Pendente">Pendente de Realização</option>
              <option value="Apto">Apto para Desligamento</option>
              <option value="Inapto">Inapto (Afastamento suspenso)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Data do Exame</label>
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Clínica Credenciada</label>
            <input
              type="text"
              value={clinicName}
              onChange={e => setClinicName(e.target.value)}
              placeholder="Ex: Medicina do Trabalho SP"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Médico Examinador</label>
            <input
              type="text"
              value={doctorName}
              onChange={e => setDoctorName(e.target.value)}
              placeholder="Ex: Dr. Carlos Silva"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">CRM do Médico</label>
            <input
              type="text"
              value={doctorCrm}
              onChange={e => setDoctorCrm(e.target.value)}
              placeholder="Ex: CRM/SP 123456"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSaveAso}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Dados ASO</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Entrevista de Desligamento */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <MessageSquare className="w-5 h-5 text-rose-600" />
          <div>
            <h3 className="font-bold text-sm text-slate-900">Entrevista de Desligamento & Feedbacks</h3>
            <p className="text-xs text-slate-500">Avaliação do ambiente de trabalho, liderança e cultura corporativa</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Motivo Principal Declarado pelo Colaborador</label>
            <textarea
              rows={2}
              value={reasonForLeaving}
              onChange={e => setReasonForLeaving(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          {/* Ratings Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px]">
            <div>
              <span className="font-bold text-slate-700 block mb-1">Liderança:</span>
              <select
                value={leadershipRating}
                onChange={e => setLeadershipRating(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold"
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Ambiente:</span>
              <select
                value={environmentRating}
                onChange={e => setEnvironmentRating(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold"
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Remuneração:</span>
              <select
                value={compensationRating}
                onChange={e => setCompensationRating(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold"
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Cultura:</span>
              <select
                value={cultureRating}
                onChange={e => setCultureRating(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold"
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Crescimento:</span>
              <select
                value={growthRating}
                onChange={e => setGrowthRating(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold"
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Comentários Abertos / Sugestões do Colaborador</label>
            <textarea
              rows={2}
              value={openFeedback}
              onChange={e => setOpenFeedback(e.target.value)}
              placeholder="Principais pontos fortes e áreas de melhoria apontados na conversa..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveInterview}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Entrevista de Desligamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Elegibilidade para Recontratação */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserCheck className="w-5 h-5 text-rose-600" />
          <div>
            <h3 className="font-bold text-sm text-slate-900">Elegibilidade para Recontratação (Rehire)</h3>
            <p className="text-xs text-slate-500">Classificação para banco de ex-colaboradores e seleções futuras</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Status de Recontratação</label>
            <select
              value={rehireEligibility}
              onChange={e => setRehireEligibility(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="Elegível">Elegível para Recontratação</option>
              <option value="Não elegível">Não Elegível</option>
              <option value="Condicionado">Condicionado à Aprovação de Diretoria</option>
              <option value="Não avaliado">Não Avaliado</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">Motivo / Parecer Técnico</label>
            <input
              type="text"
              value={rehireReason}
              onChange={e => setRehireReason(e.target.value)}
              placeholder="Ex: Excelente desempenho e bom relacionamento interpessoal..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveRehire}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Elegibilidade Rehire</span>
          </button>
        </div>
      </div>
    </div>
  );
};
