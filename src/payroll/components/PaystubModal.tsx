import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  CheckCircle2, 
  Printer, 
  Download, 
  ShieldCheck, 
  Building2, 
  User, 
  Calendar, 
  CreditCard,
  Lock,
  Plus,
  Trash2
} from 'lucide-react';
import { Paystub, PaystubItem } from '../types/payroll';
import { savePaystubFirestore, signPaystubFirestore } from '../services/payrollFirestoreService';
import { useAuth } from '../../auth';

interface PaystubModalProps {
  paystub: Paystub;
  isClosedPeriod: boolean;
  canEdit: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const PaystubModal: React.FC<PaystubModalProps> = ({
  paystub: initialPaystub,
  isClosedPeriod,
  canEdit,
  onClose,
  onUpdate
}) => {
  const { user } = useAuth();
  const companyId = user?.companyId || user?.empresaId || user?.tenantId || '';

  const [paystub, setPaystub] = useState<Paystub>(initialPaystub);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItemCode, setNewItemCode] = useState('1002');
  const [newItemName, setNewItemName] = useState('Horas Extras 50%');
  const [newItemType, setNewItemType] = useState<'Provento' | 'Desconto'>('Provento');
  const [newItemRef, setNewItemRef] = useState('5:00 hrs');
  const [newItemAmount, setNewItemAmount] = useState<number>(150.00);

  const proventosItems = paystub.items.filter(i => i.type === 'Provento');
  const descontosItems = paystub.items.filter(i => i.type === 'Desconto');
  const informativasItems = paystub.items.filter(i => i.type === 'Informativa');

  // Max rows to maintain alignment
  const maxRows = Math.max(proventosItems.length, descontosItems.length, 5);

  const handleSign = async () => {
    const updated = await signPaystubFirestore(
      companyId,
      paystub.id,
      '189.120.45.12',
      user?.name || paystub.employeeName,
      user?.email || 'colaborador@maisrh.com.br'
    );
    if (updated) {
      setPaystub(updated);
      onUpdate();
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemAmount) return;

    const newItem: PaystubItem = {
      id: `item-${Date.now()}`,
      code: newItemCode,
      name: newItemName,
      type: newItemType,
      reference: newItemRef,
      amount: Number(newItemAmount),
      isManual: true
    };

    const updatedItems = [...paystub.items, newItem];
    const totalProventos = updatedItems.filter(i => i.type === 'Provento').reduce((acc, i) => acc + i.amount, 0);
    const totalDescontos = updatedItems.filter(i => i.type === 'Desconto').reduce((acc, i) => acc + i.amount, 0);
    const valorLiquido = Number((totalProventos - totalDescontos).toFixed(2));

    const updatedStub: Paystub = {
      ...paystub,
      items: updatedItems,
      totalProventos: Number(totalProventos.toFixed(2)),
      totalDescontos: Number(totalDescontos.toFixed(2)),
      valorLiquido
    };

    await savePaystubFirestore(companyId, updatedStub);
    setPaystub(updatedStub);
    onUpdate();
    setShowAddItemForm(false);
  };

  const handleRemoveItem = async (itemId: string) => {
    const updatedItems = paystub.items.filter(i => i.id !== itemId);
    const totalProventos = updatedItems.filter(i => i.type === 'Provento').reduce((acc, i) => acc + i.amount, 0);
    const totalDescontos = updatedItems.filter(i => i.type === 'Desconto').reduce((acc, i) => acc + i.amount, 0);
    const valorLiquido = Number((totalProventos - totalDescontos).toFixed(2));

    const updatedStub: Paystub = {
      ...paystub,
      items: updatedItems,
      totalProventos: Number(totalProventos.toFixed(2)),
      totalDescontos: Number(totalDescontos.toFixed(2)),
      valorLiquido
    };

    await savePaystubFirestore(companyId, updatedStub);
    setPaystub(updatedStub);
    onUpdate();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                Recibo de Pagamento de Salário (Holerite Digital)
                {paystub.statusAssinatura === 'Assinado Digitalmente' && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Assinado E-CLT
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">{paystub.periodName} • Empresa Grupo Alpha Logística S/A</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Holerite Document Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 font-sans printable-area">
          
          {/* Header Documento Oficial */}
          <div className="border-2 border-slate-900 rounded-xl p-4 space-y-3 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-300 pb-3 gap-2">
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  GRUPO ALPHA LOGÍSTICA S/A
                </h1>
                <p className="text-xs text-slate-600 font-semibold">
                  CNPJ: 12.345.678/0001-90 • Av. Paulista, 1578 - São Paulo/SP
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
                  {paystub.periodName}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">ID: {paystub.id}</p>
              </div>
            </div>

            {/* Employee Information */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Colaborador(a)</span>
                <span className="font-extrabold text-slate-900">{paystub.employeeName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">CPF</span>
                <span className="font-extrabold text-slate-900">{paystub.cpf}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Cargo</span>
                <span className="font-extrabold text-slate-900">{paystub.cargo}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Departamento</span>
                <span className="font-extrabold text-slate-900">{paystub.departamento}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Data Admissão</span>
                <span className="font-bold text-slate-800">{paystub.admissaoDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Salário Contratual</span>
                <span className="font-extrabold text-indigo-600">R$ {paystub.salarioBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Conta para Depósito</span>
                <span className="font-semibold text-slate-800">{paystub.bancoInfo?.banco || 'Itaú Unibanco'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Agência / Conta</span>
                <span className="font-semibold text-slate-800">{paystub.bancoInfo?.agencia || '1234'} / {paystub.bancoInfo?.conta || '56789-0'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action bar for adding manual items if allowed */}
          {canEdit && !isClosedPeriod && (
            <div className="flex justify-between items-center bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                Lançamentos Avulsos & Proventos/Descontos
              </span>
              <button
                onClick={() => setShowAddItemForm(!showAddItemForm)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg transition-all cursor-pointer shadow-xs"
              >
                {showAddItemForm ? 'Fechar Formulário' : '+ Adicionar Rúbrica'}
              </button>
            </div>
          )}

          {/* Form manual item */}
          {showAddItemForm && (
            <form onSubmit={handleAddItem} className="bg-slate-100 rounded-xl p-4 border border-slate-300 space-y-3 text-xs">
              <h4 className="font-extrabold text-slate-900">Novo Lançamento na Folha</h4>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Código</label>
                  <input
                    type="text"
                    value={newItemCode}
                    onChange={e => setNewItemCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Descrição Rúbrica</label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Tipo</label>
                  <select
                    value={newItemType}
                    onChange={e => setNewItemType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-bold"
                  >
                    <option value="Provento">Provento (+)</option>
                    <option value="Desconto">Desconto (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Referência</label>
                  <input
                    type="text"
                    value={newItemRef}
                    onChange={e => setNewItemRef(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Valor R$</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItemAmount}
                    onChange={e => setNewItemAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-black text-indigo-600"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg cursor-pointer"
                >
                  Recalcular e Salvar
                </button>
              </div>
            </form>
          )}

          {/* Main Table Proventos e Descontos */}
          <div className="border-2 border-slate-900 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="p-2.5 w-16">Cód</th>
                  <th className="p-2.5">Descrição da Rúbrica</th>
                  <th className="p-2.5 w-24">Ref.</th>
                  <th className="p-2.5 w-28 text-right">Proventos (R$)</th>
                  <th className="p-2.5 w-28 text-right">Descontos (R$)</th>
                  {canEdit && !isClosedPeriod && <th className="p-2.5 w-10"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {Array.from({ length: maxRows }).map((_, idx) => {
                  const provento = proventosItems[idx];
                  const desconto = descontosItems[idx];

                  if (!provento && !desconto) return null;

                  return (
                    <tr key={idx} className="hover:bg-slate-50 font-semibold">
                      {provento ? (
                        <>
                          <td className="p-2 font-mono text-slate-500 font-bold">{provento.code}</td>
                          <td className="p-2 font-bold text-slate-900 flex items-center justify-between">
                            <span>{provento.name}</span>
                            {provento.isManual && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded">Avulso</span>
                            )}
                          </td>
                          <td className="p-2 font-medium text-slate-600">{provento.reference}</td>
                          <td className="p-2 text-right font-extrabold text-emerald-700">
                            R$ {provento.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2 text-right text-slate-400">-</td>
                          {canEdit && !isClosedPeriod && (
                            <td className="p-2 text-center">
                              {provento.isManual && (
                                <button
                                  onClick={() => handleRemoveItem(provento.id)}
                                  className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                  title="Remover Rúbrica"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          )}
                        </>
                      ) : desconto ? (
                        <>
                          <td className="p-2 font-mono text-slate-500 font-bold">{desconto.code}</td>
                          <td className="p-2 font-bold text-slate-900 flex items-center justify-between">
                            <span>{desconto.name}</span>
                            {desconto.isManual && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded">Avulso</span>
                            )}
                          </td>
                          <td className="p-2 font-medium text-slate-600">{desconto.reference}</td>
                          <td className="p-2 text-right text-slate-400">-</td>
                          <td className="p-2 text-right font-extrabold text-rose-700">
                            R$ {desconto.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          {canEdit && !isClosedPeriod && (
                            <td className="p-2 text-center">
                              {desconto.isManual && (
                                <button
                                  onClick={() => handleRemoveItem(desconto.id)}
                                  className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                  title="Remover Rúbrica"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          )}
                        </>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Total Row */}
            <div className="bg-slate-100 p-3 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-3 font-black text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center">
                <span className="text-[10px] text-emerald-800 font-extrabold uppercase block">Total Proventos (+)</span>
                <span className="text-base text-emerald-700">
                  R$ {paystub.totalProventos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-center">
                <span className="text-[10px] text-rose-800 font-extrabold uppercase block">Total Descontos (-)</span>
                <span className="text-base text-rose-700">
                  R$ {paystub.totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-indigo-600 text-white rounded-lg p-2.5 text-center shadow-md">
                <span className="text-[10px] text-indigo-100 font-black uppercase block">VALOR LÍQUIDO A RECEBER (=)</span>
                <span className="text-lg">
                  R$ {paystub.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Tax Bases Section */}
          <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 font-semibold">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Base Cálculo INSS</span>
              <span className="font-extrabold text-slate-900">R$ {paystub.baseINSS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Base Cálculo IRRF</span>
              <span className="font-extrabold text-slate-900">R$ {paystub.baseIRRF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Base Cálculo FGTS</span>
              <span className="font-extrabold text-slate-900">R$ {paystub.baseFGTS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase">FGTS Recolhido (8%)</span>
              <span className="font-extrabold text-indigo-700">R$ {paystub.valorFGTS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Employer Charges Box */}
          <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-3 text-[11px] space-y-1">
            <span className="font-extrabold text-amber-900 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              Resumo de Encargos Patronais da Empresa (Informativo DP):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 font-medium">
              <div>INSS Patronal (20%): <strong>R$ {paystub.employerCharges.inssPatronal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
              <div>RAT / SAT (2%): <strong>R$ {paystub.employerCharges.ratSat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
              <div>Terceiros (5,8%): <strong>R$ {paystub.employerCharges.terceiros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
              <div>Total Custo Empresa: <strong className="text-amber-900 font-black">R$ {(paystub.totalProventos + paystub.employerCharges.totalPatronal + paystub.employerCharges.fgtsValor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
            </div>
          </div>

          {/* Digital Signature Footer Section */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="font-black text-slate-900 text-xs uppercase">Validação & Assinatura Eletrônica do Colaborador</h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Conforme Lei 14.063/2020 e Art. 464 da CLT. A confirmação digital substitui a assinatura física em papel.
              </p>

              {paystub.statusAssinatura === 'Assinado Digitalmente' ? (
                <div className="mt-2 space-y-0.5 text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                  <p><strong>Status:</strong> Assinado e Confirmado em {new Date(paystub.dataAssinatura!).toLocaleString('pt-BR')}</p>
                  <p><strong>Hash de Segurança:</strong> {paystub.hashDigital}</p>
                  <p><strong>IP de Validação:</strong> {paystub.ipAssinatura || '189.120.45.12'}</p>
                </div>
              ) : (
                <p className="text-xs text-amber-700 font-bold mt-1">Aguardando assinatura do colaborador no Portal do Funcionário.</p>
              )}
            </div>

            {paystub.statusAssinatura !== 'Assinado Digitalmente' && (
              <button
                onClick={handleSign}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer shrink-0 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Assinar Holerite Digitalmente</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
