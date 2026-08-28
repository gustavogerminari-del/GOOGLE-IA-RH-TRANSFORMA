import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  FileSpreadsheet, 
  Calendar, 
  Clock, 
  Layers, 
  Plus, 
  Printer, 
  Save, 
  Trash2, 
  Share2, 
  Send, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { 
  ColaboradorCompleto, 
  RegistroFeriasColaborador, 
  CalculoRescisorio, 
  AfastamentoColaborador, 
  ItemBeneficio, 
  ReportTemplateModel, 
  ScheduledReportModel 
} from '../types/dp';
import { CustomReportBuilder } from './CustomReportBuilder';
import { 
  exportDataToCSV, 
  exportDataToXLSX, 
  exportDataToPDF, 
  getReportTemplatesFirestore, 
  getScheduledReportsFirestore, 
  saveScheduledReportFirestore, 
  deleteScheduledReportFirestore, 
  deleteReportTemplateFirestore 
} from '../services/dpAnalyticsService';

interface RelatoriosDpViewProps {
  companyId: string;
  colaboradores: ColaboradorCompleto[];
  ferias: RegistroFeriasColaborador[];
  rescisoes: CalculoRescisorio[];
  afastamentos: AfastamentoColaborador[];
  beneficios: ItemBeneficio[];
}

export const RelatoriosDpView: React.FC<RelatoriosDpViewProps> = ({
  companyId,
  colaboradores,
  ferias,
  rescisoes,
  afastamentos,
  beneficios
}) => {
  const [activeTab, setActiveTab] = useState<'standard' | 'builder' | 'saved' | 'scheduled'>('standard');
  const [selectedStandardReport, setSelectedStandardReport] = useState<string>('quadro_geral');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Templates & Scheduled Reports State
  const [templates, setTemplates] = useState<ReportTemplateModel[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReportModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTemplateForSchedule, setSelectedTemplateForSchedule] = useState<ReportTemplateModel | null>(null);
  const [scheduleFrequency, setScheduleFrequency] = useState<'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'competencia'>('mensal');
  const [recipientsInput, setRecipientsInput] = useState('');
  const [scheduleFormat, setScheduleFormat] = useState<'PDF' | 'CSV' | 'XLSX'>('PDF');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const tpls = await getReportTemplatesFirestore(companyId);
      const scheds = await getScheduledReportsFirestore(companyId);
      setTemplates(tpls);
      setScheduledReports(scheds);
    } catch (err) {
      console.error('Erro ao carregar dados de relatórios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  // Standard Reports Definitions
  const STANDARD_REPORTS = [
    {
      id: 'quadro_geral',
      title: 'Quadro Geral de Colaboradores (Headcount Real)',
      description: 'Relação completa de ativos, cargos, departamentos, admissão e salários.',
      category: 'Operacional',
      generate: () => {
        const headers = ['Nome Completo', 'CPF', 'Cargo', 'Departamento', 'Unidade', 'Admissão', 'Salário Base', 'Status'];
        const rows = colaboradores.map(c => [
          c.nomeCompleto,
          c.pessoais?.cpf || '000.000.000-00',
          c.profissionais?.cargo || '-',
          c.profissionais?.departamento || '-',
          c.profissionais?.unidade || 'Matriz',
          c.profissionais?.dataAdmissao || '-',
          (c.profissionais?.salarioBase || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          c.profissionais?.status || 'Ativo'
        ]);
        return { headers, rows };
      }
    },
    {
      id: 'custos_pessoal',
      title: 'Relatório de Custos de Pessoal & Encargos (35%)',
      description: 'Apurativo analítico de salários base, encargos trabalhistas patronais e benefícios.',
      category: 'Financeiro',
      generate: () => {
        const headers = ['Colaborador', 'Cargo', 'Departamento', 'Salário Base', 'Encargos (35%)', 'Benefícios', 'Custo Total'];
        const rows = colaboradores.filter(c => c.profissionais?.status === 'Ativo').map(c => {
          const sal = c.profissionais?.salarioBase || 0;
          const enc = sal * 0.35;
          const ben = 650.00;
          return [
            c.nomeCompleto,
            c.profissionais?.cargo || '-',
            c.profissionais?.departamento || '-',
            sal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            enc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            ben.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            (sal + enc + ben).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          ];
        });
        return { headers, rows };
      }
    },
    {
      id: 'mapa_ferias',
      title: 'Mapa de Férias & Provisões Financeiras',
      description: 'Dias de saldo acumulado, prazos limite de concessão e valor da provisão de 1/3.',
      category: 'Gerencial',
      generate: () => {
        const headers = ['Colaborador', 'Cargo', 'Departamento', 'Saldo Dias', 'Status', 'Provisão 1/3'];
        const rows = ferias.map(f => [
          f.colaboradorNome,
          f.cargo || '-',
          f.departamento || '-',
          f.diasSaldo || 30,
          f.status || 'Disponível',
          (f.valorUmTercoConstitucional || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        ]);
        return { headers, rows };
      }
    },
    {
      id: 'turnover_rescisoes',
      title: 'Relatório de Turnover e Desligamentos',
      description: 'Análise de admissões, desligamentos, motivos de rescisão e verbas pagas.',
      category: 'Operacional',
      generate: () => {
        const headers = ['Colaborador', 'Tipo de Rescisão', 'Data Desligamento', 'Aviso Prévio', 'Verbas Rescisórias'];
        const rows = rescisoes.map(r => [
          r.colaboradorNome,
          r.tipoRescisao,
          r.dataDesligamento,
          r.avisoPrevio,
          r.valorLiquidoRescisao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        ]);
        return { headers, rows };
      }
    },
    {
      id: 'afastamentos_inss',
      title: 'Relatório de Afastamentos & Licenças Médicas',
      description: 'Acompanhamento de atestados, licenças maternidade/paternidade e auxílio-doença INSS.',
      category: 'Operacional',
      generate: () => {
        const headers = ['Colaborador', 'Tipo de Afastamento', 'Data Início', 'Previsão Retorno', 'Status'];
        const rows = afastamentos.map(a => [
          a.colaboradorNome,
          a.tipoAfastamento,
          a.dataInicio,
          a.dataPrevisaoRetorno,
          a.status
        ]);
        return { headers, rows };
      }
    }
  ];

  const currentReportDef = STANDARD_REPORTS.find(r => r.id === selectedStandardReport) || STANDARD_REPORTS[0];
  const currentReportData = currentReportDef.generate();

  const handleExportCSVCurrent = () => {
    exportDataToCSV(currentReportDef.title, currentReportData.headers, currentReportData.rows);
  };

  const handleExportXLSXCurrent = () => {
    exportDataToXLSX(currentReportDef.title, currentReportData.headers, currentReportData.rows);
  };

  const handleExportPDFCurrent = () => {
    exportDataToPDF(currentReportDef.title, 'RH TRANSFORMA', currentReportData.headers, currentReportData.rows);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Deseja realmente excluir este modelo de relatório?')) return;
    try {
      await deleteReportTemplateFirestore(templateId);
      await loadData();
    } catch (e) {
      alert('Erro ao excluir modelo.');
    }
  };

  const handleCreateSchedule = async () => {
    if (!selectedTemplateForSchedule) return;
    if (!recipientsInput.trim()) {
      alert('Por favor, informe ao menos um e-mail de destinatário.');
      return;
    }
    try {
      const newSched: ScheduledReportModel = {
        id: `sched-${Date.now()}`,
        companyId,
        templateId: selectedTemplateForSchedule.id,
        templateName: selectedTemplateForSchedule.name,
        frequency: scheduleFrequency,
        recipients: recipientsInput.split(',').map(e => e.trim()),
        fileFormat: scheduleFormat,
        active: true,
        lastRunAt: null,
        nextRunAt: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        createdBy: 'Analista DP RH TRANSFORMA',
        createdAt: new Date().toISOString()
      };
      await saveScheduledReportFirestore(companyId, newSched);
      alert('Agendamento criado com sucesso!');
      setShowScheduleModal(false);
      setRecipientsInput('');
      await loadData();
    } catch (e) {
      alert('Erro ao criar agendamento.');
    }
  };

  const handleDeleteSchedule = async (schedId: string) => {
    if (!confirm('Deseja cancelar este agendamento?')) return;
    try {
      await deleteScheduledReportFirestore(schedId);
      await loadData();
    } catch (e) {
      alert('Erro ao excluir agendamento.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-black px-3 py-1 rounded-full border border-indigo-200">
            <FileText className="w-3.5 h-3.5" />
            <span>Central de Relatórios, Exportações & Agendamentos DP</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Relatórios Oficiais de Departamento Pessoal</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gere relatórios gerenciais, operacionais e financeiros em PDF, CSV ou Excel com rastreabilidade total de auditoria.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('standard')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'standard' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Relatórios Padrão
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'builder' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Construtor Customizado
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'saved' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Modelos Salvos ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'scheduled' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Agendamentos ({scheduledReports.length})
          </button>
        </div>
      </div>

      {/* TAB 1: STANDARD REPORTS */}
      {activeTab === 'standard' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Report Selector Sidebar */}
          <div className="space-y-2 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider p-2">Catálogo de Relatórios</h3>
            {STANDARD_REPORTS.map(rep => {
              const isSelected = selectedStandardReport === rep.id;
              return (
                <button
                  key={rep.id}
                  onClick={() => setSelectedStandardReport(rep.id)}
                  className={`w-full p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80 font-semibold'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] uppercase font-black opacity-80">
                    <span>{rep.category}</span>
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-black mt-1">{rep.title}</p>
                </button>
              );
            })}
          </div>

          {/* Active Standard Report Content */}
          <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {currentReportDef.category}
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">{currentReportDef.title}</h2>
                <p className="text-xs text-slate-500 font-medium">{currentReportDef.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportCSVCurrent}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportXLSXCurrent}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel (XLS)</span>
                </button>
                <button
                  onClick={handleExportPDFCurrent}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / PDF</span>
                </button>
              </div>
            </div>

            {/* Table Display */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                    {currentReportData.headers.map((h, i) => (
                      <th key={i} className="p-3 uppercase text-[10px] tracking-wider font-extrabold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {currentReportData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-3">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: CUSTOM BUILDER */}
      {activeTab === 'builder' && (
        <CustomReportBuilder
          companyId={companyId}
          colaboradores={colaboradores}
          beneficios={beneficios}
          ferias={ferias}
          rescisoes={rescisoes}
          afastamentos={afastamentos}
          onSaveTemplateSuccess={loadData}
        />
      )}

      {/* TAB 3: SAVED TEMPLATES */}
      {activeTab === 'saved' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Modelos de Relatórios Salvos no Firestore</h2>
              <p className="text-xs text-slate-500 font-medium">
                Execute rapidamente relatórios pré-configurados pela equipe de RH ou crie agendamentos automáticos.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('builder')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Novo Modelo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tpl => (
              <div key={tpl.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                      {tpl.dataSource}
                    </span>
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Excluir Modelo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm mt-1">{tpl.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{tpl.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs font-bold">
                  <button
                    onClick={() => {
                      setSelectedTemplateForSchedule(tpl);
                      setShowScheduleModal(true);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Agendar</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('builder');
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Executar Agora</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SCHEDULED REPORTS */}
      {activeTab === 'scheduled' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Agendamento Automático de Relatórios</h2>
              <p className="text-xs text-slate-500 font-medium">
                Envio periódico automatizado via e-mail ou armazenamento em PDF/Excel.
              </p>
            </div>
            <button
              onClick={() => {
                if (templates.length > 0) {
                  setSelectedTemplateForSchedule(templates[0]);
                  setShowScheduleModal(true);
                } else {
                  alert('Crie um modelo salvo primeiro.');
                }
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Agendamento</span>
            </button>
          </div>

          <div className="space-y-3">
            {scheduledReports.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">Nenhum agendamento ativo registrado.</p>
                <p className="text-slate-400 text-xs">Agende o envio recorrente de relatórios para gestores e diretoria.</p>
              </div>
            ) : (
              scheduledReports.map(sched => (
                <div key={sched.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {sched.frequency.toUpperCase()}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                        FORMATO: {sched.fileFormat}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm">{sched.templateName}</h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Destinatários: <strong className="text-slate-800">{sched.recipients.join(', ')}</strong> • Próxima execução: {sched.nextRunAt}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteSchedule(sched.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="Excluir Agendamento"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedTemplateForSchedule && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-black text-slate-900 text-lg">Agendar Envio de Relatório</h3>
            <p className="text-xs text-slate-500">
              Configure a frequência de geração automática para o modelo: <strong className="text-indigo-600">{selectedTemplateForSchedule.name}</strong>
            </p>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div className="space-y-1">
                <label>Frequência de Envio</label>
                <select
                  value={scheduleFrequency}
                  onChange={e => setScheduleFrequency(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="diario">Diário (Todo dia às 07:00)</option>
                  <option value="semanal">Semanal (Toda Segunda-feira)</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal (1º dia útil do mês)</option>
                  <option value="competencia">No Fechamento da Folha</option>
                </select>
              </div>

              <div className="space-y-1">
                <label>Formato do Arquivo</label>
                <select
                  value={scheduleFormat}
                  onChange={e => setScheduleFormat(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="PDF">PDF (Documento Formatado)</option>
                  <option value="XLSX">Excel (.XLSX)</option>
                  <option value="CSV">CSV (Valores Separados por Vírgula)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label>E-mails dos Destinatários (separados por vírgula)</label>
                <textarea
                  rows={3}
                  placeholder="diretoria@empresa.com, rh@empresa.com"
                  value={recipientsInput}
                  onChange={e => setRecipientsInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSchedule}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs"
              >
                Salvar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
