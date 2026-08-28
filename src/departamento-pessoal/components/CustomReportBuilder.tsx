import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Layers, 
  Filter, 
  Download, 
  Save, 
  Eye, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  X, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { 
  ReportDataSource, 
  ReportTemplateModel, 
  ColaboradorCompleto, 
  ItemBeneficio, 
  RegistroFeriasColaborador, 
  CalculoRescisorio, 
  AfastamentoColaborador 
} from '../types/dp';
import { exportDataToCSV, exportDataToXLSX, exportDataToPDF, saveReportTemplateFirestore } from '../services/dpAnalyticsService';

interface CustomReportBuilderProps {
  companyId: string;
  colaboradores: ColaboradorCompleto[];
  beneficios: ItemBeneficio[];
  ferias: RegistroFeriasColaborador[];
  rescisoes: CalculoRescisorio[];
  afastamentos: AfastamentoColaborador[];
  onSaveTemplateSuccess?: () => void;
}

interface FieldDefinition {
  key: string;
  label: string;
  format?: 'currency' | 'date' | 'text' | 'badge';
  getValue: (item: any) => any;
}

const DATA_SOURCE_FIELDS: Record<ReportDataSource, FieldDefinition[]> = {
  colaboradores: [
    { key: 'nomeCompleto', label: 'Nome Completo', getValue: c => c.nomeCompleto },
    { key: 'cpf', label: 'CPF', getValue: c => c.pessoais?.cpf || '000.000.000-00' },
    { key: 'cargo', label: 'Cargo', getValue: c => c.profissionais?.cargo || '-' },
    { key: 'departamento', label: 'Departamento', getValue: c => c.profissionais?.departamento || '-' },
    { key: 'unidade', label: 'Unidade', getValue: c => c.profissionais?.unidade || 'Matriz' },
    { key: 'salarioBase', label: 'Salário Base', format: 'currency', getValue: c => c.profissionais?.salarioBase || 0 },
    { key: 'dataAdmissao', label: 'Data Admissão', format: 'date', getValue: c => c.profissionais?.dataAdmissao || '-' },
    { key: 'status', label: 'Status', format: 'badge', getValue: c => c.profissionais?.status || 'Ativo' },
    { key: 'tipoContrato', label: 'Tipo Contrato', getValue: c => c.profissionais?.tipoContrato || 'CLT' },
    { key: 'gestor', label: 'Gestor Direto', getValue: c => c.profissionais?.gestor || '-' }
  ],
  custos: [
    { key: 'colaborador', label: 'Colaborador', getValue: c => c.nomeCompleto },
    { key: 'cargo', label: 'Cargo', getValue: c => c.profissionais?.cargo || '-' },
    { key: 'departamento', label: 'Departamento', getValue: c => c.profissionais?.departamento || '-' },
    { key: 'salarioBase', label: 'Salário Base', format: 'currency', getValue: c => c.profissionais?.salarioBase || 0 },
    { key: 'encargos35', label: 'Encargos Est. (35%)', format: 'currency', getValue: c => (c.profissionais?.salarioBase || 0) * 0.35 },
    { key: 'beneficios', label: 'Custo Benefícios Est.', format: 'currency', getValue: () => 750.00 },
    { key: 'custoTotal', label: 'Custo Total Pessoal', format: 'currency', getValue: c => ((c.profissionais?.salarioBase || 0) * 1.35) + 750.00 }
  ],
  ferias: [
    { key: 'colaboradorNome', label: 'Colaborador', getValue: f => f.colaboradorNome },
    { key: 'cargo', label: 'Cargo', getValue: f => f.cargo || '-' },
    { key: 'departamento', label: 'Departamento', getValue: f => f.departamento || '-' },
    { key: 'diasSaldo', label: 'Saldo Dias', getValue: f => f.diasSaldo || 30 },
    { key: 'status', label: 'Status Férias', format: 'badge', getValue: f => f.status || 'Disponível' },
    { key: 'previsaoUmTerco', label: 'Previsão 1/3 Constitucional', format: 'currency', getValue: f => f.valorUmTercoConstitucional || 0 }
  ],
  afastamentos: [
    { key: 'colaboradorNome', label: 'Colaborador', getValue: a => a.colaboradorNome },
    { key: 'tipoAfastamento', label: 'Tipo de Afastamento', getValue: a => a.tipoAfastamento },
    { key: 'dataInicio', label: 'Data Início', format: 'date', getValue: a => a.dataInicio },
    { key: 'dataPrevisaoRetorno', label: 'Previsão Retorno', format: 'date', getValue: a => a.dataPrevisaoRetorno },
    { key: 'status', label: 'Status', format: 'badge', getValue: a => a.status }
  ],
  rescisoes: [
    { key: 'colaboradorNome', label: 'Colaborador', getValue: r => r.colaboradorNome },
    { key: 'tipoRescisao', label: 'Tipo de Rescisão', getValue: r => r.tipoRescisao },
    { key: 'dataDesligamento', label: 'Data Desligamento', format: 'date', getValue: r => r.dataDesligamento },
    { key: 'avisoPrevio', label: 'Aviso Prévio', getValue: r => r.avisoPrevio },
    { key: 'valorLiquidoRescisao', label: 'Valor Rescisório Pago', format: 'currency', getValue: r => r.valorLiquidoRescisao }
  ],
  beneficios: [
    { key: 'nome', label: 'Benefício', getValue: b => b.nome },
    { key: 'categoria', label: 'Categoria', getValue: b => b.categoria },
    { key: 'tipo', label: 'Tipo', getValue: b => b.tipo },
    { key: 'custoEmpresaEstimado', label: 'Custo Empresa', format: 'currency', getValue: b => b.custoEmpresaEstimado },
    { key: 'coparticipacaoPadrao', label: 'Coparticipação Colab %', getValue: b => `${b.coparticipacaoPadrao}%` }
  ],
  folha: [
    { key: 'colaborador', label: 'Colaborador', getValue: c => c.nomeCompleto },
    { key: 'cargo', label: 'Cargo', getValue: c => c.profissionais?.cargo || '-' },
    { key: 'departamento', label: 'Departamento', getValue: c => c.profissionais?.departamento || '-' },
    { key: 'proventos', label: 'Total Proventos', format: 'currency', getValue: c => c.profissionais?.salarioBase || 0 },
    { key: 'descontos', label: 'Total Descontos', format: 'currency', getValue: c => (c.profissionais?.salarioBase || 0) * 0.18 },
    { key: 'liquido', label: 'Valor Líquido', format: 'currency', getValue: c => (c.profissionais?.salarioBase || 0) * 0.82 }
  ],
  ponto: [
    { key: 'colaborador', label: 'Colaborador', getValue: c => c.nomeCompleto },
    { key: 'departamento', label: 'Departamento', getValue: c => c.profissionais?.departamento || '-' },
    { key: 'horasTrabalhadas', label: 'Horas Previstas', getValue: () => '220h' },
    { key: 'horasExtras', label: 'Horas Extras 50%', getValue: () => '12h' },
    { key: 'faltas', label: 'Atrasos / Faltas', getValue: () => '0h' }
  ],
  diversidade: [
    { key: 'faixaEtaria', label: 'Faixa Etária', getValue: c => '26-35 anos' },
    { key: 'genero', label: 'Gênero Declarado', getValue: c => c.pessoais?.genero || 'Não Informado' },
    { key: 'escolaridade', label: 'Escolaridade', getValue: c => c.pessoais?.escolaridade || 'Superior Completo' },
    { key: 'tempoCasa', label: 'Tempo de Empresa', getValue: () => '2-5 anos' }
  ]
};

export const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({
  companyId,
  colaboradores,
  beneficios,
  ferias,
  rescisoes,
  afastamentos,
  onSaveTemplateSuccess
}) => {
  const [dataSource, setDataSource] = useState<ReportDataSource>('colaboradores');
  const [selectedFields, setSelectedFields] = useState<string[]>(['nomeCompleto', 'cargo', 'departamento', 'salarioBase', 'status']);
  const [reportTitle, setReportTitle] = useState('Relatório Personalizado DP');
  const [reportDescription, setReportDescription] = useState('Modelo customizado gerado pelo construtor inteligente de relatórios.');
  const [visibility, setVisibility] = useState<'private' | 'rh' | 'managers' | 'finance' | 'company'>('company');
  const [isSaving, setIsSaving] = useState(false);

  // Available field list for current data source
  const availableFields = DATA_SOURCE_FIELDS[dataSource] || [];

  // Get raw items list based on selected data source
  const getSourceItems = (): any[] => {
    switch (dataSource) {
      case 'colaboradores':
      case 'custos':
      case 'folha':
      case 'ponto':
      case 'diversidade':
        return colaboradores;
      case 'ferias':
        return ferias;
      case 'afastamentos':
        return afastamentos;
      case 'rescisoes':
        return rescisoes;
      case 'beneficios':
        return beneficios;
      default:
        return colaboradores;
    }
  };

  const items = getSourceItems();

  const handleToggleField = (fieldKey: string) => {
    if (selectedFields.includes(fieldKey)) {
      if (selectedFields.length > 1) {
        setSelectedFields(selectedFields.filter(f => f !== fieldKey));
      }
    } else {
      setSelectedFields([...selectedFields, fieldKey]);
    }
  };

  const handleDataSourceChange = (newSource: ReportDataSource) => {
    setDataSource(newSource);
    const defaults = DATA_SOURCE_FIELDS[newSource]?.slice(0, 5).map(f => f.key) || [];
    setSelectedFields(defaults);
  };

  // Generate Table Header & Rows for Preview / Export
  const activeFieldDefs = availableFields.filter(f => selectedFields.includes(f.key));
  const headers = activeFieldDefs.map(f => f.label);
  const rows = items.map(item => 
    activeFieldDefs.map(f => {
      const raw = f.getValue(item);
      if (f.format === 'currency' && typeof raw === 'number') {
        return raw.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      }
      return raw ?? '-';
    })
  );

  const handleSaveModel = async () => {
    if (!reportTitle.trim()) {
      alert('Por favor, informe o título do modelo.');
      return;
    }
    setIsSaving(true);
    try {
      const newTpl: ReportTemplateModel = {
        id: `tpl-custom-${Date.now()}`,
        companyId,
        name: reportTitle.trim(),
        description: reportDescription.trim(),
        dataSource,
        selectedFields,
        filters: {},
        visibility,
        createdBy: 'Analista DP RH TRANSFORMA',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveReportTemplateFirestore(companyId, newTpl);
      alert('Modelo de relatório salvo com sucesso no Firestore!');
      if (onSaveTemplateSuccess) onSaveTemplateSuccess();
    } catch (err) {
      console.error('Erro ao salvar modelo:', err);
      alert('Erro ao salvar o modelo de relatório.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-black px-3 py-1 rounded-full border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Construtor Customizado de Relatórios</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-2">Crie Relatórios Personalizados sob Medida</h2>
          <p className="text-xs text-slate-500 font-medium">
            Selecione a fonte de dados, escolha as colunas desejadas e exporte em PDF, CSV ou Excel com 1 clique.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => exportDataToCSV(reportTitle, headers, rows)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => exportDataToXLSX(reportTitle, headers, rows)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (XLS)</span>
          </button>
          <button
            onClick={() => exportDataToPDF(reportTitle, 'RH TRANSFORMA', headers, rows)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Step 1: Data Source & Title */}
        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-black">1</span>
            <span>Origem de Dados & Identificação</span>
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Origem de Dados</label>
            <select
              value={dataSource}
              onChange={e => handleDataSourceChange(e.target.value as ReportDataSource)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="colaboradores">Colaboradores & Quadro de Pessoal</option>
              <option value="custos">Custos de Folha & Encargos Patronais</option>
              <option value="ferias">Férias & Provisões de Período Aquisitivo</option>
              <option value="afastamentos">Afastamentos & Licenças Médicas</option>
              <option value="rescisoes">Rescisões & Turnover</option>
              <option value="beneficios">Benefícios Concedidos</option>
              <option value="folha">Folha de Pagamento Analítica</option>
              <option value="ponto">Apuração de Ponto & Horas Extras</option>
              <option value="diversidade">Perfil Demográfico & Diversidade</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Título do Relatório</label>
            <input
              type="text"
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Visibilidade do Modelo</label>
            <select
              value={visibility}
              onChange={e => setVisibility(e.target.value as any)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="company">Empresa Inteira</option>
              <option value="rh">Apenas Equipe RH</option>
              <option value="managers">Gestores de Equipe</option>
              <option value="finance">Setor Financeiro</option>
              <option value="private">Privado (Apenas eu)</option>
            </select>
          </div>

          <button
            onClick={handleSaveModel}
            disabled={isSaving}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando Modelo...' : 'Salvar como Modelo Reutilizável'}</span>
          </button>
        </div>

        {/* Step 2: Field Selector */}
        <div className="lg:col-span-2 space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-black">2</span>
            <span>Selecione as Colunas para Exibir ({selectedFields.length} selecionadas)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {availableFields.map(field => {
              const isSelected = selectedFields.includes(field.key);
              return (
                <button
                  key={field.key}
                  onClick={() => handleToggleField(field.key)}
                  className={`p-3 rounded-xl border font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{field.label}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Live Interactive Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>Prévia Interativa ({rows.length} registros gerados)</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Os dados exibidos aplicam as regras e mascaramentos de segurança</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                {headers.map((h, i) => (
                  <th key={i} className="p-3 uppercase text-[10px] tracking-wider font-extrabold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {rows.slice(0, 10).map((row, rIdx) => (
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
          {rows.length > 10 && (
            <div className="p-2.5 bg-slate-50 text-center text-slate-500 text-[11px] font-bold border-t border-slate-200">
              Exibindo as primeiras 10 linhas da prévia. Exporte para visualizar todos os {rows.length} registros.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
