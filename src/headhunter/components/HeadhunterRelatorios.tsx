import React, { useState } from 'react';
import { 
  BarChart2, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Briefcase, 
  DollarSign, 
  Clock,
  Award
} from 'lucide-react';

interface HeadhunterRelatoriosProps {
  onOpenAiModal: (type: string, data?: any) => void;
}

export const HeadhunterRelatorios: React.FC<HeadhunterRelatoriosProps> = ({ onOpenAiModal }) => {
  const [reportType, setReportType] = useState('Desempenho Geral');

  const handleExportExcel = () => {
    alert('Exportando Relatório para Excel/CSV...');
  };

  const handleExportPdf = () => {
    alert('Gerando Relatório Executivo em PDF...');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Relatórios & Inteligência de Executive Search</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Relatórios consolidados de SLAs, conversão de candidatos, receita por cliente, ranking de consultores e tempo médio de fechamento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar PDF</span>
          </button>
        </div>
      </div>

      {/* REPORT TYPE SELECTOR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2 overflow-x-auto">
        {[
          'Desempenho Geral',
          'Clientes & Receitas',
          'Vagas & SLAs',
          'Consultores & Ranking',
          'Comissões & Financeiro',
          'Despesas & Lucro'
        ].map(type => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              reportType === type
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* REPORT METRICS PREVIEW */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-black text-slate-900">Relatório Executivo: {reportType}</h3>
          <span className="text-xs text-slate-400 font-medium">Período: Ano Vigente 2026</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-bold block">Tempo Médio de Fechamento</span>
            <strong className="text-2xl font-black text-indigo-600 block mt-1">34 Dias</strong>
            <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Meta de SLA: 45 Dias</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-bold block">Taxa Geral de Conversão</span>
            <strong className="text-2xl font-black text-emerald-600 block mt-1">84%</strong>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">Entrevistas x Contratações</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-bold block">Ticket Médio por Vaga</span>
            <strong className="text-2xl font-black text-slate-900 block mt-1">R$ 38.000</strong>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">Vagas de Executive Search</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-bold block">Retorno Sobre Investimento (ROI)</span>
            <strong className="text-2xl font-black text-slate-900 block mt-1">12.4x</strong>
            <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Margem Operacional Elevada</span>
          </div>
        </div>
      </div>
    </div>
  );
};
