import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Camera, 
  Plus, 
  X,
  Upload
} from 'lucide-react';
import { 
  ProcessoRescisaoCompleto, 
  ItemChecklistDesligamento, 
  EquipamentoDevolucao 
} from '../../types/terminationTypes';

interface ChecklistAssetsTabProps {
  process: ProcessoRescisaoCompleto;
  onUpdateChecklist: (updatedChecklist: ItemChecklistDesligamento[]) => void;
  onUpdateAssets: (updatedAssets: EquipamentoDevolucao[]) => void;
}

export const ChecklistAssetsTab: React.FC<ChecklistAssetsTabProps> = ({
  process,
  onUpdateChecklist,
  onUpdateAssets
}) => {
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [conditionAtDelivery, setConditionAtDelivery] = useState<'Novo' | 'Bom' | 'Regular' | 'Usado'>('Bom');

  // Checklist Actions
  const toggleChecklistItem = (itemId: string) => {
    const now = new Date().toISOString();
    const updated = process.checklist.map(item => {
      if (item.id === itemId) {
        const isDone = item.status === 'Concluído';
        return {
          ...item,
          status: isDone ? ('Pendente' as const) : ('Concluído' as const),
          completedAt: isDone ? undefined : now,
          completedBy: isDone ? undefined : 'Analista DP'
        };
      }
      return item;
    });
    onUpdateChecklist(updated);
  };

  // Asset Actions
  const toggleAssetReturned = (assetId: string) => {
    const now = new Date().toISOString();
    const updated = process.assets.map(a => {
      if (a.id === assetId) {
        const newReturned = !a.returned;
        return {
          ...a,
          returned: newReturned,
          returnDate: newReturned ? now.split('T')[0] : undefined,
          conditionAtReturn: newReturned ? ('Bom' as const) : undefined
        };
      }
      return a;
    });
    onUpdateAssets(updated);
  };

  const updateAssetCondition = (assetId: string, condition: 'Bom' | 'Regular' | 'Danificado' | 'Não Devolvido') => {
    const updated = process.assets.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          conditionAtReturn: condition,
          returned: condition !== 'Não Devolvido'
        };
      }
      return a;
    });
    onUpdateAssets(updated);
  };

  const handleAddAsset = () => {
    if (!assetName.trim()) return;
    const newAsset: EquipamentoDevolucao = {
      id: `ast-${Date.now()}`,
      companyId: process.companyId,
      terminationId: process.id,
      assetId: `asset-${Date.now()}`,
      assetName,
      serialNumber,
      conditionAtDelivery,
      returned: false
    };

    onUpdateAssets([...process.assets, newAsset]);
    setShowAddAssetModal(false);
    setAssetName('');
    setSerialNumber('');
  };

  const pendingRequired = process.checklist.filter(c => c.required && c.status !== 'Concluído').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Checklist Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-sm text-slate-900">Checklist Obrigatório de Desligamento</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Pendências necessárias antes de concluir o processo</p>
          </div>

          {pendingRequired > 0 ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              {pendingRequired} obrigatórios pendentes
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Checklist 100% Concluído
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {process.checklist.map(item => {
            const isDone = item.status === 'Concluído';
            return (
              <div
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isDone 
                    ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-700' 
                    : item.required
                    ? 'bg-rose-50/20 border-rose-200/80 hover:bg-rose-50/40 text-slate-900'
                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {item.title}
                    </span>

                    {item.required && (
                      <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                        Obrigatório
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                  )}

                  {isDone && item.completedAt && (
                    <p className="text-[10px] text-emerald-700 font-mono mt-1">
                      Concluído em: {new Date(item.completedAt).toLocaleString('pt-BR')} por {item.completedBy}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assets & Equipment Return Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-sm text-slate-900">Devolução de Equipamentos e Ativos</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Patrimônios corporativos vinculados ao colaborador</p>
          </div>

          <button
            onClick={() => setShowAddAssetModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Ativo</span>
          </button>
        </div>

        <div className="space-y-3">
          {process.assets.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Nenhum equipamento registrado para devolução.</p>
          ) : (
            process.assets.map(asset => (
              <div key={asset.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 block">{asset.assetName}</span>
                    {asset.serialNumber && (
                      <span className="text-[10px] text-slate-500 font-mono">S/N: {asset.serialNumber}</span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleAssetReturned(asset.id)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                      asset.returned
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {asset.returned ? '✓ Devolvido' : 'Pendente de Devolução'}
                  </button>
                </div>

                {/* Return Condition Selector */}
                {asset.returned && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-500">Estado de Devolução:</span>
                    <select
                      value={asset.conditionAtReturn || 'Bom'}
                      onChange={e => updateAssetCondition(asset.id, e.target.value as any)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                    >
                      <option value="Bom">Bom Estado</option>
                      <option value="Regular">Regular</option>
                      <option value="Danificado">Danificado / Com Avaria</option>
                      <option value="Não Devolvido">Não Devolvido</option>
                    </select>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Add Asset */}
      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Vincular Equipamento ao Desligamento</h3>
              <button onClick={() => setShowAddAssetModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Equipamento *</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={e => setAssetName(e.target.value)}
                  placeholder="Ex: Notebook Dell Latitude, Celular Samsung..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Número de Série / Patrimônio</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  placeholder="Ex: PAT-2025-0982"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado na Entrega</label>
                <select
                  value={conditionAtDelivery}
                  onChange={e => setConditionAtDelivery(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Novo">Novo</option>
                  <option value="Bom">Bom Estado</option>
                  <option value="Regular">Regular</option>
                  <option value="Usado">Usado</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddAssetModal(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddAsset}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Adicionar Ativo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
