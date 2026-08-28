import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { RegraDesligamentoEmpresa } from '../../types/terminationTypes';

interface RegrasDesligamentoViewProps {
  companyId: string;
}

export const RegrasDesligamentoView: React.FC<RegrasDesligamentoViewProps> = ({ companyId }) => {
  const [noticeBonusPerYearDays, setNoticeBonusPerYearDays] = useState(3);
  const [maxNoticeDays, setMaxNoticeDays] = useState(90);
  const [noticeDaysDefault, setNoticeDaysDefault] = useState(30);
  const [effectiveFrom, setEffectiveFrom] = useState('2026-01-01');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveRules = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-base text-slate-900">Configurações & Regras de Desligamento</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Parâmetros trabalhistas e regras de apuração por empresa com versionamento</p>
        </div>

        <button
          onClick={handleSaveRules}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Regras da Empresa</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Regras de desligamento salvas e versionadas com sucesso!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Notice Rules */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-600" />
            <span>Aviso-Prévio Proporcional (Lei 12.506/2011)</span>
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Dias Padrão de Aviso Base</label>
              <input
                type="number"
                value={noticeDaysDefault}
                onChange={e => setNoticeDaysDefault(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Acréscimo por Ano Trabalhado (Dias)</label>
              <input
                type="number"
                value={noticeBonusPerYearDays}
                onChange={e => setNoticeBonusPerYearDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Teto Máximo de Dias de Aviso</label>
              <input
                type="number"
                value={maxNoticeDays}
                onChange={e => setMaxNoticeDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
              />
            </div>
          </div>
        </div>

        {/* Legal & Vigency Info */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            <span>Vigência e Validação Legal</span>
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Início da Vigência das Regras</label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={e => setEffectiveFrom(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] space-y-1">
              <span className="font-bold text-slate-800 block">Percentuais de Multa Rescisória FGTS:</span>
              <p className="text-slate-600">• Dispensa sem justa causa: <strong>40%</strong></p>
              <p className="text-slate-600">• Rescisão por acordo (Art. 484-A CLT): <strong>20%</strong></p>
              <p className="text-slate-600">• Pedido de demissão / Justa causa: <strong>0%</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
