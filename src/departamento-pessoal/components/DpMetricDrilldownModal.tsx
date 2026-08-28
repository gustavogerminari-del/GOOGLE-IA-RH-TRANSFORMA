import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Download, 
  Info, 
  FileSpreadsheet, 
  Calculator, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { DPKpiDrilldownData } from '../types/dp';
import { exportDataToCSV, exportDataToXLSX } from '../services/dpAnalyticsService';

interface DpMetricDrilldownModalProps {
  data: DPKpiDrilldownData | null;
  onClose: () => void;
}

export const DpMetricDrilldownModal: React.FC<DpMetricDrilldownModalProps> = ({
  data,
  onClose
}) => {
  if (!data) return null;

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter items based on search
  const filteredItems = data.items.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(item).some(val => 
      String(val || '').toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportCSV = () => {
    const headers = data.columns.map(c => c.label);
    const rows = filteredItems.map(item => 
      data.columns.map(col => item[col.key] ?? '-')
    );
    exportDataToCSV(`Detalhamento_${data.metricKey}`, headers, rows);
  };

  const handleExportXLSX = () => {
    const headers = data.columns.map(c => c.label);
    const rows = filteredItems.map(item => 
      data.columns.map(col => item[col.key] ?? '-')
    );
    exportDataToXLSX(`Detalhamento_${data.metricKey}`, headers, rows);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-indigo-400/30">
              <Calculator className="w-3.5 h-3.5" />
              <span>Conferência Detalhada e Auditável</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{data.title}</h2>
            <p className="text-xs text-slate-300 font-medium">
              Fórmula Oficial: <strong className="text-indigo-300">{data.formula}</strong> • Período: {data.periodLabel}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar registros no detalhamento..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="font-bold text-slate-600 mr-2">
              Total: <strong className="text-indigo-600 text-sm">{data.totalCount}</strong> registros
              {data.totalValue !== undefined && (
                <span className="ml-2 text-emerald-700 font-mono">
                  ({data.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                </span>
              )}
            </span>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportXLSX}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (XLS)</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {paginatedItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Info className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600">Nenhum registro encontrado para este indicador.</p>
              <p className="text-slate-400 text-[11px]">Tente redefinir o termo de busca ou ajustar os filtros globais.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    {data.columns.map(col => (
                      <th key={col.key} className="p-3 uppercase text-[10px] tracking-wider font-extrabold">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {paginatedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      {data.columns.map(col => {
                        const val = item[col.key];
                        let renderedVal = val ?? '-';

                        if (col.format === 'currency' && typeof val === 'number') {
                          renderedVal = val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        } else if (col.format === 'badge') {
                          return (
                            <td key={col.key} className="p-3">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {String(val || 'N/A')}
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td key={col.key} className={`p-3 ${col.format === 'currency' ? 'font-mono font-bold text-slate-900' : ''}`}>
                            {renderedVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer / Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Dados reais auditados pelo motor Firebase RH TRANSFORMA</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
