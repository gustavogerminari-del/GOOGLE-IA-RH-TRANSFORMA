import React, { useState } from 'react';
import { 
  Settings, 
  Layers, 
  Mail, 
  Bell, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Sliders
} from 'lucide-react';
import { Stage } from '../types/rh';
import { GoogleWorkspaceIntegrationCard } from './GoogleWorkspaceIntegrationCard';

interface SettingsViewProps {
  stages?: Stage[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ stages = [] }) => {
  const [savedAlert, setSavedAlert] = useState(false);
  const [emailInvite, setEmailInvite] = useState(
    'Olá {{candidato_nome}}, gostamos muito do seu perfil para a vaga de {{vaga_titulo}} na RH TRANSFORMA. Gostaríamos de agendar uma entrevista inicial.'
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-extrabold text-slate-900">Configurações do Sistema RH TRANSFORMA</h2>
        </div>
        <p className="text-xs text-slate-500">
          Personalize as etapas do funil de seleção, modelos de comunicação e notificações.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <GoogleWorkspaceIntegrationCard />
        {/* Stages list display */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Etapas do Funil de Recrutamento Padrão</h3>
          </div>

          <div className="space-y-2">
            {stages.map((st, index) => (
              <div key={st.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700">{index + 1}. {st.name}</span>
                <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] border ${st.color}`}>
                  {st.id}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Mail className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Template de E-mail de Convite para Entrevista</h3>
          </div>

          <textarea
            rows={4}
            value={emailInvite}
            onChange={(e) => setEmailInvite(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        {/* Save button & Alert */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {savedAlert ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Configurações salvas com sucesso!
            </span>
          ) : (
            <span className="text-xs text-slate-400">Alterações salvas em tempo real na sessão.</span>
          )}

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
};
