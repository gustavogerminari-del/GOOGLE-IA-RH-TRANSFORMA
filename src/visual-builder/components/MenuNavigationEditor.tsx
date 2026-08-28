import React, { useState } from 'react';
import { NavigationMenuItem } from '../types/builderTypes';
import { visualBuilderStore } from '../store/visualBuilderStore';
import { 
  Menu, 
  MoveUp, 
  MoveDown, 
  Eye, 
  EyeOff, 
  Lock, 
  Save, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  LayoutGrid,
  Briefcase,
  Users,
  Calendar,
  Clock,
  DollarSign,
  Globe,
  Award,
  Crown,
  Sparkles,
  Building
} from 'lucide-react';

export const MenuNavigationEditor: React.FC<{ onSaved?: () => void }> = ({ onSaved }) => {
  const [menus, setMenus] = useState<NavigationMenuItem[]>(() => visualBuilderStore.getNavigationMenus());
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= menus.length) return;

    const updated = [...menus];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // re-assign order numbers
    const reordered = updated.map((m, i) => ({ ...m, order: i + 1 }));
    setMenus(reordered);
    setIsSaved(false);
  };

  const handleToggleHide = (id: string) => {
    const item = menus.find(m => m.id === id);
    if (item?.isCritical) {
      setErrorMsg('O menu Crítico de Acesso MASTER não pode ser ocultado.');
      return;
    }

    setMenus(menus.map(m => m.id === id ? { ...m, hidden: !m.hidden } : m));
    setIsSaved(false);
    setErrorMsg(null);
  };

  const handleLabelChange = (id: string, newLabel: string) => {
    setMenus(menus.map(m => m.id === id ? { ...m, label: newLabel } : m));
    setIsSaved(false);
  };

  const handleIconChange = (id: string, newIcon: string) => {
    setMenus(menus.map(m => m.id === id ? { ...m, icon: newIcon } : m));
    setIsSaved(false);
  };

  const handleSave = () => {
    try {
      visualBuilderStore.saveNavigationMenus(menus);
      setIsSaved(true);
      setErrorMsg(null);
      if (onSaved) onSaved();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar reordenação de menus.');
    }
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6 text-slate-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Menu className="w-5 h-5 text-amber-400" /> Editor de Estrutura de Menus & Navegação
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Reordene a navegação lateral, renomeie botões, substitua ícones e defina a visibilidade por empresa ou perfil.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Estrutura de Menus</span>
        </button>
      </div>

      {isSaved && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Estrutura de menus atualizada e refletida globalmente na navegação!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Menu List */}
      <div className="space-y-3">
        {menus.map((item, index) => {
          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition ${
                item.hidden 
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-60' 
                  : item.isCritical 
                    ? 'bg-amber-950/20 border-amber-500/40' 
                    : 'bg-slate-950 border-slate-800'
              }`}
            >
              {/* Left Order & Drag Controls */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-400"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === menus.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-400"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center">
                  {item.order}
                </span>

                {/* Label Editing */}
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => handleLabelChange(item.id, e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-amber-500 w-52 sm:w-64"
                />
              </div>

              {/* Icon & Route Info */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold">Ícone:</span>
                  <select
                    value={item.icon}
                    onChange={(e) => handleIconChange(item.id, e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none"
                  >
                    <option value="LayoutGrid">LayoutGrid</option>
                    <option value="Sparkles">Sparkles (IA)</option>
                    <option value="Briefcase">Briefcase (Vagas)</option>
                    <option value="Users">Users (Talentos)</option>
                    <option value="Calendar">Calendar (Agenda)</option>
                    <option value="Clock">Clock (Ponto)</option>
                    <option value="DollarSign">DollarSign (Folha)</option>
                    <option value="Globe">Globe (Portal)</option>
                    <option value="Award">Award (Headhunter)</option>
                    <option value="Crown">Crown (Master)</option>
                    <option value="Building">Building (DP)</option>
                  </select>
                </div>

                <div className="hidden md:block text-slate-400 font-mono text-[11px]">
                  route: <span className="text-amber-400 font-bold">/{item.route}</span>
                </div>

                {/* Hide / Show Toggle */}
                {item.isCritical ? (
                  <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-bold text-[11px] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Crítico
                  </span>
                ) : (
                  <button
                    onClick={() => handleToggleHide(item.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                      item.hidden 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {item.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{item.hidden ? 'Oculto' : 'Visível'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
