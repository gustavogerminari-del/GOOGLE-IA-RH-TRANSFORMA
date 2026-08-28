import React, { useState } from 'react';
import { 
  Calculator, 
  Plus, 
  Edit3, 
  Trash2, 
  History, 
  HelpCircle, 
  DollarSign, 
  FileText,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ProcessoRescisaoCompleto, ItemMemoriaCalculo } from '../../types/terminationTypes';

interface MemoriaCalculoViewerProps {
  process: ProcessoRescisaoCompleto;
  onUpdateCalculationItems: (updatedItems: ItemMemoriaCalculo[]) => void;
}

export const MemoriaCalculoViewer: React.FC<MemoriaCalculoViewerProps> = ({
  process,
  onUpdateCalculationItems
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemMemoriaCalculo | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<ItemMemoriaCalculo | null>(null);

  // Form State for Adding / Editing Custom Item
  const [eventName, setEventName] = useState('');
  const [eventCode, setEventCode] = useState('999');
  const [itemType, setItemType] = useState<'Provento' | 'Desconto'>('Provento');
  const [value, setValue] = useState(0);
  const [reason, setReason] = useState('');

  const proventos = process.calculationItems.filter(i => i.type === 'Provento');
  const descontos = process.calculationItems.filter(i => i.type === 'Desconto');

  const totalProventos = proventos.reduce((acc, curr) => acc + curr.grossValue, 0);
  const totalDescontos = descontos.reduce((acc, curr) => acc + curr.discountValue, 0);
  const valorLiquido = totalProventos - totalDescontos;

  const handleOpenEdit = (item: ItemMemoriaCalculo) => {
    setEditingItem(item);
    setEventName(item.eventName);
    setEventCode(item.eventCode);
    setItemType(item.type);
    setValue(item.type === 'Provento' ? item.grossValue : item.discountValue);
    setReason('');
    setShowAddModal(true);
  };

  const handleOpenNew = () => {
    setEditingItem(null);
    setEventName('');
    setEventCode(`3${Math.floor(100 + Math.random() * 800)}`);
    setItemType('Provento');
    setValue(0);
    setReason('');
    setShowAddModal(true);
  };

  const handleSaveItem = () => {
    if (!eventName.trim() || value <= 0) {
      alert('Preencha o nome da verba e um valor válido.');
      return;
    }

    const now = new Date().toISOString();

    if (editingItem) {
      if (!reason.trim()) {
        alert('É obrigatório informar a justificativa do ajuste para histórico de auditoria.');
        return;
      }

      const prevValue = editingItem.type === 'Provento' ? editingItem.grossValue : editingItem.discountValue;
      const historyItem = {
        updatedAt: now,
        updatedBy: 'Analista DP / RH',
        previousValue: prevValue,
        newValue: value,
        reason
      };

      const updated = process.calculationItems.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            eventName,
            grossValue: itemType === 'Provento' ? value : 0,
            discountValue: itemType === 'Desconto' ? value : 0,
            netValue: itemType === 'Provento' ? value : -value,
            source: 'Manual' as const,
            manual: true,
            editHistory: [...(item.editHistory || []), historyItem],
            updatedAt: now
          };
        }
        return item;
      });

      onUpdateCalculationItems(updated);
    } else {
      const newItem: ItemMemoriaCalculo = {
        id: `calc-${Date.now()}`,
        companyId: process.companyId,
        terminationId: process.id,
        employeeId: process.employeeId,
        eventCode,
        eventName,
        type: itemType,
        calculationBase: value,
        quantity: 1,
        reference: 'Ajuste Manual',
        grossValue: itemType === 'Provento' ? value : 0,
        discountValue: itemType === 'Desconto' ? value : 0,
        netValue: itemType === 'Provento' ? value : -value,
        source: 'Manual',
        manual: true,
        notes: reason,
        createdAt: now,
        updatedAt: now
      };

      onUpdateCalculationItems([...process.calculationItems, newItem]);
    }

    setShowAddModal(false);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Tem certeza que deseja remover esta verba da memória de cálculo?')) {
      const updated = process.calculationItems.filter(i => i.id !== itemId);
      onUpdateCalculationItems(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Summary */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
            TRCT Demonstrativo de Verbas
          </span>
          <h3 className="text-base font-bold text-white mt-1">Memória de Cálculo Rescisório</h3>
          <p className="text-xs text-slate-400">Detalhamento dos proventos, descontos legais e regras de cálculo (CLT)</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Verba / Ajuste Manual</span>
        </button>
      </div>

      {/* Tables Split: Proventos vs Descontos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proventos */}
        <div className="bg-emerald-50/40 rounded-2xl border border-emerald-200/80 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
            <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
              <span>➕ Proventos Rescisórios</span>
            </h4>
            <span className="text-xs font-mono font-black text-emerald-800">
              {totalProventos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <div className="space-y-2">
            {proventos.map(item => (
              <div key={item.id} className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>[{item.eventCode}] {item.eventName}</span>
                    {item.manual && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-100 text-amber-800 font-semibold">
                        Manual
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Ref: {item.reference || `${item.quantity} un`} | Base: {item.calculationBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-700">
                    {item.grossValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>

                  {item.editHistory && item.editHistory.length > 0 && (
                    <button 
                      onClick={() => setShowHistoryModal(item)}
                      title="Ver Histórico de Auditoria"
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-amber-600" />
                    </button>
                  )}

                  <button 
                    onClick={() => handleOpenEdit(item)}
                    title="Editar Valor"
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {item.manual && (
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      title="Excluir Verba Manual"
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Descontos */}
        <div className="bg-rose-50/40 rounded-2xl border border-rose-200/80 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-rose-200 pb-2">
            <h4 className="font-bold text-sm text-rose-900 flex items-center gap-2">
              <span>➖ Descontos Rescisórios</span>
            </h4>
            <span className="text-xs font-mono font-black text-rose-800">
              {totalDescontos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <div className="space-y-2">
            {descontos.map(item => (
              <div key={item.id} className="p-3 bg-white rounded-xl border border-rose-100 shadow-2xs flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>[{item.eventCode}] {item.eventName}</span>
                    {item.manual && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-100 text-amber-800 font-semibold">
                        Manual
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Ref: {item.reference || 'Tabela'} | Base: {item.calculationBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-rose-700">
                    -{item.discountValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>

                  {item.editHistory && item.editHistory.length > 0 && (
                    <button 
                      onClick={() => setShowHistoryModal(item)}
                      title="Ver Histórico de Auditoria"
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-amber-600" />
                    </button>
                  )}

                  <button 
                    onClick={() => handleOpenEdit(item)}
                    title="Editar Valor"
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {item.manual && (
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      title="Excluir Verba Manual"
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Totals Breakdown & FGTS Fine */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1">
          <span className="text-slate-500 text-[11px] font-medium">Total de Proventos:</span>
          <div className="text-lg font-black text-emerald-700 font-mono">
            {totalProventos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1">
          <span className="text-slate-500 text-[11px] font-medium">Total de Descontos:</span>
          <div className="text-lg font-black text-rose-700 font-mono">
            {totalDescontos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>

        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
          <span className="text-slate-400 text-[11px] font-medium">VALOR LÍQUIDO RESCISÓRIO:</span>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
      </div>

      {/* FGTS Fine Info */}
      <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 flex items-center justify-between text-xs">
        <div>
          <span className="font-bold text-indigo-900 block">Multa Rescisória do FGTS (Estimada):</span>
          <p className="text-indigo-700 text-[11px] mt-0.5">
            Base estimada: {process.fgtsBalanceEstimate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Multa ({process.fgtsFinePercentage}%):
          </p>
        </div>
        <div className="text-base font-black text-indigo-950 font-mono">
          {process.fgtsFineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      </div>

      {/* Modal: Add or Edit Calculation Item */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingItem ? 'Ajustar Verba Rescisória' : 'Nova Verba Manual'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome da Verba *</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={e => setEventName(e.target.value)}
                  placeholder="Ex: Adicional de Periculosidade, Faltas..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo *</label>
                  <select
                    value={itemType}
                    onChange={e => setItemType(e.target.value as 'Provento' | 'Desconto')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Provento">Provento (+)</option>
                    <option value="Desconto">Desconto (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={e => setValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Justificativa do Ajuste / Auditoria *
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Informe o motivo da alteração manual conforme documentação oficial..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveItem}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Salvar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Audit History of Item */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-600" />
                <span>Histórico de Alterações na Verba</span>
              </h3>
              <button onClick={() => setShowHistoryModal(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
              {showHistoryModal.editHistory?.map((h, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span>{h.updatedBy}</span>
                    <span className="font-mono text-slate-400">{new Date(h.updatedAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-rose-600 font-bold">{h.previousValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    <span>➔</span>
                    <span className="text-emerald-600 font-bold">{h.newValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <p className="text-slate-600 italic text-[10px]">"{h.reason}"</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowHistoryModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
