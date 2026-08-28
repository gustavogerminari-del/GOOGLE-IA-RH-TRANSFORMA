import React, { useState } from 'react';
import { ClientTemplate } from '../types/builderTypes';
import { visualBuilderStore } from '../store/visualBuilderStore';
import { getTenants } from '../../master-admin/masterTenantsStore';
import { 
  Layers, 
  Copy, 
  CheckCircle2, 
  Building2, 
  Palette, 
  X, 
  Sparkles, 
  ArrowRight 
} from 'lucide-react';

export const TemplateManagerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [templates] = useState<ClientTemplate[]>(() => visualBuilderStore.getTemplates());
  const [selectedTemplate, setSelectedTemplate] = useState<ClientTemplate | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const tenants = getTenants();

  if (!isOpen) return null;

  const handleApply = () => {
    if (!selectedTemplate || !selectedTenantId) return;
    const tenant = tenants.find(t => t.id === selectedTenantId);
    if (!tenant) return;

    visualBuilderStore.applyTemplateToCompany(
      selectedTemplate.id, 
      tenant.id, 
      tenant.companyName, 
      'MASTER Admin'
    );

    setSuccessMsg(`Modelo "${selectedTemplate.name}" aplicado com sucesso para a empresa ${tenant.companyName}!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" /> Biblioteca de Modelos por Cliente
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina layouts, temas e estruturas de menu pré-configuradas e aplique diretamente em qualquer empresa cliente.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tpl => {
              const isSelected = selectedTemplate?.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'bg-amber-950/20 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-amber-400 border border-slate-700">
                        {tpl.category}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                    </div>
                    <h3 className="font-extrabold text-white text-base mb-1">{tpl.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{tpl.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Palette className="w-3.5 h-3.5 text-amber-400" /> {tpl.defaultTheme.fontFamily}
                    </span>
                    <span className="font-bold text-slate-300">{tpl.menus.length} Menus Inclusos</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Apply To Tenant Section */}
          {selectedTemplate && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" /> Aplicar Modelo "{selectedTemplate.name}"
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400 font-bold block mb-1">Selecione a Empresa Cliente:</label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium text-xs outline-none focus:border-amber-500"
                  >
                    <option value="">-- Escolha uma empresa --</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.companyName} ({t.cnpj})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  disabled={!selectedTenantId}
                  onClick={handleApply}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 disabled:opacity-40 transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <span>Aplicar Modelo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
