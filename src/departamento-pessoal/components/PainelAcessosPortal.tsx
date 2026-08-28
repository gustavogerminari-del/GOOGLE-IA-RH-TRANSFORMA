import React, { useState } from 'react';
import { 
  Key, 
  ShieldCheck, 
  Search, 
  Send, 
  UserCheck, 
  Lock, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  UserX, 
  Mail, 
  Clock, 
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { ColaboradorCompleto } from '../types/dp';

interface PainelAcessosPortalProps {
  colaboradores: ColaboradorCompleto[];
  onSalvarColaborador: (colaborador: ColaboradorCompleto) => void;
}

export const PainelAcessosPortal: React.FC<PainelAcessosPortalProps> = ({
  colaboradores,
  onSalvarColaborador
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Sem acesso' | 'Convite enviado' | 'Ativo' | 'Bloqueado'>('Todos');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Selected employee for password reset or detail modal
  const [selectedColab, setSelectedColab] = useState<ColaboradorCompleto | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newTempPassword, setNewTempPassword] = useState('MaisRH@2026');

  // Filtered colaboradores
  const filteredList = colaboradores.filter(c => {
    const matchesSearch = c.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.profissionais?.emailCorporativo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.pessoais?.emailPessoal || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = c.acessoColaborador?.statusAcesso || 'Ativo';
    const matchesStatus = statusFilter === 'Todos' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleUpdateStatus = (colab: ColaboradorCompleto, newStatus: 'Sem acesso' | 'Convite enviado' | 'Ativo' | 'Bloqueado') => {
    const updated: ColaboradorCompleto = {
      ...colab,
      acessoColaborador: {
        loginUsername: colab.acessoColaborador?.loginUsername || colab.profissionais?.emailCorporativo || colab.pessoais?.emailPessoal || '',
        senhaProvisoria: colab.acessoColaborador?.senhaProvisoria || 'MaisRH@2026',
        statusAcesso: newStatus,
        senhaCriada: true,
        dataLiberacao: new Date().toISOString().split('T')[0]
      }
    };
    onSalvarColaborador(updated);
    showNotification(`Status do colaborador ${colab.nomeCompleto.split(' ')[0]} alterado para "${newStatus}"!`);
  };

  const handleSendInvite = (colab: ColaboradorCompleto) => {
    handleUpdateStatus(colab, 'Convite enviado');
    showNotification(`Convite de acesso enviado para ${colab.profissionais?.emailCorporativo || colab.pessoais?.emailPessoal}!`);
  };

  const handleResetPassword = () => {
    if (!selectedColab) return;

    const updated: ColaboradorCompleto = {
      ...selectedColab,
      acessoColaborador: {
        loginUsername: selectedColab.acessoColaborador?.loginUsername || selectedColab.profissionais?.emailCorporativo || selectedColab.pessoais?.emailPessoal || '',
        senhaProvisoria: newTempPassword,
        statusAcesso: selectedColab.acessoColaborador?.statusAcesso || 'Ativo',
        senhaCriada: true,
        dataLiberacao: new Date().toISOString().split('T')[0]
      }
    };

    onSalvarColaborador(updated);
    setShowResetModal(false);
    showNotification(`Senha redefinida com sucesso para ${selectedColab.nomeCompleto.split(' ')[0]}! Nova senha: ${newTempPassword}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
              <Key className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Controle de Acessos ao Portal do Colaborador</h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Gerencie as credenciais, libere acessos, envie convites e bloqueie usuários. Os colaboradores acessam o Portal Self-Service para bater ponto, ver holerites e pedir férias.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl flex items-start gap-2 text-xs text-amber-900 shrink-0 max-w-xs">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium leading-relaxed">
            <strong>Regra de Segurança:</strong> Somente o Administrador da Empresa ou o RH podem liberar ou resetar acessos.
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por colaborador ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {(['Todos', 'Ativo', 'Convite enviado', 'Bloqueado', 'Sem acesso'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Access Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Colaborador</th>
                <th className="p-4">Cargo / Depto</th>
                <th className="p-4">Login de Acesso</th>
                <th className="p-4">Status Portal</th>
                <th className="p-4 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                    Nenhum colaborador encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredList.map((colab) => {
                  const status = colab.acessoColaborador?.statusAcesso || 'Ativo';
                  const loginEmail = colab.acessoColaborador?.loginUsername || colab.profissionais?.emailCorporativo || colab.pessoais?.emailPessoal || 'Sem login';

                  return (
                    <tr key={colab.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {colab.fotoUrl ? (
                            <img
                              src={colab.fotoUrl}
                              alt={colab.nomeCompleto}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-slate-200">
                              {colab.nomeCompleto ? colab.nomeCompleto.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'RH'}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{colab.nomeCompleto}</p>
                            <span className="text-[10px] text-slate-500 font-mono">CPF: {colab.pessoais?.cpf || '000.000.000-00'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-800">{colab.profissionais?.cargo || 'Colaborador'}</p>
                        <span className="text-[10px] text-slate-500">{colab.profissionais?.departamento || 'Geral'}</span>
                      </td>

                      <td className="p-4 font-mono font-medium text-slate-700">
                        {loginEmail}
                      </td>

                      <td className="p-4">
                        {status === 'Ativo' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ativo (Liberado)
                          </span>
                        )}
                        {status === 'Convite enviado' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                            <Send className="w-3 h-3" /> Convite Enviado
                          </span>
                        )}
                        {status === 'Bloqueado' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                            <UserX className="w-3 h-3" /> Bloqueado
                          </span>
                        )}
                        {status === 'Sem acesso' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Sem Acesso
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Enviar convite */}
                          <button
                            onClick={() => handleSendInvite(colab)}
                            title="Enviar convite por e-mail"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span className="hidden md:inline text-[11px]">Convite</span>
                          </button>

                          {/* Resetar Senha */}
                          <button
                            onClick={() => {
                              setSelectedColab(colab);
                              setNewTempPassword('MaisRH@' + Math.floor(1000 + Math.random() * 9000));
                              setShowResetModal(true);
                            }}
                            title="Resetar senha provisória"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="hidden md:inline text-[11px]">Senha</span>
                          </button>

                          {/* Alternar Ativo/Bloqueado */}
                          {status === 'Ativo' ? (
                            <button
                              onClick={() => handleUpdateStatus(colab, 'Bloqueado')}
                              title="Bloquear acesso"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer font-bold"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(colab, 'Ativo')}
                              title="Ativar acesso"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all cursor-pointer font-bold"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Resetar Senha */}
      {showResetModal && selectedColab && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-base font-extrabold text-slate-900">Resetar Senha do Colaborador</h3>
            </div>

            <p className="text-slate-600">
              Você está gerando uma nova senha temporária para <strong>{selectedColab.nomeCompleto}</strong>.
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Senha Provisória Gerada:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 bg-slate-50"
                />
                <button
                  onClick={() => setNewTempPassword('MaisRH@' + Math.floor(1000 + Math.random() * 9000))}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 font-bold rounded-xl"
                  title="Gerar outra senha"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-blue-700"
              >
                Salvar Nova Senha
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
