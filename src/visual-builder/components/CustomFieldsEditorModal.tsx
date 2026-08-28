import React, { useState } from 'react';
import { CustomFieldDefinition } from '../types/builderTypes';
import { visualBuilderStore } from '../store/visualBuilderStore';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Database, 
  Layers, 
  Sliders, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const CustomFieldsEditorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [fields, setFields] = useState<CustomFieldDefinition[]>(() => visualBuilderStore.getCustomFields());
  const [activeEntity, setActiveEntity] = useState<'colaborador' | 'candidato' | 'vaga' | 'empresa'>('colaborador');
  const [editingField, setEditingField] = useState<Partial<CustomFieldDefinition> | null>(null);

  if (!isOpen) return null;

  const filteredFields = fields.filter(f => f.entityType === activeEntity);

  const handleCreateNew = () => {
    setEditingField({
      id: `cf-${Date.now()}`,
      entityType: activeEntity,
      name: '',
      label: '',
      fieldType: 'text',
      required: false,
      options: [],
      order: filteredFields.length + 1,
      active: true,
      createdAt: new Date().toISOString()
    });
  };

  const handleSaveField = () => {
    if (!editingField || !editingField.label) return;

    const formattedName = editingField.name || editingField.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fieldToSave: CustomFieldDefinition = {
      id: editingField.id || `cf-${Date.now()}`,
      entityType: editingField.entityType || activeEntity,
      name: formattedName,
      label: editingField.label,
      fieldType: editingField.fieldType || 'text',
      required: editingField.required || false,
      options: editingField.options || [],
      placeholder: editingField.placeholder || '',
      helpText: editingField.helpText || '',
      order: editingField.order || 1,
      active: editingField.active !== undefined ? editingField.active : true,
      createdAt: editingField.createdAt || new Date().toISOString()
    };

    const updated = visualBuilderStore.saveCustomField(fieldToSave);
    setFields(updated);
    setEditingField(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este campo personalizado?')) {
      const updated = visualBuilderStore.deleteCustomField(id);
      setFields(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" /> Construtor de Campos Personalizados
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Crie campos adicionais para cadastros de colaboradores, candidatos, vagas e empresas sem alterar o código.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity Tabs */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: 'colaborador', label: 'Colaboradores' },
            { id: 'candidato', label: 'Candidatos' },
            { id: 'vaga', label: 'Vagas & Oportunidades' },
            { id: 'empresa', label: 'Empresas & Clientes' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveEntity(tab.id as any);
                setEditingField(null);
              }}
              className={`px-4 py-2 rounded-xl font-extrabold transition ${
                activeEntity === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">

          {/* Form Editor when creating/editing */}
          {editingField ? (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-amber-400">
                {editingField.id ? 'Editar Campo' : 'Novo Campo Personalizado'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Rótulo Exibido no Formulário (*):</label>
                  <input
                    type="text"
                    value={editingField.label || ''}
                    onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                    placeholder="Ex: Tamanho do Uniforme"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Tipo do Campo:</label>
                  <select
                    value={editingField.fieldType || 'text'}
                    onChange={(e) => setEditingField({ ...editingField, fieldType: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-amber-500"
                  >
                    <option value="text">Texto Curto</option>
                    <option value="number">Número</option>
                    <option value="date">Data</option>
                    <option value="select">Seleção (Dropdown)</option>
                    <option value="checkbox">Caixa de Seleção (Boolean)</option>
                    <option value="currency">Moeda / Valor (R$)</option>
                    <option value="textarea">Texto Longo / Observações</option>
                  </select>
                </div>

                {editingField.fieldType === 'select' && (
                  <div className="md:col-span-2">
                    <label className="text-slate-400 font-bold block mb-1">Opções da Seleção (Separadas por Vírgula):</label>
                    <input
                      type="text"
                      value={editingField.options?.join(', ') || ''}
                      onChange={(e) => setEditingField({ 
                        ...editingField, 
                        options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                      })}
                      placeholder="P, M, G, GG, XGG"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Placeholder / Exemplo:</label>
                  <input
                    type="text"
                    value={editingField.placeholder || ''}
                    onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                    placeholder="Digite aqui..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 md:col-span-2">
                  <span className="font-bold text-slate-300">Preenchimento Obrigatório?</span>
                  <input
                    type="checkbox"
                    checked={editingField.required || false}
                    onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingField(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveField}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400"
                >
                  Salvar Campo
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">
                {filteredFields.length} campos cadastrados para {activeEntity}.
              </span>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Campo</span>
              </button>
            </div>
          )}

          {/* List of Fields */}
          <div className="space-y-3 text-xs">
            {filteredFields.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-500">
                Nenhum campo personalizado criado para esta entidade ainda.
              </div>
            ) : (
              filteredFields.map(f => (
                <div key={f.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{f.label}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {f.fieldType}
                      </span>
                      {f.required && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px]">
                          Obrigatório
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 font-mono text-[11px] mt-0.5">chave: {f.name}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingField(f)}
                      className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-900"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
