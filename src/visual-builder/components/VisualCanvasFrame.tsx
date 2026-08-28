import React from 'react';
import { 
  PageConfig, 
  ComponentInstance, 
  EditableDevice, 
  BuilderMode 
} from '../types/builderTypes';
import { 
  MoveUp, 
  MoveDown, 
  Copy, 
  Trash2, 
  EyeOff, 
  Lock, 
  Sparkles, 
  Sliders, 
  Plus, 
  CheckCircle,
  Briefcase,
  Users,
  Clock,
  DollarSign,
  FileText,
  Building2,
  Maximize2
} from 'lucide-react';

// Real Application Views imported for real live page rendering inside the editor
import { DashboardView } from '../../components/DashboardView';
import { JobsView } from '../../components/JobsView';
import { TalentBankView } from '../../components/TalentBankView';
import { InterviewsView } from '../../components/InterviewsView';
import { CompanyView } from '../../components/CompanyView';
import { ReportsView } from '../../components/ReportsView';
import { SettingsView } from '../../components/SettingsView';
import { PontoDigitalView } from '../../ponto-digital';
import { PublicJobsView } from '../../public-jobs';
import { HeadhunterView } from '../../headhunter/HeadhunterView';
import { DepartamentoPessoalView } from '../../departamento-pessoal/DepartamentoPessoalView';
import { PayrollView } from '../../payroll/PayrollView';
import { BenefitsLeavesView } from '../../benefits-leaves/BenefitsLeavesView';
import { DocumentsSignatureView } from '../../documents-signature/DocumentsSignatureView';
import { INITIAL_JOBS, INITIAL_CANDIDATES, INITIAL_INTERVIEWS, fontStages } from '../../data/initialData';

interface VisualCanvasFrameProps {
  pageConfig: PageConfig;
  builderMode: BuilderMode;
  selectedDevice: EditableDevice;
  zoomLevel: number;
  selectedComponentId?: string;
  onSelectComponent: (id: string) => void;
  onUpdatePageComponents: (components: ComponentInstance[]) => void;
}

export const VisualCanvasFrame: React.FC<VisualCanvasFrameProps> = ({
  pageConfig,
  builderMode,
  selectedDevice,
  zoomLevel,
  selectedComponentId,
  onSelectComponent,
  onUpdatePageComponents
}) => {
  const components = pageConfig.components || [];

  // Device Dimensions Mapping
  const getDeviceFrameStyles = (): React.CSSProperties => {
    switch (selectedDevice) {
      case 'tablet':
        return { width: '768px', minHeight: '1024px', margin: '0 auto' };
      case 'mobile':
        return { width: '390px', minHeight: '844px', margin: '0 auto' };
      case 'desktop':
      default:
        return { width: '100%', minHeight: '800px' };
    }
  };

  // Move component up/down
  const handleMoveComponent = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= components.length) return;

    const updated = [...components];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    const reordered = updated.map((c, i) => ({ ...c, order: i + 1 }));
    onUpdatePageComponents(reordered);
  };

  // Duplicate component
  const handleDuplicate = (comp: ComponentInstance) => {
    if (comp.protectionLevel === 'systemCritical') return;
    const duplicated: ComponentInstance = {
      ...comp,
      id: `comp-dup-${Date.now()}`,
      name: `${comp.name} (Cópia)`,
      order: components.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onUpdatePageComponents([...components, duplicated]);
  };

  // Delete component
  const handleDelete = (id: string) => {
    const target = components.find(c => c.id === id);
    if (target?.protectionLevel === 'systemCritical') {
      alert('Não é permitido remover componentes essenciais do sistema.');
      return;
    }
    onUpdatePageComponents(components.filter(c => c.id !== id));
  };

  // Render Real Page View or Visual Components Frame
  const renderRealPageContent = () => {
    switch (pageConfig.slug) {
      case 'dashboard':
        return (
          <DashboardView
            jobs={INITIAL_JOBS as any}
            candidates={INITIAL_CANDIDATES as any}
            interviews={INITIAL_INTERVIEWS as any}
            stages={fontStages}
            onNavigateToJobs={() => {}}
            onNavigateToCandidates={() => {}}
            onNavigateToInterviews={() => {}}
            openNewJobModal={() => {}}
            openNewCandidateModal={() => {}}
          />
        );

      case 'vagas':
        return (
          <JobsView
            jobs={INITIAL_JOBS as any}
            candidates={INITIAL_CANDIDATES as any}
            stages={fontStages}
            openNewJobModal={() => {}}
            onMoveCandidateStage={() => {}}
            searchTerm=""
            onUpdateJobs={() => {}}
          />
        );

      case 'banco-talentos':
      case 'candidatos':
        return (
          <TalentBankView
            candidates={INITIAL_CANDIDATES as any}
            jobs={INITIAL_JOBS as any}
            openNewCandidateModal={() => {}}
            onAssignCandidateToJob={() => {}}
            searchTerm=""
          />
        );

      case 'entrevistas':
        return (
          <InterviewsView
            interviews={INITIAL_INTERVIEWS as any}
            candidates={INITIAL_CANDIDATES as any}
            jobs={INITIAL_JOBS as any}
            openScheduleModal={() => {}}
            searchTerm=""
          />
        );

      case 'headhunter':
        return <HeadhunterView initialSubTab="dashboard" />;

      case 'clientes':
        return (
          <CompanyView
            jobs={INITIAL_JOBS as any}
            candidates={INITIAL_CANDIDATES as any}
            openNewJobModal={() => {}}
          />
        );

      case 'departamento-pessoal':
      case 'colaboradores':
        return <DepartamentoPessoalView initialSubTab="colaboradores" />;

      case 'ponto-digital':
      case 'ponto':
        return <PontoDigitalView />;

      case 'folha-pagamento':
      case 'folha':
        return <PayrollView />;

      case 'beneficios':
      case 'ferias':
        return <BenefitsLeavesView />;

      case 'documentos':
        return <DocumentsSignatureView />;

      case 'relatorios':
        return (
          <ReportsView
            jobs={INITIAL_JOBS as any}
            candidates={INITIAL_CANDIDATES as any}
            interviews={INITIAL_INTERVIEWS as any}
          />
        );

      case 'configuracoes':
        return <SettingsView />;

      case 'site-vagas':
        return <PublicJobsView jobs={INITIAL_JOBS as any} onApplyCandidate={() => {}} isInternalView={true} />;

      case 'login':
        return (
          <div className="min-h-[500px] bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center text-white space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg">
              RL
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-white">{pageConfig.components[0]?.content.text || 'Acesse sua Conta RH TRANSFORMA'}</h2>
              <p className="text-xs text-slate-400">Plataforma Inteligente de RH e Departamento Pessoal</p>
            </div>
            <div className="w-full max-w-sm bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">E-mail Corporativo</label>
                <input type="email" placeholder="usuario@empresa.com.br" className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white" disabled />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Senha de Acesso</label>
                <input type="password" placeholder="••••••••" className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white" disabled />
              </div>
              <button className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black">Entrar no Sistema</button>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-8 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h1 className="text-2xl font-black text-slate-900">{pageConfig.name}</h1>
              <p className="text-slate-500 text-sm mt-1">Página do sistema sob gerenciamento do Construtor Visual MASTER.</p>
            </div>
          </div>
        );
    }
  };


  return (
    <div className="flex-1 bg-slate-950 overflow-auto p-4 sm:p-8 flex justify-center items-start select-none relative">
      
      {/* Device Simulation Wrapper */}
      <div 
        style={{
          ...getDeviceFrameStyles(),
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center',
          transition: 'all 0.2s ease-in-out'
        }}
        className={`bg-white rounded-2xl shadow-2xl overflow-hidden border ${
          selectedDevice !== 'desktop' 
            ? 'border-slate-700 shadow-amber-500/10 ring-8 ring-slate-900' 
            : 'border-slate-800'
        }`}
      >
        
        {/* Device Top Bar Indicator when Mobile/Tablet */}
        {selectedDevice !== 'desktop' && (
          <div className="bg-slate-900 text-slate-400 px-4 py-2 text-xs font-bold flex items-center justify-between border-b border-slate-800">
            <span className="capitalize">{selectedDevice} Viewport Simulation</span>
            <span className="font-mono text-[11px] text-amber-400">
              {selectedDevice === 'tablet' ? '768 x 1024' : '390 x 844'}
            </span>
          </div>
        )}

        {/* Live Canvas Content */}
        <div className="relative min-h-[600px] bg-slate-50">

          {/* OVERLAY MODE: Interactive Component Selectors on Top of Page */}
          {builderMode === 'edit' && (
            <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Modo de Edição Ativo: Clique nos componentes abaixo para alterar textos, cores e estilos.</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-extrabold text-[11px]">
                {components.length} Componentes Editáveis
              </span>
            </div>
          )}

          {/* Render Editable Components Floating Strip */}
          {builderMode === 'edit' && components.length > 0 && (
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 space-y-2">
              <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider block">
                Camadas de Componentes da Página:
              </span>
              <div className="flex flex-wrap gap-2">
                {components.map((comp, idx) => {
                  const isSelected = selectedComponentId === comp.id;
                  return (
                    <div
                      key={comp.id}
                      onClick={() => onSelectComponent(comp.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition flex items-center gap-2 ${
                        isSelected 
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md' 
                          : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      <span>{comp.name}</span>

                      {/* Quick Action Controls inside bar */}
                      {isSelected && (
                        <div className="flex items-center gap-1 pl-2 border-l border-slate-950/30">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoveComponent(idx, 'up'); }}
                            title="Mover para cima"
                            className="p-1 hover:bg-slate-950/20 rounded"
                          >
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoveComponent(idx, 'down'); }}
                            title="Mover para baixo"
                            className="p-1 hover:bg-slate-950/20 rounded"
                          >
                            <MoveDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDuplicate(comp); }}
                            title="Duplicar"
                            className="p-1 hover:bg-slate-950/20 rounded"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {comp.protectionLevel !== 'systemCritical' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(comp.id); }}
                              title="Excluir"
                              className="p-1 hover:bg-red-500 hover:text-white rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real System Page View Render */}
          <div className="p-2 sm:p-4">
            {renderRealPageContent()}
          </div>

        </div>

      </div>

    </div>
  );
};
