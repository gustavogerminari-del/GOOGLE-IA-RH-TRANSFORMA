import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  DollarSign, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Award, 
  CheckCircle2, 
  Users, 
  Layers, 
  X, 
  FileText, 
  TrendingUp, 
  BookOpen, 
  ShieldCheck,
  Building2
} from 'lucide-react';
import { CargoSalarioItem, ColaboradorCompleto } from '../types/dp';
import { 
  getCargosSalariosFirestore, 
  saveCargoSalarioFirestore, 
  deleteCargoSalarioFirestore 
} from '../services/dpFirestoreService';

interface GestaoCargosSalariosProps {
  companyId: string;
  colaboradores: ColaboradorCompleto[];
}

export const GestaoCargosSalarios: React.FC<GestaoCargosSalariosProps> = ({
  companyId,
  colaboradores
}) => {
  const [cargos, setCargos] = useState<CargoSalarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Partial<CargoSalarioItem> | null>(null);
  const [newRequirement, setNewRequirement] = useState('');
  const [newCompetence, setNewCompetence] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCargosSalariosFirestore(companyId);
      setCargos(data);
    } catch (err) {
      console.error('[CargosSalarios] Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const handleOpenAdd = () => {
    setEditingCargo({
      id: `cargo-${Date.now()}`,
      companyId,
      cargo: '',
      cbo: '2124-05',
      nivel: 'Pleno',
      departamento: 'Tecnologia',
      descricao: '',
      requisitos: ['Ensino Superior Completo', 'Experiência comprovada de 2+ anos'],
      competencias: ['Trabalho em Equipe', 'Comunicação Clara', 'Resolução de Problemas'],
      salarioPiso: 3500,
      salarioTeto: 8500,
      salarioMedio: 5500,
      createdAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CargoSalarioItem) => {
    setEditingCargo({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cargo da tabela oficial?')) return;
    await deleteCargoSalarioFirestore(id);
    await loadData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCargo?.cargo) return;

    await saveCargoSalarioFirestore(editingCargo as CargoSalarioItem);
    setIsModalOpen(false);
    setEditingCargo(null);
    await loadData();
  };

  const addRequirement = () => {
    if (!newRequirement.trim() || !editingCargo) return;
    setEditingCargo({
      ...editingCargo,
      requisitos: [...(editingCargo.requisitos || []), newRequirement.trim()]
    });
    setNewRequirement('');
  };

  const removeRequirement = (idx: number) => {
    if (!editingCargo) return;
    setEditingCargo({
      ...editingCargo,
      requisitos: (editingCargo.requisitos || []).filter((_, i) => i !== idx)
    });
  };

  const addCompetence = () => {
    if (!newCompetence.trim() || !editingCargo) return;
    setEditingCargo({
      ...editingCargo,
      competencias: [...(editingCargo.competencias || []), newCompetence.trim()]
    });
    setNewCompetence('');
  };

  const removeCompetence = (idx: number) => {
    if (!editingCargo) return;
    setEditingCargo({
      ...editingCargo,
      competencias: (editingCargo.competencias || []).filter((_, i) => i !== idx)
    });
  };

  // Distinct roles from actual active employees
  const employeeRoles = Array.from(new Set(colaboradores.map(c => c.profissionais?.cargo).filter(Boolean)));
  const departments = Array.from(new Set(colaboradores.map(c => c.profissionais?.departamento).filter(Boolean)));

  const displayCargos = cargos.filter(c => {
    const matchSearch = c.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.cbo.includes(searchTerm) ||
                        c.departamento.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDeptFilter === 'todos' || c.departamento === selectedDeptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6">
      {/* Banner Superior */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Tabela Salarial & Matriz de Competências CBO
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Gestão de Cargos, Salários & CBO
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Mapeamento formal de funções, códigos CBO, pisos salariais, faixas de progressão, requisitos e competências.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Cargo</span>
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cargos Mapeados</p>
            <p className="text-xl font-black text-slate-900 mt-1">{cargos.length || employeeRoles.length}</p>
          </div>
          <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80">
            <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Média Salarial Geral</p>
            <p className="text-xl font-black text-emerald-900 mt-1">
              {(colaboradores.reduce((acc, c) => acc + (c.profissionais?.salarioBase || 0), 0) / (colaboradores.length || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/80">
            <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Departamentos Atendidos</p>
            <p className="text-xl font-black text-blue-900 mt-1">{departments.length}</p>
          </div>
          <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200/80">
            <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Conformidade CBO</p>
            <p className="text-xl font-black text-purple-900 mt-1">100% Homologado</p>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome do cargo, código CBO ou departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Departamento:</label>
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-bold text-slate-700"
          >
            <option value="todos">Todos os Departamentos</option>
            {departments.map((d, idx) => (
              <option key={idx} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayCargos.length > 0 ? (
          displayCargos.map((item) => {
            const currentOccupants = colaboradores.filter(c => c.profissionais?.cargo?.toLowerCase() === item.cargo.toLowerCase());

            return (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{item.cargo}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">{item.departamento} • CBO: <span className="font-mono text-slate-700 font-bold">{item.cbo}</span></p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {item.nivel}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 italic">
                  "{item.descricao || 'Descrição do cargo e atribuições corporativas conforme tabela do departamento.'}"
                </p>

                {/* Faixa Salarial */}
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800">
                    <span>Piso: {item.salarioPiso.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    <span className="text-emerald-900">Médio: {item.salarioMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    <span>Teto: {item.salarioTeto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </div>

                {/* Requisitos & Competências preview */}
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Requisitos Chave:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.requisitos?.slice(0, 2).map((req, rIdx) => (
                        <span key={rIdx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-medium">
                          • {req}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Occupants count */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Colaboradores no Cargo:</span>
                    <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {currentOccupants.length} ativos
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          /* Fallback auto-generated cards from active employees */
          employeeRoles.map((roleName, rIdx) => {
            const occupants = colaboradores.filter(c => c.profissionais?.cargo === roleName);
            const sample = occupants[0];
            const avgSal = occupants.reduce((acc, c) => acc + (c.profissionais?.salarioBase || 0), 0) / occupants.length;

            return (
              <div key={rIdx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{roleName}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">{sample?.profissionais?.departamento || 'Geral'} • CBO: <span className="font-mono text-slate-700 font-bold">2124-05</span></p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80">
                  <p className="text-[10px] text-emerald-800 font-bold uppercase">Média Salarial Atual</p>
                  <p className="text-sm font-extrabold text-emerald-900 mt-0.5">
                    {avgSal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Ocupantes Ativos:</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    {occupants.length} colaboradores
                  </span>
                </div>

                <button
                  onClick={() => {
                    setEditingCargo({
                      id: `cargo-${Date.now()}`,
                      companyId,
                      cargo: roleName,
                      cbo: '2124-05',
                      nivel: 'Pleno',
                      departamento: sample?.profissionais?.departamento || 'Tecnologia',
                      descricao: `Cargo de ${roleName} atuante no departamento de ${sample?.profissionais?.departamento}.`,
                      requisitos: ['Ensino Superior ou técnico na área', 'Experiência prévia'],
                      competencias: ['Responsabilidade', 'Pontualidade', 'Foco em Resultados'],
                      salarioPiso: avgSal * 0.8,
                      salarioTeto: avgSal * 1.3,
                      salarioMedio: avgSal,
                      createdAt: new Date().toISOString()
                    });
                    setIsModalOpen(true);
                  }}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Homologar Cargo na Tabela Oficial
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Edição/Criação Cargo */}
      {isModalOpen && editingCargo && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingCargo.id ? 'Cadastrar / Modificar Cargo e Salário' : 'Novo Cargo no Catálogo'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Título do Cargo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Desenvolvedor Senior"
                    value={editingCargo.cargo || ''}
                    onChange={(e) => setEditingCargo({ ...editingCargo, cargo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código CBO</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 2124-05"
                    value={editingCargo.cbo || ''}
                    onChange={(e) => setEditingCargo({ ...editingCargo, cbo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departamento</label>
                  <input
                    type="text"
                    placeholder="Ex: Tecnologia"
                    value={editingCargo.departamento || ''}
                    onChange={(e) => setEditingCargo({ ...editingCargo, departamento: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nível Hierárquico</label>
                  <select
                    value={editingCargo.nivel || 'Pleno'}
                    onChange={(e) => setEditingCargo({ ...editingCargo, nivel: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                  >
                    <option value="Júnior">Júnior</option>
                    <option value="Pleno">Pleno</option>
                    <option value="Sênior">Sênior</option>
                    <option value="Especialista">Especialista</option>
                    <option value="Coordenador">Coordenador</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Diretor">Diretor</option>
                  </select>
                </div>
              </div>

              {/* Faixa Salarial */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-800 text-xs">Faixa Salarial de Referência (R$)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold">Piso Salarial</label>
                    <input
                      type="number"
                      value={editingCargo.salarioPiso || ''}
                      onChange={(e) => setEditingCargo({ ...editingCargo, salarioPiso: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold">Média do Mercado</label>
                    <input
                      type="number"
                      value={editingCargo.salarioMedio || ''}
                      onChange={(e) => setEditingCargo({ ...editingCargo, salarioMedio: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold">Teto Máximo</label>
                    <input
                      type="number"
                      value={editingCargo.salarioTeto || ''}
                      onChange={(e) => setEditingCargo({ ...editingCargo, salarioTeto: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição do Cargo</label>
                <textarea
                  rows={2}
                  placeholder="Resumo das responsabilidades do cargo..."
                  value={editingCargo.descricao || ''}
                  onChange={(e) => setEditingCargo({ ...editingCargo, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Requisitos */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Requisitos Exigidos</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Ex: Certificação AWS ou Graduação em TI"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="px-3 py-1.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {editingCargo.requisitos?.map((req, rIdx) => (
                    <span key={rIdx} className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-[11px] flex items-center gap-1">
                      <span>{req}</span>
                      <button type="button" onClick={() => removeRequirement(rIdx)} className="text-red-500 font-bold ml-1">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Competências */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Competências Comportamentais & Técnicas</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Ex: Liderança, Visão Sistêmica"
                    value={newCompetence}
                    onChange={(e) => setNewCompetence(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={addCompetence}
                    className="px-3 py-1.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {editingCargo.competencias?.map((comp, cIdx) => (
                    <span key={cIdx} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] flex items-center gap-1">
                      <span>{comp}</span>
                      <button type="button" onClick={() => removeCompetence(cIdx)} className="text-red-500 font-bold ml-1">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Salvar Tabela de Cargo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
