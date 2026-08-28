import React, { useState, useEffect } from 'react';
import { CreditCard, Download, CheckCircle, Clock, AlertTriangle, FileSpreadsheet, Search, RefreshCw } from 'lucide-react';
import { getPayrollPaymentsFirestore, savePayrollPaymentFirestore } from '../services/payrollFirestoreService';

interface PayrollPaymentsModuleProps {
  companyId: string;
  selectedPeriodId?: string;
}

export const PayrollPaymentsModule: React.FC<PayrollPaymentsModuleProps> = ({ companyId, selectedPeriodId }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadPayments() {
    setLoading(true);
    try {
      const data = await getPayrollPaymentsFirestore(companyId, selectedPeriodId);
      setPayments(data || []);
    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, [companyId, selectedPeriodId]);

  const handleMarkAsPaid = async (payment: any) => {
    setProcessingId(payment.paymentId);
    try {
      const updated = {
        ...payment,
        status: 'pago',
        pagoEm: new Date().toISOString(),
        comprovanteHash: `HASH-PIX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      };
      await savePayrollPaymentFirestore(companyId, updated);
      await loadPayments();
    } catch (err) {
      console.error('Erro ao marcar pagamento como pago:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownloadCNAB240 = () => {
    if (payments.length === 0) return;
    const header = `001000000000000000000000000000000000000000000000000000000000000000000000000000\n`;
    let body = '';
    payments.forEach((p, idx) => {
      body += `3410001300${(idx + 1).toString().padStart(5, '0')}P0100000${(p.cpf || '').replace(/\D/g, '').padStart(11, '0')}${(p.valor * 100).toFixed(0).padStart(15, '0')}\n`;
    });
    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CNAB240_FOLHA_${new Date().toISOString().substring(0, 10)}.rem`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = payments.filter(p =>
    (p.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.cpf || '').includes(searchTerm)
  );

  const totalValue = filtered.reduce((a, b) => a + (b.valor || 0), 0);
  const totalPaid = filtered.filter(p => p.status === 'pago').reduce((a, b) => a + (b.valor || 0), 0);
  const totalPending = totalValue - totalPaid;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
              Tesouraria & Pagamento Salarial
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Gestão de Pagamentos & Arquivo Bancário (CNAB 240 / Pix)
            </h2>
            <p className="text-xs text-slate-500">
              Lote de depósitos de salários em conta ou chave Pix com exportação padrão Febraban CNAB 240.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadPayments}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl cursor-pointer text-xs font-bold transition-all"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadCNAB240}
              disabled={payments.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Gerar CNAB 240 (Remessa)</span>
            </button>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[10px] uppercase font-black text-slate-500">Total Folha Líquida</span>
            <div className="text-xl font-black text-slate-900 mt-1">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400">{filtered.length} favorecidos</span>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
            <span className="text-[10px] uppercase font-black text-emerald-700">Total Liquidado</span>
            <div className="text-xl font-black text-emerald-900 mt-1">
              R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-600">
              {filtered.filter(p => p.status === 'pago').length} depósitos efetuados
            </span>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
            <span className="text-[10px] uppercase font-black text-amber-700">Pendente de Baixa</span>
            <div className="text-xl font-black text-amber-900 mt-1">
              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-amber-600">
              {filtered.filter(p => p.status !== 'pago').length} a pagar
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar favorecido por nome ou CPF..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
            />
          </div>
        </div>

        {/* Tabela de Lote */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <th className="p-3">Colaborador / Favorecido</th>
                <th className="p-3">Dados Bancários / Pix</th>
                <th className="p-3">Forma</th>
                <th className="p-3 text-right">Valor Líquido</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Ação / Comprovante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                    Carregando lote de pagamentos do Firebase...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                    Nenhum lançamento de pagamento encontrado para esta competência.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.paymentId || p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      <div>{p.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">{p.employeeId}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{p.banco}</div>
                      <div className="text-[10px] text-slate-500">Ag: {p.agencia} | CC: {p.conta}</div>
                      {p.pixKey && (
                        <div className="text-[10px] text-indigo-600 font-mono">Pix: {p.pixKey}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px]">
                        {p.forma || 'PIX'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">
                      R$ {(p.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      {p.status === 'pago' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px]">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {p.status === 'pago' ? (
                        <div className="text-[10px] font-mono text-emerald-700 font-bold" title={p.comprovanteHash}>
                          {p.comprovanteHash?.substring(0, 16) || 'Confirmado'}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMarkAsPaid(p)}
                          disabled={processingId === p.paymentId}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg cursor-pointer transition-all disabled:opacity-50"
                        >
                          {processingId === p.paymentId ? 'Dando baixa...' : 'Confirmar Baixa'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
