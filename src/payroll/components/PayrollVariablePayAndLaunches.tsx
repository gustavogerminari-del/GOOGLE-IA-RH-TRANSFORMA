import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, CheckCircle, Clock, TrendingUp, AlertCircle, Shield, FileText } from 'lucide-react';
import {
  getVariablePayFirestore,
  saveVariablePayFirestore,
  getSalaryHistoryFirestore,
  saveSalaryHistoryFirestore,
  getAlimonyFirestore,
  saveAlimonyFirestore,
  getLoansFirestore,
  saveLoanFirestore,
  getColaboradoresFirestore
} from '../services/payrollFirestoreService';

interface PayrollVariablePayAndLaunchesProps {
  companyId: string;
  referenceMonth: string;
}

export const PayrollVariablePayAndLaunches: React.FC<PayrollVariablePayAndLaunchesProps> = ({
  companyId,
  referenceMonth
}) => {
  const [activeTab, setActiveTab] = useState<'variable' | 'salary' | 'alimony' | 'loans'>('variable');
  const [colabs, setColabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // List States
  const [variables, setVariables] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [alimonies, setAlimonies] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);

  // Modals / Forms
  const [showVarModal, setShowVarModal] = useState(false);
  const [newVar, setNewVar] = useState({
    employeeId: '',
    tipo: 'comissao' as any,
    valor: 0,
    origem: 'Metas Comercial',
    responsavel: 'Gestor Comercial'
  });

  const [showSalModal, setShowSalModal] = useState(false);
  const [newSal, setNewSal] = useState({
    employeeId: '',
    salarioAnterior: 3500,
    salarioNovo: 4200,
    motivo: 'Promocao Meritocracia',
    vigencia: referenceMonth
  });

  const [showAlimonyModal, setShowAlimonyModal] = useState(false);
  const [newAlimony, setNewAlimony] = useState({
    employeeId: '',
    beneficiario: 'Dependentes Judiciais',
    cpfBeneficiario: '000.000.000-00',
    tipoCalculo: 'percentual_liquido' as any,
    valorOuPercentual: 20,
    contaPagamento: '341 / 0123 / 11223-4',
    vigenciaInicio: `${referenceMonth}-01`
  });

  const [showLoanModal, setShowLoanModal] = useState(false);
  const [newLoan, setNewLoan] = useState({
    employeeId: '',
    instituicao: 'Banco Itaú Consignado',
    contratoNumero: 'CT-998811',
    valorTotal: 6000,
    valorParcela: 500,
    totalParcelas: 12,
    parcelasPagas: 0,
    saldoDevedor: 6000
  });

  async function loadData() {
    setLoading(true);
    try {
      const [colabList, varList, salList, alList, loanList] = await Promise.all([
        getColaboradoresFirestore(companyId),
        getVariablePayFirestore(companyId, referenceMonth),
        getSalaryHistoryFirestore(companyId),
        getAlimonyFirestore(companyId),
        getLoansFirestore(companyId)
      ]);
      setColabs(colabList || []);
      setVariables(varList || []);
      setSalaries(salList || []);
      setAlimonies(alList || []);
      setLoans(loanList || []);
      if (colabList && colabList.length > 0) {
        setNewVar(prev => ({ ...prev, employeeId: colabList[0].id }));
        setNewSal(prev => ({ ...prev, employeeId: colabList[0].id }));
        setNewAlimony(prev => ({ ...prev, employeeId: colabList[0].id }));
        setNewLoan(prev => ({ ...prev, employeeId: colabList[0].id }));
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [companyId, referenceMonth]);

  const handleSaveVar = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveVariablePayFirestore(companyId, {
      ...newVar,
      competencia: referenceMonth,
      aprovacao: 'aprovado'
    });
    setShowVarModal(false);
    await loadData();
  };

  const handleSaveSal = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSalaryHistoryFirestore(companyId, {
      ...newSal,
      responsavel: 'RH / DP RH TRANSFORMA'
    });
    setShowSalModal(false);
    await loadData();
  };

  const handleSaveAlimony = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAlimonyFirestore(companyId, {
      ...newAlimony,
      status: 'Ativo'
    });
    setShowAlimonyModal(false);
    await loadData();
  };

  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveLoanFirestore(companyId, {
      ...newLoan,
      status: 'Ativo'
    });
    setShowLoanModal(false);
    await loadData();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
              Lançamentos Especiais, Pensões & Consignados
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Lançamentos de Variáveis, Histórico Salarial e Descontos Judiciais
            </h2>
            <p className="text-xs text-slate-500">
              Gestão individual de comissões, bônus, reajustes, pensões alimentícias e empréstimos consignados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'variable' && (
              <button
                onClick={() => setShowVarModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Comissão / Variável</span>
              </button>
            )}
            {activeTab === 'salary' && (
              <button
                onClick={() => setShowSalModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Alteração Salarial</span>
              </button>
            )}
            {activeTab === 'alimony' && (
              <button
                onClick={() => setShowAlimonyModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Pensão Judicial</span>
              </button>
            )}
            {activeTab === 'loans' && (
              <button
                onClick={() => setShowLoanModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Consignado</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-bold space-x-4">
          <button
            onClick={() => setActiveTab('variable')}
            className={`pb-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'variable'
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Comissões & Prêmios ({variables.length})
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`pb-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'salary'
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Histórico Salarial ({salaries.length})
          </button>
          <button
            onClick={() => setActiveTab('alimony')}
            className={`pb-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'alimony'
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pensão Alimentícia ({alimonies.length})
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`pb-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'loans'
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Empréstimos Consignados ({loans.length})
          </button>
        </div>

        {/* Tab 1: Comissões & Variáveis */}
        {activeTab === 'variable' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Origem / Justificativa</th>
                  <th className="p-3 text-right">Valor (R$)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {variables.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      Nenhum lançamento variável cadastrado para este mês.
                    </td>
                  </tr>
                ) : (
                  variables.map(v => {
                    const colab = colabs.find(c => c.id === v.employeeId);
                    return (
                      <tr key={v.variablePayId || v.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">
                          {colab?.nomeCompleto || v.employeeId}
                        </td>
                        <td className="p-3 uppercase text-[10px] font-black text-blue-700">
                          {v.tipo}
                        </td>
                        <td className="p-3 text-slate-600">{v.origem}</td>
                        <td className="p-3 text-right font-black text-slate-900">
                          R$ {(v.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                            Aprovado
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Histórico Salarial */}
        {activeTab === 'salary' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Vigência</th>
                  <th className="p-3 text-right">Salário Anterior</th>
                  <th className="p-3 text-right">Novo Salário</th>
                  <th className="p-3">Motivo / Reajuste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {salaries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      Nenhum histórico salarial registrado.
                    </td>
                  </tr>
                ) : (
                  salaries.map(s => {
                    const colab = colabs.find(c => c.id === s.employeeId);
                    return (
                      <tr key={s.salaryHistoryId || s.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">
                          {colab?.nomeCompleto || s.employeeId}
                        </td>
                        <td className="p-3 font-mono text-slate-600">{s.vigencia}</td>
                        <td className="p-3 text-right font-semibold text-slate-500">
                          R$ {(s.salarioAnterior || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-700">
                          R$ {(s.salarioNovo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-slate-700">{s.motivo}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Pensão Alimentícia */}
        {activeTab === 'alimony' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Favorecido / CPF</th>
                  <th className="p-3">Tipo de Cálculo</th>
                  <th className="p-3 text-right">Valor / Percentual</th>
                  <th className="p-3">Conta Beneficiário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {alimonies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      Nenhuma pensão alimentícia judicial cadastrada.
                    </td>
                  </tr>
                ) : (
                  alimonies.map(a => {
                    const colab = colabs.find(c => c.id === a.employeeId);
                    return (
                      <tr key={a.alimonyId || a.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">
                          {colab?.nomeCompleto || a.employeeId}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          <div>{a.beneficiario}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{a.cpfBeneficiario}</div>
                        </td>
                        <td className="p-3 uppercase text-[10px] font-bold text-slate-600">
                          {a.tipoCalculo?.replace('_', ' ')}
                        </td>
                        <td className="p-3 text-right font-black text-rose-700">
                          {a.tipoCalculo === 'valor_fixo'
                            ? `R$ ${(a.valorOuPercentual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : `${a.valorOuPercentual}%`}
                        </td>
                        <td className="p-3 text-slate-600 font-mono text-[10px]">{a.contaPagamento}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Empréstimos Consignados */}
        {activeTab === 'loans' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Instituição Financeira</th>
                  <th className="p-3">Contrato nº</th>
                  <th className="p-3 text-right">Valor Parcela (R$)</th>
                  <th className="p-3 text-center">Parcelas / Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      Nenhum empréstimo consignado ativo.
                    </td>
                  </tr>
                ) : (
                  loans.map(l => {
                    const colab = colabs.find(c => c.id === l.employeeId);
                    return (
                      <tr key={l.loanId || l.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">
                          {colab?.nomeCompleto || l.employeeId}
                        </td>
                        <td className="p-3 font-bold text-slate-800">{l.instituicao}</td>
                        <td className="p-3 font-mono text-slate-600">{l.contratoNumero}</td>
                        <td className="p-3 text-right font-black text-slate-900">
                          R$ {(l.valorParcela || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center text-slate-600 font-semibold">
                          {l.parcelasPagas} / {l.totalParcelas} (Saldo R$ {l.saldoDevedor})
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Modal Nova Comissão */}
      {showVarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Nova Comissão / Variável</h3>
            <form onSubmit={handleSaveVar} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador *</label>
                <select
                  value={newVar.employeeId}
                  onChange={e => setNewVar({ ...newVar, employeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  {colabs.map(c => (
                    <option key={c.id} value={c.id}>{c.nomeCompleto}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Lançamento</label>
                <select
                  value={newVar.tipo}
                  onChange={e => setNewVar({ ...newVar, tipo: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  <option value="comissao">Comissão de Vendas</option>
                  <option value="bonus">Bônus por Resultado</option>
                  <option value="premio">Prêmio de Produtividade</option>
                  <option value="reembolso">Reembolso de Despesas</option>
                  <option value="ajuda_custo">Ajuda de Custo</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newVar.valor}
                  onChange={e => setNewVar({ ...newVar, valor: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Origem / Justificativa</label>
                <input
                  type="text"
                  value={newVar.origem}
                  onChange={e => setNewVar({ ...newVar, origem: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowVarModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl cursor-pointer"
                >
                  Salvar Variável
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reajuste Salarial */}
      {showSalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Registrar Reajuste Salarial</h3>
            <form onSubmit={handleSaveSal} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador *</label>
                <select
                  value={newSal.employeeId}
                  onChange={e => setNewSal({ ...newSal, employeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  {colabs.map(c => (
                    <option key={c.id} value={c.id}>{c.nomeCompleto}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Salário Anterior</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSal.salarioAnterior}
                    onChange={e => setNewSal({ ...newSal, salarioAnterior: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Novo Salário *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newSal.salarioNovo}
                    onChange={e => setNewSal({ ...newSal, salarioNovo: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo / Reajuste</label>
                <input
                  type="text"
                  required
                  value={newSal.motivo}
                  onChange={e => setNewSal({ ...newSal, motivo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSalModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl cursor-pointer"
                >
                  Salvar Histórico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
