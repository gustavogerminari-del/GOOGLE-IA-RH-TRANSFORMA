import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Download, 
  CheckSquare, 
  User, 
  Clock, 
  Search, 
  Printer, 
  BarChart2, 
  Lock 
} from 'lucide-react';

import { AuditoriaSstLog, InspecaoChecklistSST } from '../types/sstTypes';

interface SstAuditoriaRelatoriosProps {
  logs: AuditoriaSstLog[];
}

export const SstAuditoriaRelatorios: React.FC<SstAuditoriaRelatoriosProps> = ({ logs }) => {
  const [activeTab, setActiveTab] = useState<'auditoria' | 'relatorios' | 'inspecoes'>('auditoria');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(l => 
    l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.detalhes.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.entidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = (tipo: string) => {
    alert(`Exportando relatório de ${tipo} em formato CSV...`);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'auditoria'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Trilha de Auditoria ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('relatorios')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'relatorios'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Relatórios Obrigatórios & e-Social
          </button>
          <button
            onClick={() => setActiveTab('inspecoes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inspecoes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Inspeções & Checklists
          </button>
        </div>
      </div>

      {/* Tab Trilha de Auditoria */}
      {activeTab === 'auditoria' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="text" 
              placeholder="Filtrar por usuário, ação ou detalhe..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Trilha Inviolável de Logs SST (Audit Trail)</h3>
              </div>
              <span className="text-xs text-slate-500">Conformidade LGPD & e-Social</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                    <th className="p-3.5">Data / Hora</th>
                    <th className="p-3.5">Usuário Responsável</th>
                    <th className="p-3.5">Entidade</th>
                    <th className="p-3.5">Ação Realizada</th>
                    <th className="p-3.5">Detalhes da Operação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {log.timestamp.replace('T', ' ').substring(0, 19)}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {log.userName}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">
                          {log.entidade}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-indigo-700">
                        {log.acao}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {log.detalhes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Relatórios */}
      {activeTab === 'relatorios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Relatório Anual do PCMSO</span>
            </div>
            <p className="text-xs text-slate-500">
              Quadro resumo com dados estatísticos dos exames realizados, natureza dos exames e taxas de aptidão conforme a NR-07.
            </p>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => handleExportCSV('PCMSO_Anual')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Ficha de Controle de EPIs por Setor</span>
            </div>
            <p className="text-xs text-slate-500">
              Listagem consolidada das entregas ativas de equipamentos, números de CA e validades de troca.
            </p>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => handleExportCSV('EPIs_Setor')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileText className="w-5 h-5 text-rose-600" />
              <span>Indicadores de Sinistreidade (TF / TG)</span>
            </div>
            <p className="text-xs text-slate-500">
              Histórico de acidentes de trabalho, dias perdidos e cálculo de taxa de frequência/gravidade.
            </p>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => handleExportCSV('TF_TG_Acidentes')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Inspeções */}
      {activeTab === 'inspecoes' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Inspeções de Campo e Checklists Ocupacionais</h3>
            </div>
            <button 
              onClick={() => alert('Abrindo formulário de nova inspeção...')}
              className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Nova Inspeção
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900">Inspeção Trimestral de Extintores e Mangueiras</p>
            <p>Realizada em 10/01/2025 pelo Eng. Roberto Silva • Status: <strong className="text-emerald-700">Regularizada (0 não conformidades)</strong></p>
          </div>
        </div>
      )}
    </div>
  );
};
