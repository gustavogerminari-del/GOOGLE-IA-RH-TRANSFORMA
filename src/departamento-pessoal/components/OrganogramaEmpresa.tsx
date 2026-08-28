import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Network, 
  Plus, 
  Users, 
  UserCheck, 
  Search, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  Layers, 
  MapPin, 
  CheckCircle2, 
  X, 
  FolderTree,
  Briefcase
} from 'lucide-react';
import { UnidadeOrganizacional, ColaboradorCompleto } from '../types/dp';
import { 
  getOrganogramaFirestore, 
  saveUnidadeOrganizacionalFirestore, 
  deleteUnidadeOrganizacionalFirestore 
} from '../services/dpFirestoreService';

interface OrganogramaEmpresaProps {
  companyId: string;
  colaboradores: ColaboradorCompleto[];
}

export const OrganogramaEmpresa: React.FC<OrganogramaEmpresaProps> = ({
  companyId,
  colaboradores
}) => {
  const [unidades, setUnidades] = useState<UnidadeOrganizacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'arvore' | 'lista'>('arvore');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState<Partial<UnidadeOrganizacional> | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getOrganogramaFirestore(companyId);
      setUnidades(data);
    } catch (err) {
      console.error('[Organograma] Erro ao carregar estrutura:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const handleOpenAdd = (parentId?: string, tipo: 'Unidade' | 'Departamento' | 'Setor' = 'Departamento') => {
    setEditingUnidade({
      id: `org-${Date.now()}`,
      companyId,
      nome: '',
      tipo,
      parentId: parentId || '',
      gestorId: '',
      gestorNome: '',
      descricao: '',
      localizacao: 'Matriz - SP',
      createdAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: UnidadeOrganizacional) => {
    setEditingUnidade({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover esta unidade do organograma?')) return;
    await deleteUnidadeOrganizacionalFirestore(id);
    await loadData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnidade?.nome) return;

    await saveUnidadeOrganizacionalFirestore(editingUnidade as UnidadeOrganizacional);
    setIsModalOpen(false);
    setEditingUnidade(null);
    await loadData();
  };

  // Unique departments/units from actual employees if organograma is empty
  const defaultDepartments = Array.from(new Set(colaboradores.map(c => c.profissionais?.departamento).filter(Boolean)));

  const displayList = unidades.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.gestorNome && u.gestorNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.tipo && u.tipo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
              <Network className="w-3.5 h-3.5 text-blue-600" />
              Estrutura Organizacional & Hierarquia Corporativa
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Organograma da Empresa
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Visualização hierárquica por matriz, filiais, departamentos, setores e equipes com gestores responsáveis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setActiveView('arvore')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'arvore'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                <span>Árvore Visual</span>
              </button>
              <button
                onClick={() => setActiveView('lista')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'lista'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Lista Mapeada</span>
              </button>
            </div>

            <button
              onClick={() => handleOpenAdd(undefined, 'Unidade')}
              className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Unidade / Depto</span>
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total de Colaboradores</p>
            <p className="text-xl font-black text-slate-900 mt-1">{colaboradores.length}</p>
          </div>
          <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/80">
            <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Departamentos Mapeados</p>
            <p className="text-xl font-black text-blue-900 mt-1">{defaultDepartments.length}</p>
          </div>
          <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80">
            <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Unidades / Filiais</p>
            <p className="text-xl font-black text-emerald-900 mt-1">{unidades.filter(u => u.tipo === 'Unidade' || u.tipo === 'Empresa').length || 1}</p>
          </div>
          <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200/80">
            <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Níveis de Gestão</p>
            <p className="text-xl font-black text-indigo-900 mt-1">4 Níveis (CEO → Dir → Gestor → Equipe)</p>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por departamento, gestor ou unidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* View Content */}
      {activeView === 'arvore' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6 overflow-x-auto">
          {/* Main Top Node: Headquarters */}
          <div className="flex flex-col items-center">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800 text-center w-72">
              <div className="flex items-center justify-center gap-2 mb-1 text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                Matriz / Sede Principal
              </div>
              <h3 className="font-extrabold text-base text-white">RH TRANSFORMA Group</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Diretoria Executiva & Operações</p>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Total Equipe:</span>
                <span className="font-bold text-emerald-400">{colaboradores.length} colaboradores</span>
              </div>
            </div>

            {/* Connecting Vertical Line */}
            <div className="w-0.5 h-8 bg-slate-300"></div>

            {/* Department Nodes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-2">
              {defaultDepartments.map((dept, idx) => {
                const team = colaboradores.filter(c => c.profissionais?.departamento === dept);
                const manager = team.find(c => c.profissionais?.cargo?.toLowerCase().includes('gestor') || c.profissionais?.cargo?.toLowerCase().includes('gerente') || c.profissionais?.cargo?.toLowerCase().includes('coordenador')) || team[0];

                return (
                  <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3 relative hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                          <Network className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{dept}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">Departamento Operacional</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-extrabold text-[10px] rounded-full border border-blue-200">
                        {team.length} {team.length === 1 ? 'membro' : 'membros'}
                      </span>
                    </div>

                    {/* Gestor */}
                    {manager && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
                        <img
                          src={manager.fotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={manager.nomeCompleto}
                          className="w-8 h-8 rounded-full object-cover border border-blue-400"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-blue-600 uppercase">Gestor do Departamento</p>
                          <p className="text-xs font-bold text-slate-800 truncate">{manager.nomeCompleto}</p>
                          <p className="text-[10px] text-slate-500 truncate">{manager.profissionais?.cargo}</p>
                        </div>
                      </div>
                    )}

                    {/* Team Members List preview */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Integrantes da Equipe:</p>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto scrollbar-thin pr-1">
                        {team.map(c => (
                          <span key={c.id} className="px-2 py-1 bg-white text-slate-700 rounded-lg border border-slate-200 text-[11px] font-medium flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-slate-400" />
                            <span>{c.nomeCompleto.split(' ')[0]}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Lista Mapeada */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Nome / Unidade</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Gestor Responsável</th>
                <th className="py-3 px-4">Localização</th>
                <th className="py-3 px-4 text-center">Colaboradores</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayList.length > 0 ? (
                displayList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-blue-600" />
                        <span>{item.nome}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {item.gestorNome || 'Não Atribuído'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.localizacao || 'Matriz - SP'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-blue-700">
                      {colaboradores.filter(c => c.profissionais?.departamento === item.nome).length}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-500 hover:text-red-600 cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                /* Fallback listing from actual employees */
                defaultDepartments.map((dept, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Network className="w-4 h-4 text-blue-600" />
                        <span>{dept}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Departamento
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      Gestor Atribuído
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      Sede Principal - SP
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">
                      {colaboradores.filter(c => c.profissionais?.departamento === dept).length}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenAdd(undefined, 'Departamento')}
                        className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Mapear Estrutura
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Edição/Criação Unidade */}
      {isModalOpen && editingUnidade && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingUnidade.id ? 'Editar Unidade / Departamento' : 'Nova Unidade do Organograma'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome da Unidade / Departamento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Departamento de Tecnologia & Inovação"
                  value={editingUnidade.nome || ''}
                  onChange={(e) => setEditingUnidade({ ...editingUnidade, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Estrutura</label>
                  <select
                    value={editingUnidade.tipo || 'Departamento'}
                    onChange={(e) => setEditingUnidade({ ...editingUnidade, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                  >
                    <option value="Empresa">Matriz Principal</option>
                    <option value="Unidade">Unidade / Filial</option>
                    <option value="Departamento">Departamento</option>
                    <option value="Setor">Setor / Célula</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Localização</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo - SP"
                    value={editingUnidade.localizacao || ''}
                    onChange={(e) => setEditingUnidade({ ...editingUnidade, localizacao: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gestor Responsável</label>
                <select
                  value={editingUnidade.gestorNome || ''}
                  onChange={(e) => setEditingUnidade({ ...editingUnidade, gestorNome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="">Selecione um Gestor...</option>
                  {colaboradores.map(c => (
                    <option key={c.id} value={c.nomeCompleto}>
                      {c.nomeCompleto} ({c.profissionais?.cargo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição das Atribuições</label>
                <textarea
                  rows={3}
                  placeholder="Descreva as responsabilidades desta área corporativa..."
                  value={editingUnidade.descricao || ''}
                  onChange={(e) => setEditingUnidade({ ...editingUnidade, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
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
                  Salvar no Organograma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
