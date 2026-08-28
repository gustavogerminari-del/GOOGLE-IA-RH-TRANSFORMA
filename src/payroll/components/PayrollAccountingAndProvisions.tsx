import React from 'react';
import { Landmark, PieChart, Calculator, FileCheck, Layers } from 'lucide-react';
import { Paystub, PayrollPeriod } from '../types/payroll';

interface PayrollAccountingAndProvisionsProps {
  period?: PayrollPeriod | null;
  paystubs: Paystub[];
}

export const PayrollAccountingAndProvisions: React.FC<PayrollAccountingAndProvisionsProps> = ({ period, paystubs }) => {
  const totalSalarios = paystubs.reduce((a, b) => a + (b.salarioBase || 0), 0);
  const totalProventos = paystubs.reduce((a, b) => a + (b.totalProventos || 0), 0);
  const totalDescontos = paystubs.reduce((a, b) => a + (b.totalDescontos || 0), 0);
  const totalLiquido = paystubs.reduce((a, b) => a + (b.valorLiquido || 0), 0);

  const totalINSSSegurados = paystubs.reduce((a, b) => a + (b.valorINSS || 0), 0);
  const totalIRRF = paystubs.reduce((a, b) => a + (b.valorIRRF || 0), 0);
  const totalFGTS = paystubs.reduce((a, b) => a + (b.valorFGTS || 0), 0);

  const inssPatronal = totalProventos * 0.20;
  const ratSat = totalProventos * 0.02;
  const terceiros = totalProventos * 0.058;
  const totalPatronal = inssPatronal + ratSat + terceiros;

  // Provisões Férias (1/12 + 1/3 constitutional + FGTS 8%)
  const provisaoFeriasSimples = totalProventos / 12;
  const tercoConstitucional = provisaoFeriasSimples / 3;
  const provisaoFeriasTotal = provisaoFeriasSimples + tercoConstitucional;
  const fgtsProvisaoFerias = provisaoFeriasTotal * 0.08;
  const inssProvisaoFerias = provisaoFeriasTotal * 0.278;

  // Provisões 13º Salário (1/12 + FGTS 8% + INSS 27.8%)
  const provisao13Simples = totalProventos / 12;
  const fgtsProvisao13 = provisao13Simples * 0.08;
  const inssProvisao13 = provisao13Simples * 0.278;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        
        <div className="border-b border-slate-200 pb-4">
          <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px] font-black uppercase">
            Controladoria, Contabilidade & Provisões Trabalhistas
          </span>
          <h2 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-violet-600" />
            Demonstrativo Contábil & Provisões de Passivo (Férias / 13º)
          </h2>
          <p className="text-xs text-slate-500">
            Mapeamento de débito/crédito, apuração de encargos sociais e acúmulo mensal de provisões trabalhistas.
          </p>
        </div>

        {/* Resumo de Custos Totais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Custo Total Folha (Empresa)</span>
            <div className="text-2xl font-black text-white">
              R$ {(totalProventos + totalPatronal + totalFGTS).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400">Proventos + Encargos + FGTS</span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Folha Bruta (Proventos)</span>
            <div className="text-xl font-extrabold text-slate-900">
              R$ {totalProventos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400">Salários + Adicionais</span>
          </div>

          <div className="p-4 rounded-2xl border border-violet-200 bg-violet-50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-violet-700">INSS Patronal + Outras Entidades</span>
            <div className="text-xl font-extrabold text-violet-900">
              R$ {totalPatronal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-violet-600">INSS 20% + RAT 2% + Terceiros 5,8%</span>
          </div>

          <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-blue-700">Depósito FGTS Mês</span>
            <div className="text-xl font-extrabold text-blue-900">
              R$ {totalFGTS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-blue-600">8,0% s/ folha tributável</span>
          </div>
        </div>

        {/* Lançamentos Contábeis de Débito e Crédito */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-violet-600" />
            Plano de Contas & Lançamentos da Folha (Débito / Crédito)
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <th className="p-3">Conta Contábil</th>
                  <th className="p-3">Histórico / Rúbrica</th>
                  <th className="p-3 text-right">Débito (R$)</th>
                  <th className="p-3 text-right">Crédito (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                <tr>
                  <td className="p-3 font-mono text-slate-500">4.1.1.01.001</td>
                  <td className="p-3 font-bold text-slate-900">Despesas com Salários e Ordenados</td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    R$ {totalProventos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-slate-400">-</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-slate-500">2.1.2.01.001</td>
                  <td className="p-3 font-bold text-slate-900">Salários a Pagar (Líquido)</td>
                  <td className="p-3 text-right text-slate-400">-</td>
                  <td className="p-3 text-right font-bold text-emerald-700">
                    R$ {totalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-slate-500">2.1.2.02.001</td>
                  <td className="p-3 font-bold text-slate-900">INSS a Recolher (Segurados + Patronal)</td>
                  <td className="p-3 text-right text-slate-400">-</td>
                  <td className="p-3 text-right font-bold text-violet-700">
                    R$ {(totalINSSSegurados + totalPatronal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-slate-500">2.1.2.02.002</td>
                  <td className="p-3 font-bold text-slate-900">IRRF a Recolher (Retenção na Fonte)</td>
                  <td className="p-3 text-right text-slate-400">-</td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    R$ {totalIRRF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-slate-500">2.1.2.02.003</td>
                  <td className="p-3 font-bold text-slate-900">FGTS a Recolher (Caixa Econômica)</td>
                  <td className="p-3 text-right text-slate-400">-</td>
                  <td className="p-3 text-right font-bold text-blue-700">
                    R$ {totalFGTS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Quadro de Provisões de Passivo Trabalhista */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <Calculator className="w-4 h-4 text-violet-600" />
            Acúmulo de Provisões Mensais (Férias + 1/3 e 13º Salário)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Provisão Férias */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-black text-slate-900 uppercase">Provisão de Férias + 1/3 (1/12 avos)</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px] font-bold">
                  Competência Atual
                </span>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span>Valor 1/12 Férias:</span>
                  <span className="font-bold">R$ {provisaoFeriasSimples.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>1/3 Constitucional:</span>
                  <span className="font-bold">R$ {tercoConstitucional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Encargos Patronais s/ Férias (27,8%):</span>
                  <span className="font-bold">R$ {inssProvisaoFerias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>FGTS s/ Férias (8,0%):</span>
                  <span className="font-bold">R$ {fgtsProvisaoFerias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-slate-900 text-sm">
                  <span>Provisão Total Férias no Mês:</span>
                  <span className="text-violet-700">
                    R$ {(provisaoFeriasTotal + inssProvisaoFerias + fgtsProvisaoFerias).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Provisão 13º */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-black text-slate-900 uppercase">Provisão de 13º Salário (1/12 avos)</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px] font-bold">
                  Competência Atual
                </span>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span>Valor 1/12 13º Salário:</span>
                  <span className="font-bold">R$ {provisao13Simples.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Encargos Patronais s/ 13º (27,8%):</span>
                  <span className="font-bold">R$ {inssProvisao13.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>FGTS s/ 13º (8,0%):</span>
                  <span className="font-bold">R$ {fgtsProvisao13.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-slate-900 text-sm">
                  <span>Provisão Total 13º no Mês:</span>
                  <span className="text-violet-700">
                    R$ {(provisao13Simples + inssProvisao13 + fgtsProvisao13).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
