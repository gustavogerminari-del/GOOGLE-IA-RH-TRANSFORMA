import React from 'react';
import { Users, UserCheck, Clock, AlertCircle, MapPin, CheckCircle, ShieldCheck } from 'lucide-react';
import { FuncionarioPontoInfo, RegistroPontoDoc } from '../types/ponto';

interface AreaGestorPontoProps {
  funcionarios: FuncionarioPontoInfo[];
  registros: RegistroPontoDoc[];
}

export const AreaGestorPonto: React.FC<AreaGestorPontoProps> = ({
  funcionarios,
  registros,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">Painel de Gestão da Equipe</h2>
        <p className="text-xs text-slate-500">Acompanhamento em tempo real do expediente, pausas, ausências e localizações dos liderados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {funcionarios.map(f => (
          <div key={f.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs border border-slate-200">
                  {(f.nome || (f as any).nomeCompleto || 'C').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{f.nome || (f as any).nomeCompleto || 'Colaborador'}</h3>
                  <p className="text-xs text-slate-500">{f.cargo}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Status Atual:</span>
                <span className={`font-bold ${
                  f.statusLivePonto === 'Trabalhando' ? 'text-emerald-700' :
                  f.statusLivePonto === 'Intervalo' ? 'text-amber-700' : 'text-slate-500'
                }`}>
                  {f.statusLivePonto || 'Ausente'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Escala:</span>
                <span className="font-bold text-slate-800">{f.escalaNome || 'Comercial'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
