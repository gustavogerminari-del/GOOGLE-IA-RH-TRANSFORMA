import React, { useState } from 'react';
import { 
  Palmtree, 
  HeartHandshake, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  PlusCircle, 
  UserCheck, 
  CreditCard, 
  ShieldCheck, 
  Bell, 
  FileCheck,
  Search,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { LeaveRequest, EmployeeLeaveBalance, BenefitItem } from './types';
import { BenefitService } from '../services/BenefitService';
import { ContextualAiModal } from '../ai/components/ContextualAiModal';
import { vacationAiService, benefitsAiService } from '../ai/services/aiService';

export const BenefitsLeavesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'solicitacoes' | 'saldos' | 'beneficios'>('solicitacoes');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<EmployeeLeaveBalance[]>([]);
  const [benefits, setBenefits] = useState<BenefitItem[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Modal states
  const [aiModalConfig, setAiModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    onExecute: () => Promise<any>;
  }>({ isOpen: false, title: '', subtitle: '', onExecute: async () => ({}) });

  // New Leave Request Modal State
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [reqEmployeeName, setReqEmployeeName] = useState('');
  const [reqDepartment, setReqDepartment] = useState('Operações de RH');
  const [reqType, setReqType] = useState<LeaveRequest['type']>('Férias Regulamentares');
  const [reqStartDate, setReqStartDate] = useState('');
  const [reqEndDate, setReqEndDate] = useState('');
  const [reqNotes, setReqNotes] = useState('');

  React.useEffect(() => {
    let isMounted = true;
    Promise.all([
      BenefitService.listLeaveRequests(),
      BenefitService.list()
    ]).then(([leaves, bens]) => {
      if (isMounted) {
        setLeaveRequests(leaves || []);
        setBenefits(bens || []);
        setLoading(false);
      }
    }).catch(err => {
      console.warn('Erro ao carregar dados de benefícios e férias:', err);
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  // Handle Approve / Reject
  const handleApprove = (id: string) => {
    setLeaveRequests(leaveRequests.map(r => r.id === id ? { ...r, status: 'Aprovado', approverName: 'Gestor Responsável' } : r));
  };

  const handleReject = (id: string) => {
    setLeaveRequests(leaveRequests.map(r => r.id === id ? { ...r, status: 'Rejeitado', approverName: 'Gestor Responsável' } : r));
  };

  // Handle New Request Submit
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqEmployeeName || !reqStartDate || !reqEndDate) return;

    const start = new Date(reqStartDate);
    const end = new Date(reqEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newReqData: Partial<LeaveRequest> = {
      employeeName: reqEmployeeName,
      department: reqDepartment,
      type: reqType,
      startDate: reqStartDate,
      endDate: reqEndDate,
      totalDays: diffDays,
      notes: reqNotes
    };

    const savedReq = await BenefitService.createLeaveRequest(newReqData);

    setLeaveRequests([savedReq, ...leaveRequests]);
    setShowNewRequestModal(false);
    setReqEmployeeName('');
    setReqNotes('');
  };

  const expiringVacationsCount = balances.filter(b => b.isExpiringSoon).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <Palmtree className="w-3.5 h-3.5" />
            Gestão de Pessoas & Benefícios CLT
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Férias, Licenças & Benefícios</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle automatizado de saldo aquisitivo, solicitação e aprovação de férias/atestados e catálogo de benefícios corporativos.
          </p>
        </div>

        <button
          onClick={() => setShowNewRequestModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          Solicitar Férias / Ausência
        </button>
      </div>

      {/* Expiration Alert Banner */}
      {expiringVacationsCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">Aviso da Legislação CLT: Férias Próximas do Vencimento</h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Existem <strong>{expiringVacationsCount} colaboradores</strong> com período concessivo prestes a expirar. Agende as férias para evitar pagamento em dobro.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('saldos')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-2xs"
          >
            Ver Saldos
          </button>
        </div>
      )}

      {/* Tabs & AI Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('solicitacoes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'solicitacoes'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Solicitações & Aprovações ({leaveRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('saldos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'saldos'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Saldos & Períodos Aquisitivos
          </button>
          <button
            onClick={() => setActiveTab('beneficios')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'beneficios'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Catálogo de Benefícios ({benefits.length})
          </button>
        </div>

        {/* Action button by active tab */}
        {activeTab === 'saldos' && (
          <button
            onClick={() =>
              setAiModalConfig({
                isOpen: true,
                title: 'Alertar Férias Vencidas com IA',
                subtitle: 'Verificação inteligente de férias a vencer nos próximos 60 dias conforme a CLT',
                onExecute: () => vacationAiService.alertExpiredVacations({ employees: balances }),
              })
            }
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alertar Vencimentos com IA</span>
          </button>
        )}

        {activeTab === 'beneficios' && (
          <button
            onClick={() =>
              setAiModalConfig({
                isOpen: true,
                title: 'Análise & Sugestão de Benefícios com IA',
                subtitle: 'Identificação de oportunidades, conformidade e elegibilidade do plano corporativo',
                onExecute: () => benefitsAiService.suggestBenefits({ companySize: 120, segment: 'Tecnologia & Serviços' }),
              })
            }
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Sugerir Benefícios com IA</span>
          </button>
        )}
      </div>

      {/* TAB 1: SOLICITAÇÕES & APROVAÇÕES */}
      {activeTab === 'solicitacoes' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Solicitações de Ausências & Férias</h3>
            <span className="text-xs text-slate-500">Aprovação direta por gestores ou RH</span>
          </div>

          <div className="space-y-3">
            {leaveRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-100/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      req.type === 'Férias Regulamentares' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : req.type === 'Atestado Médico'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {req.type}
                    </span>
                    <span className="text-xs text-slate-400">• Solicitado em {req.requestedAt}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{req.employeeName}</h4>
                  <p className="text-xs text-slate-500">
                    Departamento: <strong>{req.department}</strong> | Período: <strong>{req.startDate} a {req.endDate}</strong> ({req.totalDays} dias)
                  </p>

                  {req.notes && (
                    <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100 max-w-xl mt-1">
                      "{req.notes}"
                    </p>
                  )}

                  {req.medicalCertificateFile && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md mt-1">
                      <FileCheck className="w-3.5 h-3.5" />
                      Anexo: {req.medicalCertificateFile}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  {req.status === 'Pendente de Aprovação' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReject(req.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Rejeitar
                      </button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aprovar
                      </button>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        req.status === 'Aprovado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {req.status === 'Aprovado' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {req.status}
                      </span>
                      {req.approverName && (
                        <span className="block text-[10px] text-slate-400 mt-0.5">Por: {req.approverName}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SALDOS DE FÉRIAS */}
      {activeTab === 'saldos' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Saldo Aquisitivo de Férias por Colaborador</h3>
            <span className="text-xs text-slate-500">Base da CLT artigo 130</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Departamento</th>
                  <th className="py-3 px-4">Período Aquisitivo</th>
                  <th className="py-3 px-4">Limite Gozo (Vencimento)</th>
                  <th className="py-3 px-4 text-center">Dias Gozados</th>
                  <th className="py-3 px-4 text-center">Saldo Restante</th>
                  <th className="py-3 px-4 text-center">Status Alerta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {balances.map((b) => (
                  <tr key={b.employeeId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{b.employeeName}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{b.department}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {b.vestingPeriodStart} a {b.vestingPeriodEnd}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{b.expirationDate}</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">{b.takenDays} dias</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-indigo-700">
                      {b.remainingDays} dias
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {b.isExpiringSoon ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          Vence em breve
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Regular
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CATÁLOGO DE BENEFÍCIOS */}
      {activeTab === 'beneficios' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((ben) => (
            <div key={ben.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                  {ben.code}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  ben.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {ben.status}
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">{ben.title}</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Operadora: {ben.provider}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Custo Mensal / Colaborador:</span>
                  <strong className="text-slate-900">R$ {ben.monthlyValuePerEmployee}/mês</strong>
                </div>
                <div className="flex justify-between">
                  <span>Desconto Folha CLT:</span>
                  <strong className="text-slate-900">{ben.companyDiscountPercent}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Adesão Atual:</span>
                  <strong className="text-indigo-600">{ben.activeEnrolledEmployees} vidas ativas</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Renovação: {ben.renewalDate}
                </span>
                <button className="text-indigo-600 font-semibold hover:underline">
                  Gerenciar Vidas →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: NOVA SOLICITAÇÃO */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Nova Solicitação de Férias ou Licença</h3>

            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Colaborador *</label>
                <input
                  type="text"
                  required
                  value={reqEmployeeName}
                  onChange={(e) => setReqEmployeeName(e.target.value)}
                  placeholder="Ex: Gabriel Fernandes"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Ausência *</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="Férias Regulamentares">Férias Regulamentares</option>
                  <option value="Atestado Médico">Atestado Médico</option>
                  <option value="Licença Maternidade/Paternidade">Licença Maternidade/Paternidade</option>
                  <option value="Licença Luto">Licença Luto</option>
                  <option value="Folga Compensatória">Folga Compensatória</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data Início *</label>
                  <input
                    type="date"
                    required
                    value={reqStartDate}
                    onChange={(e) => setReqStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data Fim *</label>
                  <input
                    type="date"
                    required
                    value={reqEndDate}
                    onChange={(e) => setReqEndDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações (Opcional)</label>
                <textarea
                  rows={2}
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="Justificativa ou detalhes da ausência..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Registrar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ContextualAiModal
        isOpen={aiModalConfig.isOpen}
        onClose={() => setAiModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={aiModalConfig.title}
        subtitle={aiModalConfig.subtitle}
        onExecute={aiModalConfig.onExecute}
      />
    </div>
  );
};
