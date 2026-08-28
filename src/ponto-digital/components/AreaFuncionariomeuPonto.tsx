import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  ShieldCheck, 
  Scale, 
  FileText, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  X, 
  Paperclip,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { RegistroPontoDoc, AjustePontoDoc } from '../types/ponto';
import { useAuth } from '../../auth';
import { formatarMinutosEmHoras } from '../services/pontoService';

interface AreaFuncionariomeuPontoProps {
  registros: RegistroPontoDoc[];
  onAbrirRegistroPonto: () => void;
  onSolicitarAjuste?: (ajuste: AjustePontoDoc) => void;
}

export const AreaFuncionariomeuPonto: React.FC<AreaFuncionariomeuPontoProps> = ({
  registros,
  onAbrirRegistroPonto,
  onSolicitarAjuste,
}) => {
  const { user } = useAuth();
  const myRegistros = registros.filter(r => r.funcionarioId === user?.id || true);

  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [dataAjuste, setDataAjuste] = useState(new Date().toISOString().split('T')[0]);
  const [entradaProp, setEntradaProp] = useState('08:00');
  const [saidaProp, setSaidaProp] = useState('18:00');
  const [motivoAjuste, setMotivoAjuste] = useState('Esquecimento de registro');
  const [observacaoAjuste, setObservacaoAjuste] = useState('');
  const [comprovanteUrl, setComprovanteUrl] = useState('');
  const [solicitacaoEnviadaMsg, setSolicitacaoEnviadaMsg] = useState<string | null>(null);

  const handleEnviarSolicitacaoAjuste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataAjuste || !motivoAjuste.trim()) return;

    const novoAjuste: AjustePontoDoc = {
      id: `aj-${Date.now()}`,
      funcionarioId: user?.id || 'func-01',
      funcionarioNome: user?.name || 'Colaborador',
      empresaId: user?.companyId || '',
      data: dataAjuste,
      horarioEntradaProp: entradaProp,
      horarioSaidaProp: saidaProp,
      motivo: motivoAjuste,
      observacao: `${observacaoAjuste}${comprovanteUrl ? ` | Anexo: ${comprovanteUrl}` : ''}`,
      status: 'Pendente'
    };

    if (onSolicitarAjuste) {
      onSolicitarAjuste(novoAjuste);
    }

    setShowAjusteModal(false);
    setObservacaoAjuste('');
    setComprovanteUrl('');
    setSolicitacaoEnviadaMsg('Solicitação de correção enviada para aprovação do seu gestor com sucesso!');
    setTimeout(() => setSolicitacaoEnviadaMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner - Meu Ponto */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Meu Ponto - Visão do Colaborador</h2>
          <p className="text-xs text-slate-500">Acompanhe seu histórico de batidas, saldo de banco de horas e solicite ajustes</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAjusteModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#2563EB]" />
            <span>Solicitar Correção</span>
          </button>

          <button
            onClick={onAbrirRegistroPonto}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Clock className="w-4 h-4" /> Bater Ponto Agora
          </button>
        </div>
      </div>

      {solicitacaoEnviadaMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{solicitacaoEnviadaMsg}</span>
        </div>
      )}

      {/* CARDS DE JORNADA CADASTRADA E SALDO BANCO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Jornada Cadastrada */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sua Jornada Cadastrada</span>
            <Calendar className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-sm font-bold text-slate-900">44 Horas Semanais (5x2)</p>
          <div className="text-xs text-slate-500 font-mono space-y-0.5">
            <p>Horário: <span className="font-bold text-slate-700">08:00 às 18:00</span></p>
            <p>Intervalo: <span className="font-bold text-slate-700">12:00 às 13:12 (1h12m)</span></p>
          </div>
        </div>

        {/* Card 2: Saldo de Banco de Horas */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo de Banco de Horas</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-400">+08h 30m</p>
          <p className="text-[11px] text-slate-400">Modelo Misto (Até 20h pro banco, excedente em folha)</p>
        </div>

        {/* Card 3: Horas Extras Acumuladas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Horas Extras no Mês</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900">+12h 45m</p>
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Aprovado para a Folha
          </span>
        </div>
      </div>

      {/* TABELA DE REGISTROS DIÁRIOS DE PONTO */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Histórico Pessoal de Registros de Ponto</h3>
          <span className="text-xs text-slate-500 font-bold">Julho / 2026</span>
        </div>

        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100/70 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-3">Data</th>
              <th className="p-3">Entrada</th>
              <th className="p-3">Início Pausa</th>
              <th className="p-3">Fim Pausa</th>
              <th className="p-3">Saída</th>
              <th className="p-3">Horas Trabalhadas</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {myRegistros.slice(0, 12).map(r => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="p-3 font-sans font-bold text-slate-800">{r.data}</td>
                <td className="p-3 font-bold text-slate-900">{r.horaEntrada || '--:--'}</td>
                <td className="p-3 text-slate-600">{r.inicioIntervalo || '--:--'}</td>
                <td className="p-3 text-slate-600">{r.retornoIntervalo || '--:--'}</td>
                <td className="p-3 font-bold text-slate-900">{r.horaSaida || '--:--'}</td>
                <td className="p-3 text-emerald-700 font-bold">08h 48m</td>
                <td className="p-3 font-sans">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {r.status || 'OK'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL SOLICITAR CORREÇÃO DE PONTO */}
      {showAjusteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2563EB]" />
                Solicitar Correção de Ponto
              </h3>
              <button 
                onClick={() => setShowAjusteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnviarSolicitacaoAjuste} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Data da Ocorrência *</label>
                <input
                  type="date"
                  required
                  value={dataAjuste}
                  onChange={(e) => setDataAjuste(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Horário Entrada Correto</label>
                  <input
                    type="time"
                    value={entradaProp}
                    onChange={(e) => setEntradaProp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Horário Saída Correto</label>
                  <input
                    type="time"
                    value={saidaProp}
                    onChange={(e) => setSaidaProp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo do Ajuste *</label>
                <select
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
                >
                  <option value="Esquecimento de registro">Esquecimento de registro no app</option>
                  <option value="Atestado / Consulta Médica">Atestado ou consulta médica</option>
                  <option value="Trabalho externo / Viagem">Trabalho externo ou reunião externa</option>
                  <option value="Problema técnico no dispositivo">Problema técnico no dispositivo</option>
                  <option value="Outros">Outros motivos</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detalhamento / Justificativa</label>
                <textarea
                  rows={2}
                  placeholder="Explique o motivo do ajuste para o gestor..."
                  value={observacaoAjuste}
                  onChange={(e) => setObservacaoAjuste(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Anexo / Comprovante (URL ou Foto)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Cole o link do atestado ou foto da folha..."
                    value={comprovanteUrl}
                    onChange={(e) => setComprovanteUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  />
                  <span className="p-2 bg-slate-100 rounded-xl text-slate-500">
                    <Paperclip className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAjusteModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-xl font-bold cursor-pointer hover:bg-blue-700 shadow-md"
                >
                  Enviar para Aprovação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
