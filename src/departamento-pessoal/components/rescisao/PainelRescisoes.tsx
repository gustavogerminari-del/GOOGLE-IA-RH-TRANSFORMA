import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  Users, 
  Calculator, 
  CheckSquare, 
  Stethoscope, 
  FileSignature, 
  Settings, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  UserX,
  FileText
} from 'lucide-react';
import { ColaboradorCompleto, CalculoRescisorio } from '../../types/dp';
import { 
  ProcessoRescisaoCompleto, 
  ItemMemoriaCalculo, 
  ItemChecklistDesligamento, 
  EquipamentoDevolucao,
  ExameAsoDemissional,
  EntrevistaDesligamento,
  DadoElegibilidadeRehire
} from '../../types/terminationTypes';
import { 
  listTerminationsFirestore, 
  saveTerminationFirestore, 
  createTerminationRequestFirestore,
  concluirDesligamentoCompletoFirestore,
  cancelarRescisaoFirestore,
  reabrirRescisaoFirestore
} from '../../services/terminationFirestoreService';
import { RescisaoHeaderMetrics } from './RescisaoHeaderMetrics';
import { ProcessoRescisaoLista } from './ProcessoRescisaoLista';
import { NovaSolicitacaoModal } from './NovaSolicitacaoModal';
import { MemoriaCalculoViewer } from './MemoriaCalculoViewer';
import { ChecklistAssetsTab } from './ChecklistAssetsTab';
import { ExameEntrevistaTab } from './ExameEntrevistaTab';
import { DocumentosAssinaturaTab } from './DocumentosAssinaturaTab';
import { ModalConcluirDesligamento } from './ModalConcluirDesligamento';
import { RegrasDesligamentoView } from './RegrasDesligamentoView';
import { ContextualAiModal } from '../../../ai/components/ContextualAiModal';
import { dpAiService } from '../../../ai/services/aiService';
import { useAuth } from '../../../auth';

interface PainelRescisoesProps {
  colaboradores: ColaboradorCompleto[];
  companyId: string;
  legacyRescisoes?: CalculoRescisorio[];
  onSalvarRescisaoLegacy?: (r: CalculoRescisorio) => void;
}

type RescisaoSubTab = 'processos' | 'detalhes' | 'ex-colaboradores' | 'regras';
type ProcessDetailTab = 'memoria' | 'checklist' | 'aso-entrevista' | 'documentos' | 'aprovacoes';

export const PainelRescisoes: React.FC<PainelRescisoesProps> = ({
  colaboradores,
  companyId,
  legacyRescisoes,
  onSalvarRescisaoLegacy
}) => {
  const { user: authenticatedUser } = useAuth();
  const [processes, setProcesses] = useState<ProcessoRescisaoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

  const [activeMainTab, setActiveMainTab] = useState<RescisaoSubTab>('processos');
  const [activeDetailTab, setActiveDetailTab] = useState<ProcessDetailTab>('memoria');

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load processes from Firestore
  const loadProcesses = async () => {
    setLoading(true);
    try {
      const data = await listTerminationsFirestore(companyId);
      setProcesses(data);

      if (data.length > 0 && !selectedProcessId) {
        setSelectedProcessId(data[0].id);
      }
    } catch (error: any) {
      setFeedback({
        type: 'error',
        message: error?.message || 'Não foi possível atualizar a lista de desligamentos.',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcesses().catch(() => undefined);
  }, [companyId]);

  const selectedProcess = processes.find(p => p.id === selectedProcessId) || processes[0];

  // Action Handlers
  const handleCreateRequest = async (formData: any) => {
    const targetColab = colaboradores.find(c => c.id === formData.employeeId);
    if (!targetColab) throw new Error('Colaborador selecionado não foi encontrado.');

    const tenantId = companyId || targetColab.companyId || (targetColab as any).empresaId || '';
    const currentUser = authenticatedUser as any;
    const user = {
      id: currentUser?.uid || currentUser?.id || 'rh-system',
      name: currentUser?.name || currentUser?.displayName || 'Analista de RH',
      role: currentUser?.role || 'RH',
    };
    try {
      const created = await createTerminationRequestFirestore(formData, targetColab, user, tenantId);
      setProcesses(prev => [created, ...prev.filter(item => item.id !== created.id)]);
      setSelectedProcessId(created.id);
      setActiveMainTab('processos');
      setShowNewModal(false);
      setFeedback({ type: 'success', message: 'Solicitação de desligamento criada com sucesso.' });

      try {
        await loadProcesses();
      } catch (refreshError) {
        console.warn('[DESLIGAMENTO_LIST_REFRESH_FAILED]', { desligamentoId: created.id, error: refreshError });
      }
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'Não foi possível criar a solicitação de desligamento.' });
      throw error;
    }
  };

  const handleUpdateCalculationItems = async (updatedItems: ItemMemoriaCalculo[]) => {
    if (!selectedProcess) return;

    const proventos = updatedItems.filter(i => i.type === 'Provento');
    const descontos = updatedItems.filter(i => i.type === 'Desconto');
    const totalGross = proventos.reduce((acc, c) => acc + c.grossValue, 0);
    const totalDiscounts = descontos.reduce((acc, c) => acc + c.discountValue, 0);

    const updatedProcess: ProcessoRescisaoCompleto = {
      ...selectedProcess,
      calculationItems: updatedItems,
      totalGross,
      totalDiscounts,
      totalNet: totalGross - totalDiscounts,
      updatedAt: new Date().toISOString()
    };

    setProcesses(prev => prev.map(p => p.id === updatedProcess.id ? updatedProcess : p));
    await saveTerminationFirestore(updatedProcess);
  };

  const handleUpdateChecklist = async (checklist: ItemChecklistDesligamento[]) => {
    if (!selectedProcess) return;
    const updatedProcess: ProcessoRescisaoCompleto = {
      ...selectedProcess,
      checklist,
      updatedAt: new Date().toISOString()
    };
    setProcesses(prev => prev.map(p => p.id === updatedProcess.id ? updatedProcess : p));
    await saveTerminationFirestore(updatedProcess);
  };

  const handleUpdateAssets = async (assets: EquipamentoDevolucao[]) => {
    if (!selectedProcess) return;
    const updatedProcess: ProcessoRescisaoCompleto = {
      ...selectedProcess,
      assets,
      updatedAt: new Date().toISOString()
    };
    setProcesses(prev => prev.map(p => p.id === updatedProcess.id ? updatedProcess : p));
    await saveTerminationFirestore(updatedProcess);
  };

  const handleUpdateMedicalExam = async (exam: ExameAsoDemissional) => {
    if (!selectedProcess) return;
    const updatedProcess: ProcessoRescisaoCompleto = {
      ...selectedProcess,
      medicalExam: exam,
      updatedAt: new Date().toISOString()
    };
    setProcesses(prev => prev.map(p => p.id === updatedProcess.id ? updatedProcess : p));
    await saveTerminationFirestore(updatedProcess);
  };

  const handleSaveExitInterview = async (interview: EntrevistaDesligamento) => {
    if (!selectedProcess) return;
    const updatedProcess: ProcessoRescisaoCompleto = {
      ...selectedProcess,
      exitInterview: interview,
      updatedAt: new Date().toISOString()
    };
    setProcesses(prev => prev.map(p => p.id === updatedProcess.id ? updatedProcess : p));
    await saveTerminationFirestore(updatedProcess);
  };

  const handleSaveRehireInfo = async (rehireInfo: DadoElegibilidadeRehire) => {
    if (!selectedProcess) return;
    const updatedProcess: ProcessoRescisaoCompleto = {
      ...selectedProcess,
      rehireInfo,
      updatedAt: new Date().toISOString()
    };
    setProcesses(prev => prev.map(p => p.id === updatedProcess.id ? updatedProcess : p));
    await saveTerminationFirestore(updatedProcess);
  };

  const handleConfirmCompleteTermination = async () => {
    if (!selectedProcess) return;
    const user = { id: 'usr-rh-01', name: 'Analista de RH' };
    const res = await concluirDesligamentoCompletoFirestore(companyId, selectedProcess.id, user);

    if (res.success) {
      alert(res.message);
      await loadProcesses();
    } else {
      alert(`Atenção: ${res.message}`);
    }
  };

  const handleCancelProcess = async () => {
    if (!selectedProcess || !cancelReason.trim()) return;
    const user = { id: 'usr-rh-01', name: 'Analista de RH' };
    await cancelarRescisaoFirestore(companyId, selectedProcess.id, user, cancelReason);
    setShowCancelModal(false);
    setCancelReason('');
    await loadProcesses();
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`fixed top-5 right-5 z-[70] max-w-md rounded-2xl border px-4 py-3 shadow-xl text-xs font-bold ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`} role="status">
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
            <button type="button" onClick={() => setFeedback(null)} className="ml-2" aria-label="Fechar mensagem">×</button>
          </div>
        </div>
      )}
      {/* Metrics Header */}
      <RescisaoHeaderMetrics
        processes={processes}
        onOpenNewModal={() => setShowNewModal(true)}
        onOpenAiModal={() => setShowAiModal(true)}
      />

      {/* Primary Sub-Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveMainTab('processos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === 'processos'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Processos de Desligamento ({processes.length})</span>
          </button>

          {selectedProcess && (
            <button
              onClick={() => setActiveMainTab('detalhes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'detalhes'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Gerenciar: {selectedProcess.employeeName.split(' ')[0]}</span>
            </button>
          )}

          <button
            onClick={() => setActiveMainTab('ex-colaboradores')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === 'ex-colaboradores'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserX className="w-4 h-4" />
            <span>Banco de Ex-Colaboradores</span>
          </button>

          <button
            onClick={() => setActiveMainTab('regras')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === 'regras'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Regras & Parâmetros</span>
          </button>
        </div>

        {selectedProcess && activeMainTab === 'detalhes' && selectedProcess.status !== 'Concluída' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
            >
              Cancelar Processo
            </button>

            <button
              onClick={() => setShowCompleteModal(true)}
              className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>CONCLUIR DESLIGAMENTO</span>
            </button>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 font-bold gap-2">
          <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          <span>Sincronizando processos de rescisão com o Firebase...</span>
        </div>
      )}

      {/* Main Tab 1: Lista de Processos */}
      {activeMainTab === 'processos' && (
        <ProcessoRescisaoLista
          processes={processes}
          selectedProcessId={selectedProcessId}
          onSelectProcess={(id) => {
            setSelectedProcessId(id);
            setActiveMainTab('detalhes');
          }}
          onOpenNewModal={() => setShowNewModal(true)}
        />
      )}

      {/* Main Tab 2: Detalhes e Gerenciamento da Rescisão Selecionada */}
      {activeMainTab === 'detalhes' && selectedProcess && (
        <div className="space-y-6">
          {/* Sub Navigation Bar inside Process Details */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">{selectedProcess.employeeName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {selectedProcess.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedProcess.terminationType} — Data Prevista: {selectedProcess.plannedTerminationDate}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveDetailTab('memoria')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeDetailTab === 'memoria' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Memória de Cálculo (TRCT)
              </button>

              <button
                onClick={() => setActiveDetailTab('checklist')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeDetailTab === 'checklist' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Checklist & Ativos
              </button>

              <button
                onClick={() => setActiveDetailTab('aso-entrevista')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeDetailTab === 'aso-entrevista' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                ASO & Entrevista
              </button>

              <button
                onClick={() => setActiveDetailTab('documentos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeDetailTab === 'documentos' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Documentos & Assinatura
              </button>
            </div>
          </div>

          {/* Sub-tab Views */}
          {activeDetailTab === 'memoria' && (
            <MemoriaCalculoViewer
              process={selectedProcess}
              onUpdateCalculationItems={handleUpdateCalculationItems}
            />
          )}

          {activeDetailTab === 'checklist' && (
            <ChecklistAssetsTab
              process={selectedProcess}
              onUpdateChecklist={handleUpdateChecklist}
              onUpdateAssets={handleUpdateAssets}
            />
          )}

          {activeDetailTab === 'aso-entrevista' && (
            <ExameEntrevistaTab
              process={selectedProcess}
              onUpdateMedicalExam={handleUpdateMedicalExam}
              onSaveExitInterview={handleSaveExitInterview}
              onSaveRehireInfo={handleSaveRehireInfo}
            />
          )}

          {activeDetailTab === 'documentos' && (
            <DocumentosAssinaturaTab process={selectedProcess} />
          )}
        </div>
      )}

      {/* Main Tab 3: Ex-Colaboradores */}
      {activeMainTab === 'ex-colaboradores' && (
        <ProcessoRescisaoLista
          processes={processes.filter(p => p.status === 'Concluída')}
          selectedProcessId={selectedProcessId}
          onSelectProcess={(id) => {
            setSelectedProcessId(id);
            setActiveMainTab('detalhes');
          }}
          onOpenNewModal={() => setShowNewModal(true)}
        />
      )}

      {/* Main Tab 4: Regras & Parâmetros */}
      {activeMainTab === 'regras' && (
        <RegrasDesligamentoView companyId={companyId} />
      )}

      {/* Modal: Nova Solicitação */}
      <NovaSolicitacaoModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        colaboradores={colaboradores}
        existingProcesses={processes}
        onSubmit={handleCreateRequest}
      />

      {/* Modal: Concluir Desligamento */}
      {selectedProcess && (
        <ModalConcluirDesligamento
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          process={selectedProcess}
          onConfirm={handleConfirmCompleteTermination}
        />
      )}

      {/* Modal: Cancelar Processo */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Cancelar Processo de Desligamento</h3>
            <p className="text-xs text-slate-500">Informe o motivo do cancelamento para registro de auditoria.</p>

            <textarea
              rows={3}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Descreva a razão do cancelamento..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCancelModal(false)} className="px-3.5 py-2 bg-slate-100 text-xs font-bold rounded-xl">
                Voltar
              </button>
              <button onClick={handleCancelProcess} className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs">
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contextual AI Modal */}
      {showAiModal && (
        <ContextualAiModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          title="Assistente de Homologação de Rescisão com IA"
          contextType="rescisao"
          getAnalysis={async () => {
            return await dpAiService.checkTerminationData({
              employeeName: selectedProcess?.employeeName || 'Análise Geral',
              details: {
                totalProcessos: processes.length,
                concluidas: processes.filter(p => p.status === 'Concluída').length,
                pendentes: processes.filter(p => p.status !== 'Concluída').length
              },
              companyId
            });
          }}
        />
      )}
    </div>
  );
};
