import React, { useState } from 'react';
import { 
  Calculator, 
  X, 
  DollarSign, 
  Percent, 
  Building2, 
  ShieldCheck, 
  Check, 
  Info,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { 
  calculateINSS, 
  calculateIRRF, 
  calculateFGTS, 
  calculateEmployerCharges, 
  calculateOvertime, 
  calculateInsalubridade, 
  calculatePericulosidade, 
  calculateDSR,
  MINIMUM_WAGE_2026 
} from '../services/payrollCalculations';

interface PayrollSimulatorModalProps {
  onClose: () => void;
}

export const PayrollSimulatorModal: React.FC<PayrollSimulatorModalProps> = ({ onClose }) => {
  const [salary, setSalary] = useState<number>(6500);
  const [dependents, setDependents] = useState<number>(1);
  const [pensao, setPensao] = useState<number>(0);
  const [hours50, setHours50] = useState<number>(10);
  const [hours100, setHours100] = useState<number>(0);
  const [insalubridadeDegree, setInsalubridadeDegree] = useState<'0%' | '10%' | '20%' | '40%'>('0%');
  const [hasPericulosidade, setHasPericulosidade] = useState<boolean>(false);

  // Calculations
  const overtime = calculateOvertime(salary, hours50, hours100);
  const insalubridade = insalubridadeDegree !== '0%' ? calculateInsalubridade(insalubridadeDegree) : 0;
  const periculosidade = hasPericulosidade ? calculatePericulosidade(salary) : 0;
  const dsr = calculateDSR(overtime.totalOvertime, 25, 5);

  const grossSalary = salary + overtime.totalOvertime + insalubridade + periculosidade + dsr;

  const inss = calculateINSS(grossSalary);
  const irrf = calculateIRRF(grossSalary, inss.amount, dependents, pensao);
  const fgts = calculateFGTS(grossSalary);
  const employer = calculateEmployerCharges(grossSalary);

  const totalDiscounts = inss.amount + irrf.amount + pensao;
  const netSalary = grossSalary - totalDiscounts;
  const totalCompanyCost = grossSalary + employer.totalPatronal + employer.fgtsValor;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black">Simulador CLT & Custo de Contratação 2026</h2>
              <p className="text-xs text-slate-300">Cálculo em tempo real de proventos, descontos de INSS/IRRF e custo patronal da empresa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
          
          {/* Inputs Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              Parâmetros do Colaborador
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Salário Base (R$)</label>
                <input
                  type="number"
                  value={salary}
                  onChange={e => setSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-extrabold text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Número de Dependentes IRRF</label>
                <input
                  type="number"
                  min="0"
                  value={dependents}
                  onChange={e => setDependents(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pensão Alimentícia (R$)</label>
                <input
                  type="number"
                  value={pensao}
                  onChange={e => setPensao(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Horas Extras 50% (Horas)</label>
                <input
                  type="number"
                  value={hours50}
                  onChange={e => setHours50(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Horas Extras 100% (Horas)</label>
                <input
                  type="number"
                  value={hours100}
                  onChange={e => setHours100(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adicional de Insalubridade</label>
                <select
                  value={insalubridadeDegree}
                  onChange={e => setInsalubridadeDegree(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold"
                >
                  <option value="0%">Não possui (0%)</option>
                  <option value="10%">Grau Mínimo (10% = R$ 151,80)</option>
                  <option value="20%">Grau Médio (20% = R$ 303,60)</option>
                  <option value="40%">Grau Máximo (40% = R$ 607,20)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="periculosidade"
                checked={hasPericulosidade}
                onChange={e => setHasPericulosidade(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="periculosidade" className="font-bold text-slate-800 cursor-pointer">
                Adicional de Periculosidade (30% sobre o Salário Base = R$ {calculatePericulosidade(salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
              </label>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Colaborador View */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3 shadow-xs">
              <h4 className="font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Holerite do Colaborador</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">Líquido</span>
              </h4>

              <div className="space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-600">Salário Base:</span>
                  <span className="font-bold">R$ {salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                {overtime.totalOvertime > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Horas Extras (50%/100%):</span>
                    <span>+ R$ {overtime.totalOvertime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {insalubridade > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Insalubridade ({insalubridadeDegree}):</span>
                    <span>+ R$ {insalubridade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {periculosidade > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Periculosidade (30%):</span>
                    <span>+ R$ {periculosidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {dsr > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>DSR sobre Variáveis:</span>
                    <span>+ R$ {dsr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between pt-1 border-t border-slate-200 font-extrabold text-slate-900">
                  <span>Total Bruto (Proventos):</span>
                  <span>R$ {grossSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-rose-700 pt-2">
                  <span>INSS (Faixas {inss.effectiveRate}%):</span>
                  <span>- R$ {inss.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>IRRF ({irrf.ratePercent}%):</span>
                  <span>- R$ {irrf.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-indigo-700 font-bold pt-1">
                  <span>FGTS (8% na conta vinculada):</span>
                  <span>R$ {fgts.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="bg-emerald-600 text-white rounded-xl p-3 text-center mt-3 shadow-md">
                <span className="text-[10px] text-emerald-100 uppercase font-black block">Salário Líquido na Conta</span>
                <span className="text-xl font-black">R$ {netSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Empresa View */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-900 text-white space-y-3 shadow-xs">
              <h4 className="font-black border-b border-slate-800 pb-2 flex items-center justify-between text-slate-100">
                <span>Encargos Patronais da Empresa</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-bold">Custo Total</span>
              </h4>

              <div className="space-y-1.5 text-slate-300 font-medium">
                <div className="flex justify-between">
                  <span>Remuneração Bruta:</span>
                  <span className="font-bold text-white">R$ {grossSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>INSS Patronal (20%):</span>
                  <span className="font-bold text-amber-400">R$ {employer.inssPatronal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>RAT / SAT (2%):</span>
                  <span className="font-bold text-amber-400">R$ {employer.ratSat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Terceiros (Sesc/Senai 5,8%):</span>
                  <span className="font-bold text-amber-400">R$ {employer.terceiros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-200">
                  <span>Total Encargos Sociais (27,8%):</span>
                  <span className="font-bold text-amber-300">R$ {employer.totalPatronal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-indigo-300">
                  <span>FGTS Empresa (8%):</span>
                  <span className="font-bold">R$ {employer.fgtsValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="bg-indigo-600 rounded-xl p-3 text-center mt-3 shadow-md">
                <span className="text-[10px] text-indigo-200 uppercase font-black block">CUSTO TOTAL MENSAL DA EMPRESA</span>
                <span className="text-xl font-black text-white">R$ {totalCompanyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

          </div>

          <div className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Cálculos em conformidade integral com a Medida Provisória e Portarias MTE de 2026. A tributação de IRRF considera automaticamente a regra do abatimento simplificado de R$ 564,80 para garantir a menor retenção na fonte do colaborador.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
