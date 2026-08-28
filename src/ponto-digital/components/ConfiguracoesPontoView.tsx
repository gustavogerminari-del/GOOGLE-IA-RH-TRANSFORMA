import React, { useState } from 'react';
import { Settings, MapPin, Camera, Clock, DollarSign, Save, ShieldCheck } from 'lucide-react';
import { ConfiguracoesPonto } from '../types/ponto';

interface ConfiguracoesPontoViewProps {
  config: ConfiguracoesPonto;
  onSalvarConfig: (config: ConfiguracoesPonto) => void;
}

export const ConfiguracoesPontoView: React.FC<ConfiguracoesPontoViewProps> = ({
  config,
  onSalvarConfig,
}) => {
  const [formConfig, setFormConfig] = useState<ConfiguracoesPonto>(config);
  const [salvo, setSalvo] = useState(false);

  const handleSave = () => {
    onSalvarConfig(formConfig);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Configurações Gerais de Ponto</h2>
          <p className="text-xs text-slate-500">Parâmetros de Geofencing GPS, tolerância de jornada, fotos e regras trabalhistas</p>
        </div>

        <button
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{salvo ? 'Salvo com Sucesso!' : 'Salvar Configurações'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Geofencing Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h3>Controle por Localização (Geofencing)</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Restringir Ponto por Raio GPS</span>
              <input
                type="checkbox"
                checked={formConfig.geofencingAtivo}
                onChange={e => setFormConfig({ ...formConfig, geofencingAtivo: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Raio Permitido (metros)</label>
              <input
                type="number"
                value={formConfig.raioPermitidoMetros}
                onChange={e => setFormConfig({ ...formConfig, raioPermitidoMetros: parseInt(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Latitude Sede</label>
                <input
                  type="number"
                  step="any"
                  value={formConfig.latitudeCentro || -23.55052}
                  onChange={e => setFormConfig({ ...formConfig, latitudeCentro: parseFloat(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Longitude Sede</label>
                <input
                  type="number"
                  step="any"
                  value={formConfig.longitudeCentro || -46.633308}
                  onChange={e => setFormConfig({ ...formConfig, longitudeCentro: parseFloat(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security & Photos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
            <Camera className="w-5 h-5 text-emerald-600" />
            <h3>Segurança & Foto no Momento do Ponto</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Exigir Captura de Foto Obrigatória</span>
              <input
                type="checkbox"
                checked={formConfig.exigirFoto}
                onChange={e => setFormConfig({ ...formConfig, exigirFoto: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Tolerância Diária de Atraso (minutos)</label>
              <input
                type="number"
                value={formConfig.toleranciaAtrasoMinutos}
                onChange={e => setFormConfig({ ...formConfig, toleranciaAtrasoMinutos: parseInt(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="font-semibold text-slate-700">Sincronização Automática com Folha</span>
              <input
                type="checkbox"
                checked={formConfig.sincronizarComFolha}
                onChange={e => setFormConfig({ ...formConfig, sincronizarComFolha: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
