import React, { useState } from 'react';
import { FileSpreadsheet, Printer, Download, BarChart2, Users, DollarSign, ShieldAlert, FileText } from 'lucide-react';
import { Paystub, PayrollPeriod } from '../types/payroll';

interface PayrollReportsAndDashboardProps {
  period?: PayrollPeriod | null;
  paystubs: Paystub[];
}

export const PayrollReportsAndDashboard: React.FC<PayrollReportsAndDashboardProps> = ({ period, paystubs }) => {
  const [reportType, setReportType] = useState<'analitica' | 'sintetica' | 'impostos' | 'bancaria'>('analitica');

  const totalProventos = paystubs.reduce((a, b) => a + (b.totalProventos || 0), 0);
  const totalDescontos = paystubs.reduce((a, b) => a + (b.totalDescontos || 0), 0);
  const totalLiquido = paystubs.reduce((a, b) => a + (b.valorLiquido || 0), 0);
  const totalINSS = paystubs.reduce((a, b) => a + (b.valorINSS || 0), 0);
  const totalIRRF = paystubs.reduce((a, b) => a + (b.valorIRRF || 0), 0);
  const totalFGTS = paystubs.reduce((a, b) => a + (b.valorFGTS || 0), 0);

  const handleExportCSV = () => {
    let csv = 'Colaborador;CPF;Cargo;Departamento;Salario Base;Proventos;Descontos;Liquido;INSS;IRRF;FGTS\n';
    paystubs.forEach(p => {
      csv += `"${p.employeeName}";"${p.cpf}";"${p.cargo}";"${p.departamento}";${p.salarioBase};${p.totalProventos};${p.totalDescontos};${p.valorLiquido};${p.valorINSS};${p.valorIRRF};${p.valorFGTS}\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RELATORIO_FOLHA_${period?.referenceMonth || 'COMPETENCIA'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase">
              Relatórios Executivos & Guia de Impostos
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              Relatórios e Indicadores Consolidados da Folha
            </h2>
            <p className="text-xs text-slate-500">
              Folha Analítica, Folha Sintética, Relação de Impostos e Exportação em Planilha.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel (CSV)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Tipos de Relatórios */}
        <div className="flex border-b border-slate-200 text-xs font-bold space-x-4">
          <button
            onClick={() => setReportType('analitica')}
            className={`pb-2 border-b-2 cursor-pointer transition-all ${
              reportType === 'analitica'
                ? 'border-indigo-600 text-indigo-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Folha Analítica Detalhada
          </button>
          <button
            onClick={() => setReportType('sintetica')}
            className={`pb-2 border-b-2 cursor-pointer transition-all ${
              reportType === 'sintetica'
                ? 'border-indigo-600 text-indigo-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Resumo Sintético por Departamento
          </button>
          <button
            onClick={() => setReportType('impostos')}
            className={`pb-2 border-b-2 cursor-pointer transition-all ${
              reportType === 'impostos'
                ? 'border-indigo-600 text-indigo-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Resumo de Impostos & Encargos
          </button>
          <button
            onClick={() => setReportType('bancaria')}
            className={`pb-2 border-b-2 cursor-pointer transition-all ${
              reportType === 'bancaria'
                ? 'border-indigo-600 text-indigo-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Relação Bancária de Salários
          </button>
        </div>

        {/* 1. Folha Analítica */}
        {reportType === 'analitica' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <th className="p-3">Colaborador / CPF</th>
                  <th className="p-3">Cargo / Dep.</th>
                  <th className="p-3 text-right">Salário Base</th>
                  <th className="p-3 text-right">Proventos</th>
                  <th className="p-3 text-right">Descontos</th>
                  <th className="p-3 text-right">Líquido</th>
                  <th className="p-3 text-right">INSS</th>
                  <th className="p-3 text-right">IRRF</th>
                  <th className="p-3 text-right">FGTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {paystubs.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">
                      <div>{p.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">{p.cpf}</div>
                    </td>
                    <td className="p-3 text-slate-600">
                      <div>{p.cargo}</div>
                      <div className="text-[10px] text-slate-400">{p.departamento}</div>
                    </td>
                    <td className="p-3 text-right text-slate-700">
                      R$ {(p.salarioBase || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-extrabold text-emerald-700">
                      R$ {(p.totalProventos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-extrabold text-rose-700">
                      R$ {(p.totalDescontos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900 bg-slate-50">
                      R$ {(p.valorLiquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right text-slate-600">
                      R$ {(p.valorINSS || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right text-slate-600">
                      R$ {(p.valorIRRF || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right text-blue-700 font-bold">
                      R$ {(p.valorFGTS || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Folha Sintética por Departamento */}
        {reportType === 'sintetica' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <th className="p-3">Departamento</th>
                  <th className="p-3 text-center">Colaboradores</th>
                  <th className="p-3 text-right">Total Proventos</th>
                  <th className="p-3 text-right">Total Descontos</th>
                  <th className="p-3 text-right">Total Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {Array.from(new Set(paystubs.map(p => p.departamento || 'Geral'))).map(dep => {
                  const list = paystubs.filter(p => (p.departamento || 'Geral') === dep);
                  const depGross = list.reduce((a, b) => a + (b.totalProventos || 0), 0);
                  const depDisc = list.reduce((a, b) => a + (b.totalDescontos || 0), 0);
                  const depNet = list.reduce((a, b) => a + (b.valorLiquido || 0), 0);
                  return (
                    <tr key={dep} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{dep}</td>
                      <td className="p-3 text-center font-extrabold text-slate-700">{list.length}</td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        R$ {depGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-bold text-rose-700">
                        R$ {depDisc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">
                        R$ {depNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Impostos */}
        {reportType === 'impostos' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-black text-slate-900 uppercase">INSS (Previdência)</span>
              <div className="text-xl font-black text-violet-900">
                R$ {(totalINSS + totalProventos * 0.278).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Retido do Empregado:</span>
                  <span className="font-bold">R$ {totalINSS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Patronal (27,8%):</span>
                  <span className="font-bold">R$ {(totalProventos * 0.278).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-black text-slate-900 uppercase">IRRF (Imposto de Renda)</span>
              <div className="text-xl font-black text-slate-900">
                R$ {totalIRRF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-slate-500">
                Retido na fonte sobre salários e rendimentos tributáveis do mês.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-black text-slate-900 uppercase">FGTS (Gia / Caixa)</span>
              <div className="text-xl font-black text-blue-900">
                R$ {totalFGTS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-slate-500">
                Alíquota de 8% incidente sobre a folha tributável depositada via FGTS Digital.
              </p>
            </div>
          </div>
        )}

        {/* 4. Relação Bancária */}
        {reportType === 'bancaria' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <th className="p-3">Favorecido</th>
                  <th className="p-3">CPF</th>
                  <th className="p-3">Banco / Agência / Conta</th>
                  <th className="p-3 text-right">Valor Líquido (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {paystubs.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{p.employeeName}</td>
                    <td className="p-3 font-mono text-slate-600">{p.cpf}</td>
                    <td className="p-3 font-mono text-slate-600">
                      {p.bancoInfo?.banco || '341 Itaú'} | Ag: {p.bancoInfo?.agencia || '0001'} | CC: {p.bancoInfo?.conta || '12345-6'}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-800">
                      R$ {(p.valorLiquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};
