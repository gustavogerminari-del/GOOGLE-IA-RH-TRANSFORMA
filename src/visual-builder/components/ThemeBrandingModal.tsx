import React, { useState } from 'react';
import { CompanyThemeConfig } from '../types/builderTypes';
import { visualBuilderStore } from '../store/visualBuilderStore';
import { getTenants } from '../../master-admin/masterTenantsStore';
import { 
  Palette, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  X, 
  Save, 
  Type, 
  Building2,
  Lock,
  FileJson
} from 'lucide-react';

interface ThemeBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCompanyId: string;
  onSaved?: () => void;
}

export const ThemeBrandingModal: React.FC<ThemeBrandingModalProps> = ({
  isOpen,
  onClose,
  selectedCompanyId,
  onSaved
}) => {
  const [theme, setTheme] = useState<CompanyThemeConfig>(() => 
    visualBuilderStore.getCompanyTheme(selectedCompanyId)
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importJsonText, setImportJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const tenants = getTenants();

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      visualBuilderStore.saveCompanyTheme(theme, 'MASTER Admin');
      setSuccessMsg('Tema e identidade visual salvos com sucesso!');
      if (onSaved) onSaved();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao salvar tema.');
    }
  };

  const handleExportJSON = () => {
    const pkg = visualBuilderStore.exportThemePackage(selectedCompanyId);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pkg, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `theme_${selectedCompanyId}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = () => {
    if (!importJsonText.trim()) return;
    try {
      visualBuilderStore.importThemePackage(importJsonText, selectedCompanyId, 'MASTER Admin');
      setTheme(visualBuilderStore.getCompanyTheme(selectedCompanyId));
      setSuccessMsg('Pacote visual importado e validado com sucesso!');
      setIsImporting(false);
      setImportJsonText('');
      if (onSaved) onSaved();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao importar pacote visual.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-400" /> Editor de Tema, Marca Branca e Identidade Visual
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Escopo: <span className="text-amber-400 font-bold">{selectedCompanyId === 'GLOBAL' ? 'Global (Todas as empresas)' : selectedCompanyId}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Cores Principais */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
              <Palette className="w-4 h-4 text-amber-400" /> Paleta de Cores do Sistema
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Cor Primária / Botões:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primaryColor || '#2563eb'}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor || '#2563eb'}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Cor Secundária / Destaques:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.secondaryColor || '#1e293b'}
                    onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.secondaryColor || '#1e293b'}
                    onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                    className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Fundo do Canvas (Background):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.backgroundColor || '#0f172a'}
                    onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.backgroundColor || '#0f172a'}
                    onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                    className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Marcas & Nomes */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
              <Building2 className="w-4 h-4 text-amber-400" /> Identidade de Marca & Nomes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Nome Comercial do Sistema / Empresa:</label>
                <input
                  type="text"
                  value={theme.companyName || ''}
                  onChange={(e) => setTheme({ ...theme, companyName: e.target.value })}
                  placeholder="Ex: RH TRANSFORMA Gestão de RH"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Slogan ou Subtítulo:</label>
                <input
                  type="text"
                  value={theme.slogan || ''}
                  onChange={(e) => setTheme({ ...theme, slogan: e.target.value })}
                  placeholder="Ex: Inteligência Integrada ao RH"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: White Label & Domínios */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
              <Globe className="w-4 h-4 text-amber-400" /> Domínio Personalizado & White Label
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Subdomínio do Cliente:</label>
                <input
                  type="text"
                  value={theme.subdomain || ''}
                  onChange={(e) => setTheme({ ...theme, subdomain: e.target.value })}
                  placeholder="empresa.rlconnect.com.br"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Domínio Próprio (Custom Domain):</label>
                <input
                  type="text"
                  value={theme.domain || ''}
                  onChange={(e) => setTheme({ ...theme, domain: e.target.value })}
                  placeholder="rh.minhaempresa.com.br"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Import / Export JSON */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-2">
                <FileJson className="w-4 h-4 text-amber-400" /> Exportação e Importação de Temas
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-amber-400 hover:bg-slate-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar JSON</span>
                </button>
                <button
                  onClick={() => setIsImporting(!isImporting)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar JSON</span>
                </button>
              </div>
            </div>

            {isImporting && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <textarea
                  rows={4}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Cole aqui o conteúdo JSON do pacote de tema do RH TRANSFORMA..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-[11px] outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleImportJSON}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400"
                >
                  Validar e Importar Pacote
                </button>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
            >
              Fechar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configurações Visuais</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
