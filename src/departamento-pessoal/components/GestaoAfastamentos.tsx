import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Calendar, 
  User, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Heart, 
  Baby, 
  Stethoscope, 
  FileCheck, 
  UserX, 
  X, 
  Building2,
  Trash2,
  Edit3,
  Activity,
  Award,
  ChevronRight,
  Info,
  Check,
  Paperclip,
  Download,
  AlertCircle
} from 'lucide-react';
import { 
  ColaboradorCompleto, 
  AfastamentoColaborador, 
  TipoAfastamentoCompleto, 
  DadosCat, 
  DadosInss, 
  DadosRetornoTrabalho 
} from '../types/dp';
import { 
  getAfastamentosFirestore, 
  saveAfastamentoFirestore, 
  concluirRetornoAoTrabalhoFirestore,
  saveDocumentoFirestore 
} from '../services/dpFirestoreService';

interface GestaoAfastamentosProps {
  colaboradores: ColaboradorCompleto[];
  companyId: string;
}

export const GestaoAfastamentos: React.FC<GestaoAfastamentosProps> = ({
  colaboradores,
  companyId
}) => {
  const [activeTab, setActiveTab] = useState<'afastamentos' | 'cat' | 'inss' | 'retorno' | 'alertas'>('afastamentos');
  const [afastamentos, setAfastamentos] = useState<AfastamentoColaborador[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAfastamento, setEditingAfastamento] = useState<Partial<AfastamentoColaborador> | null>(null);

  // Modal CAT
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Partial<DadosCat> | null>(null);
  const [catColabId, setCatColabId] = useState<string>('');

  // Modal Retorno ao Trabalho
  const [isRetornoModalOpen, setIsRetornoModalOpen] = useState(false);
  const [selectedForRetorno, setSelectedForRetorno] = useState<AfastamentoColaborador | null>(null);
  const [dadosRetornoForm, setDadosRetornoForm] = useState<Partial<DadosRetornoTrabalho>>({
    resultadoAso: 'Apto',
    dataExameAso: new Date().toISOString().split('T')[0],
    dataConclusao: new Date().toISOString().split('T')[0]
  });

  // Load Firestore Data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const list = await getAfastamentosFirestore(companyId);
        setAfastamentos(list);
      } catch (err) {
        console.error('Erro ao buscar afastamentos do Firestore:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [companyId]);

  // Filtered List
  const filteredList = afastamentos.filter(a => {
    const matchesSearch = a.colaboradorNome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (a.cid || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = selectedTipo === 'Todos' || a.tipo === selectedTipo;
    const matchesStatus = selectedStatus === 'Todos' || a.status === selectedStatus;
    return matchesSearch && matchesTipo && matchesStatus;
  });

  // KPI calculations
  const totalAtivos = afastamentos.filter(a => a.status === 'Ativo').length;
  const totalInss = afastamentos.filter(a => a.tipo === 'Afastamento pelo INSS' || a.status === 'Encaminhado INSS').length;
  const totalCat = afastamentos.filter(a => a.tipo === 'CAT' || a.dadosCat).length;
  const totalRetornoPendente = afastamentos.filter(a => a.status === 'Ativo' && a.retornoTrabalhoPrevisto).length;

  // Open Modal Afastamento
  const handleOpenAfastamento = (colab?: ColaboradorCompleto) => {
    const target = colab || colaboradores[0];
    const hoje = new Date().toISOString().split('T')[0];

    setEditingAfastamento({
      companyId,
      empresaId: companyId,
      colaboradorId: target?.id || 'colab-001',
      colaboradorNome: target?.nomeCompleto || 'Colaborador',
      cargo: target?.profissionais.cargo || 'Cargo',
      departamento: target?.profissionais.departamento || 'Geral',
      tipo: 'Atestado médico',
      dataInicio: hoje,
      dataFim: hoje,
      diasAfastado: 1,
      status: 'Ativo',
      observacoes: ''
    });
    setIsModalOpen(true);
  };

  // Save Afastamento to Firestore
  const handleSaveAfastamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAfastamento) return;

    const dataInicio = editingAfastamento.dataInicio || new Date().toISOString().split('T')[0];
    const dataFim = editingAfastamento.dataFim || dataInicio;
    
    // Calcula dias de afastamento
    const start = new Date(dataInicio);
    const end = new Date(dataFim);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Regra dos 15 dias para INSS
    let finalStatus = editingAfastamento.status || 'Ativo';
    if (diffDays > 15 && editingAfastamento.tipo === 'Atestado médico') {
      finalStatus = 'Encaminhado INSS';
    }

    const saved: AfastamentoColaborador = {
      id: editingAfastamento.id || `afast-${Date.now()}`,
      empresaId: companyId,
      companyId,
      colaboradorId: editingAfastamento.colaboradorId || 'colab-001',
      colaboradorNome: editingAfastamento.colaboradorNome || 'Colaborador',
      cargo: editingAfastamento.cargo || 'Cargo',
      departamento: editingAfastamento.departamento || 'Geral',
      tipo: (editingAfastamento.tipo as TipoAfastamentoCompleto) || 'Atestado médico',
      dataInicio,
      dataFim,
      diasAfastado: diffDays,
      cid: editingAfastamento.cid,
      medicoResponsavel: editingAfastamento.medicoResponsavel,
      crmMedico: editingAfastamento.crmMedico,
      clinicaOuHospital: editingAfastamento.clinicaOuHospital,
      anexoUrl: editingAfastamento.anexoUrl,
      observacoes: editingAfastamento.observacoes,
      status: finalStatus as any,
      retornoTrabalhoPrevisto: dataFim,
      createdAt: editingAfastamento.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveAfastamentoFirestore(saved);
    setAfastamentos(prev => {
      const idx = prev.findIndex(a => a.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });

    // Auto-save to Documentos if certificate provided
    if (saved.cid || saved.medicoResponsavel) {
      await saveDocumentoFirestore({
        id: `doc-afast-${Date.now()}`,
        empresaId: companyId,
        colaboradorId: saved.colaboradorId,
        colaboradorNome: saved.colaboradorNome,
        categoria: 'Afastamentos',
        tipoDocumento: `Atestado Médico / Licença (${saved.tipo})`,
        nomeArquivo: `Atestado_${saved.colaboradorNome}_${saved.dataInicio}.pdf`,
        status: 'Válido',
        criadoEm: new Date().toISOString()
      });
    }

    setIsModalOpen(false);
  };

  // Concluir Retorno ao Trabalho
  const handleOpenRetorno = (afastamento: AfastamentoColaborador) => {
    setSelectedForRetorno(afastamento);
    setDadosRetornoForm({
      resultadoAso: 'Apto',
      dataExameAso: new Date().toISOString().split('T')[0],
      dataConclusao: new Date().toISOString().split('T')[0],
      medicoExaminador: 'Dr. Fernando M. Sampaio - CRM/SP 129038',
      descricaoRestricoes: ''
    });
    setIsRetornoModalOpen(true);
  };

  const handleSaveRetorno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForRetorno) return;

    const retornoData: DadosRetornoTrabalho = {
      dataExameAso: dadosRetornoForm.dataExameAso,
      resultadoAso: dadosRetornoForm.resultadoAso || 'Apto',
      medicoExaminador: dadosRetornoForm.medicoExaminador,
      crmMedicoExaminador: dadosRetornoForm.crmMedicoExaminador,
      descricaoRestricoes: dadosRetornoForm.descricaoRestricoes,
      observacoesGestor: dadosRetornoForm.observacoesGestor,
      dataConclusao: dadosRetornoForm.dataConclusao || new Date().toISOString().split('T')[0]
    };

    await concluirRetornoAoTrabalhoFirestore(selectedForRetorno, retornoData);

    setAfastamentos(prev => prev.map(a => {
      if (a.id === selectedForRetorno.id) {
        return {
          ...a,
          status: 'Concluído',
          retornoTrabalhoRealizado: retornoData.dataConclusao,
          dadosRetornoTrabalho: retornoData
        };
      }
      return a;
    }));

    setIsRetornoModalOpen(false);
  };

  // Salvar Registro de CAT (Comunicação de Acidente de Trabalho)
  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !catColabId) return;

    const colabTarget = colaboradores.find(c => c.id === catColabId) || colaboradores[0];
    const catData: DadosCat = {
      numeroCat: editingCat.numeroCat || `CAT-${Date.now().toString().slice(-6)}`,
      tipoCat: editingCat.tipoCat || 'Inicial',
      dataAcidente: editingCat.dataAcidente || new Date().toISOString().split('T')[0],
      horaAcidente: editingCat.horaAcidente || '14:30',
      tipoAcidente: editingCat.tipoAcidente || 'Típico',
      localAcidente: editingCat.localAcidente || 'Setor Operacional / Produção',
      descricaoAcidente: editingCat.descricaoAcidente || 'Queda de mesmo nível resultando em entorse.',
      parteCorpoAtingida: editingCat.parteCorpoAtingida || 'Membro inferior (Tornozelo)',
      houveAfastamento: editingCat.houveAfastamento ?? true,
      protocoloEsocial: editingCat.protocoloEsocial || `1.2.2026.${Date.now().toString().slice(-8)}`
    };

    const newAfastamento: AfastamentoColaborador = {
      id: `afast-cat-${Date.now()}`,
      empresaId: companyId,
      companyId,
      colaboradorId: colabTarget.id,
      colaboradorNome: colabTarget.nomeCompleto,
      cargo: colabTarget.profissionais.cargo,
      departamento: colabTarget.profissionais.departamento,
      tipo: 'CAT',
      dataInicio: catData.dataAcidente,
      dataFim: catData.dataAcidente,
      diasAfastado: 1,
      dadosCat: catData,
      status: 'Ativo',
      observacoes: `CAT registrada: ${catData.descricaoAcidente}`,
      createdAt: new Date().toISOString()
    };

    await saveAfastamentoFirestore(newAfastamento);
    setAfastamentos(prev => [newAfastamento, ...prev]);
    setIsCatModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
              <Stethoscope className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Gestão de Afastamentos, Licenças e Retorno ao Trabalho</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle de atestados médicos, licenças, CAT (Acidentes de trabalho), processos INSS e ASO de Retorno.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => {
              setEditingCat({
                tipoCat: 'Inicial',
                dataAcidente: new Date().toISOString().split('T')[0],
                tipoAcidente: 'Típico',
                houveAfastamento: true
              });
              setCatColabId(colaboradores[0]?.id || '');
              setIsCatModalOpen(true);
            }}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Registrar CAT</span>
          </button>

          <button
            onClick={() => handleOpenAfastamento()}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Afastamento</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('afastamentos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'afastamentos'
              ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Afastamentos & Atestados ({afastamentos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cat')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cat'
              ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Registros de CAT ({totalCat})</span>
        </button>

        <button
          onClick={() => setActiveTab('inss')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'inss'
              ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Processos INSS ({totalInss})</span>
        </button>

        <button
          onClick={() => setActiveTab('retorno')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'retorno'
              ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheckIcon className="w-4 h-4" />
          <span>Retorno ao Trabalho & ASO</span>
        </button>

        <button
          onClick={() => setActiveTab('alertas')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'alertas'
              ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Painel de Alertas DP</span>
        </button>
      </div>

      {/* Filter Bar */}
      {activeTab === 'afastamentos' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar colaborador ou CID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1E293B] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-[#1E293B] focus:outline-hidden"
            >
              <option value="Todos">Todos os Tipos</option>
              <option value="Atestado médico">Atestado médico</option>
              <option value="Licença-maternidade">Licença-maternidade</option>
              <option value="Licença-paternidade">Licença-paternidade</option>
              <option value="Afastamento pelo INSS">Afastamento pelo INSS</option>
              <option value="CAT">CAT / Acidente</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-[#1E293B] focus:outline-hidden"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Encaminhado INSS">Encaminhado INSS</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 1: LISTA DE AFASTAMENTOS & ATESTADOS */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'afastamentos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-[#1E293B] text-sm">{a.colaboradorNome}</h3>
                    <p className="text-xs text-slate-500">{a.cargo} • {a.departamento}</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    a.status === 'Ativo' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    a.status === 'Encaminhado INSS' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    a.status === 'Concluído' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {a.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between font-bold text-[#1E293B]">
                    <span>Tipo:</span>
                    <span className="text-blue-600">{a.tipo}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Período:</span>
                    <span>{a.dataInicio} até {a.dataFim} ({a.diasAfastado} dias)</span>
                  </div>

                  {a.cid && (
                    <div className="flex justify-between text-slate-700 font-mono text-[11px]">
                      <span>CID:</span>
                      <span className="font-bold">{a.cid}</span>
                    </div>
                  )}

                  {a.medicoResponsavel && (
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      Médico: {a.medicoResponsavel} ({a.crmMedico || 'CRM N/I'})
                    </div>
                  )}
                </div>
              </div>

              {a.status === 'Ativo' && (
                <button
                  onClick={() => handleOpenRetorno(a)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir Retorno ao Trabalho</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 2: CAT (ACIDENTES DE TRABALHO) */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'cat' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-[#1E293B] text-sm">Comunicação de Acidente de Trabalho (CAT eSocial)</h3>
              <p className="text-xs text-slate-500">Obrigação eSocial até o 1º dia útil subsequente ao acidente (ou imediato em caso de óbito).</p>
            </div>
          </div>

          <div className="space-y-3">
            {afastamentos.filter(a => a.tipo === 'CAT' || a.dadosCat).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhum acidente ou registro de CAT encontrado.</p>
            ) : (
              afastamentos.filter(a => a.tipo === 'CAT' || a.dadosCat).map(a => (
                <div key={a.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-sm">{a.colaboradorNome}</span>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-mono text-[10px] font-bold">
                      Protocolo eSocial: {a.dadosCat?.protocoloEsocial || 'Pendente'}
                    </span>
                  </div>
                  <p className="text-slate-600"><strong>Descrição:</strong> {a.dadosCat?.descricaoAcidente || a.observacoes}</p>
                  <p className="text-slate-500 text-[11px]">Local: {a.dadosCat?.localAcidente} | Tipo: {a.dadosCat?.tipoAcidente}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 3: INSS & AUXÍLIO-DOENÇA */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'inss' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-[#1E293B] text-sm">Encaminhamentos ao INSS (Superior a 15 Dias)</h3>
            <p className="text-xs text-slate-500">Conforme a CLT, os primeiros 15 dias de afastamento são pagos pela empresa. Do 16º dia em diante o pagamento é assumido pelo INSS.</p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <p className="font-bold">Acompanhamento dos Benefícios B31 (Auxílio-doença) e B91 (Acidente de trabalho)</p>
            <p className="text-amber-800">Após a emissão do Requerimento de Benefício por Incapacidade, o acompanhamento do laudo e perícia médica deve ser sincronizado com a Folha de Pagamento para cessação do salário patronal.</p>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 4: RETORNO AO TRABALHO & ASO */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'retorno' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-[#1E293B] text-sm">Exames Médicos de Retorno ao Trabalho (ASO)</h3>
            <p className="text-xs text-slate-500">Obrigatório para afastamentos superiores a 30 dias (NR-7). Validação de aptidão física e mental.</p>
          </div>

          <div className="space-y-3">
            {afastamentos.filter(a => a.status === 'Concluído' && a.dadosRetornoTrabalho).map(a => (
              <div key={a.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#1E293B]">{a.colaboradorNome}</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                    ASO: {a.dadosRetornoTrabalho?.resultadoAso}
                  </span>
                </div>
                <p className="text-slate-600">Retorno concluído em: {a.retornoTrabalhoRealizado}</p>
                <p className="text-slate-500 text-[11px]">Examinador: {a.dadosRetornoTrabalho?.medicoExaminador}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 5: ALERTAS DO DP */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'alertas' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-[#1E293B] text-sm">Alertas Ocupacionais e Prazos do DP</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Prazo Legal da CAT: 24 Horas</p>
                <p className="mt-0.5 text-rose-800">
                  A não emissão da Comunicação de Acidente de Trabalho dentro do prazo de 24 horas gera multa administrativa aplicada pelos auditores fiscais do trabalho.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Controle da Regra dos 15 Dias</p>
                <p className="mt-0.5 text-amber-800">
                  Caso o colaborador apresente múltiplos atestados médicos pelo mesmo motivo (mesmo CID) dentro de um período de 60 dias, os dias são somados para encaminhamento ao INSS.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL REGISTRO DE AFASTAMENTO */}
      {/* -------------------------------------------------------------------------------- */}
      {isModalOpen && editingAfastamento && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#1E293B] text-sm">Registro de Afastamento / Atestado Médico</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveAfastamento} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador</label>
                <select
                  value={editingAfastamento.colaboradorId}
                  onChange={(e) => {
                    const found = colaboradores.find(c => c.id === e.target.value);
                    if (found) {
                      setEditingAfastamento({
                        ...editingAfastamento,
                        colaboradorId: found.id,
                        colaboradorNome: found.nomeCompleto,
                        cargo: found.profissionais.cargo,
                        departamento: found.profissionais.departamento
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  {colaboradores.map(c => (
                    <option key={c.id} value={c.id}>{c.nomeCompleto} ({c.profissionais.cargo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Afastamento</label>
                <select
                  value={editingAfastamento.tipo}
                  onChange={(e) => setEditingAfastamento({ ...editingAfastamento, tipo: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Atestado médico">Atestado médico</option>
                  <option value="Licença-maternidade">Licença-maternidade (120/180 dias)</option>
                  <option value="Licença-paternidade">Licença-paternidade (5/20 dias)</option>
                  <option value="Afastamento pelo INSS">Afastamento pelo INSS (B31/B91)</option>
                  <option value="Licença Luto">Licença Luto (Nojo)</option>
                  <option value="Licença Casamento">Licença Casamento (Gala)</option>
                  <option value="CAT">CAT / Acidente de trabalho</option>
                  <option value="Falta justificada">Falta justificada</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={editingAfastamento.dataInicio || ''}
                    onChange={(e) => setEditingAfastamento({ ...editingAfastamento, dataInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={editingAfastamento.dataFim || ''}
                    onChange={(e) => setEditingAfastamento({ ...editingAfastamento, dataFim: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código CID (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: J11, M54"
                    value={editingAfastamento.cid || ''}
                    onChange={(e) => setEditingAfastamento({ ...editingAfastamento, cid: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CRM Médico</label>
                  <input
                    type="text"
                    placeholder="Ex: CRM/SP 123456"
                    value={editingAfastamento.crmMedico || ''}
                    onChange={(e) => setEditingAfastamento({ ...editingAfastamento, crmMedico: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Médico Responsável / Clínica</label>
                <input
                  type="text"
                  placeholder="Nome do médico ou hospital"
                  value={editingAfastamento.medicoResponsavel || ''}
                  onChange={(e) => setEditingAfastamento({ ...editingAfastamento, medicoResponsavel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Salvar Afastamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL REGISTRO DE CAT */}
      {/* -------------------------------------------------------------------------------- */}
      {isCatModalOpen && editingCat && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#1E293B] text-sm">Registro de Comunicação de Acidente de Trabalho (CAT)</h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveCat} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador Acidentado</label>
                <select
                  value={catColabId}
                  onChange={(e) => setCatColabId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                >
                  {colaboradores.map(c => (
                    <option key={c.id} value={c.id}>{c.nomeCompleto} ({c.profissionais.cargo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de CAT</label>
                  <select
                    value={editingCat.tipoCat}
                    onChange={(e) => setEditingCat({ ...editingCat, tipoCat: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="Inicial">Inicial</option>
                    <option value="Reabertura">Reabertura</option>
                    <option value="Óbito">Óbito</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Acidente</label>
                  <select
                    value={editingCat.tipoAcidente}
                    onChange={(e) => setEditingCat({ ...editingCat, tipoAcidente: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="Típico">Típico (No local de trabalho)</option>
                    <option value="Trajeto">Trajeto (Residência / Trabalho)</option>
                    <option value="Doença Ocupacional">Doença Ocupacional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data do Acidente</label>
                  <input
                    type="date"
                    value={editingCat.dataAcidente || ''}
                    onChange={(e) => setEditingCat({ ...editingCat, dataAcidente: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora do Acidente</label>
                  <input
                    type="time"
                    value={editingCat.horaAcidente || '14:00'}
                    onChange={(e) => setEditingCat({ ...editingCat, horaAcidente: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Local e Descrição Detalhada</label>
                <textarea
                  rows={3}
                  value={editingCat.descricaoAcidente || ''}
                  onChange={(e) => setEditingCat({ ...editingCat, descricaoAcidente: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  placeholder="Relato circunstanciado do acidente e lesões decorrentes..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Registrar e Gerar Protocolo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL RETORNO AO TRABALHO & ASO */}
      {/* -------------------------------------------------------------------------------- */}
      {isRetornoModalOpen && selectedForRetorno && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#1E293B] text-sm">Conclusão do Retorno ao Trabalho (ASO)</h3>
              <button onClick={() => setIsRetornoModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveRetorno} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-[#1E293B]">{selectedForRetorno.colaboradorNome}</p>
                <p className="text-slate-500">{selectedForRetorno.tipo} — {selectedForRetorno.diasAfastado} dias</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Resultado do ASO (Exame Médico)</label>
                <select
                  value={dadosRetornoForm.resultadoAso}
                  onChange={(e) => setDadosRetornoForm({ ...dadosRetornoForm, resultadoAso: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="Apto">Apto para Retorno sem Restrições</option>
                  <option value="Apto com Restrições">Apto com Restrições Temporárias</option>
                  <option value="Inapto">Inapto (Manter Afastamento / Reencaminhar)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Médico Examinador / CRM</label>
                <input
                  type="text"
                  value={dadosRetornoForm.medicoExaminador || ''}
                  onChange={(e) => setDadosRetornoForm({ ...dadosRetornoForm, medicoExaminador: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              {dadosRetornoForm.resultadoAso === 'Apto com Restrições' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Descrição das Restrições Físicas / Ergonômicas</label>
                  <textarea
                    rows={2}
                    value={dadosRetornoForm.descricaoRestricoes || ''}
                    onChange={(e) => setDadosRetornoForm({ ...dadosRetornoForm, descricaoRestricoes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    placeholder="Ex: Proibição de carregar peso acima de 5kg por 30 dias..."
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRetornoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Confirmar Retorno ao Trabalho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function UserCheckIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 11l2 2 4-4" />
    </svg>
  );
}
