import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  History, 
  Calendar, 
  FileEdit, 
  Camera, 
  Send, 
  Laptop, 
  Lock, 
  UserCheck, 
  ChevronRight,
  User
} from 'lucide-react';
import { useAuth } from '../../auth';
import { ColaboradorCompleto } from '../types/dp';

interface PortalColaboradorPontoProps {
  colaboradores: ColaboradorCompleto[];
}

interface MarcaçãoPonto {
  id: string;
  tipo: 'Entrada' | 'Intervalo Saída' | 'Intervalo Retorno' | 'Saída';
  dataHora: string;
  ip: string;
  dispositivo: string;
  localizacao: string;
  comFoto: boolean;
  statusAprovacao: 'Confirmado' | 'Ajuste Pendente' | 'Aprovado RH';
}

export const PortalColaboradorPonto: React.FC<PortalColaboradorPontoProps> = ({ colaboradores }) => {
  const { user } = useAuth();

  // Selected employee (default to first or active user)
  const [selectedColabId, setSelectedColabId] = useState<string>(colaboradores[0]?.id || '');
  const currentColab = colaboradores.find(c => c.id === selectedColabId) || colaboradores[0];

  // Current real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Timecard punches state
  const [historicoPonto, setHistoricoPonto] = useState<MarcaçãoPonto[]>([
    {
      id: 'p-101',
      tipo: 'Entrada',
      dataHora: `${new Date().toISOString().split('T')[0]} 08:02:15`,
      ip: '189.122.45.10 (São Paulo, BR)',
      dispositivo: 'Navegador Web Chrome (macOS)',
      localizacao: 'Av. Paulista, 1000 - Bela Vista, SP',
      comFoto: true,
      statusAprovacao: 'Confirmado'
    },
    {
      id: 'p-102',
      tipo: 'Intervalo Saída',
      dataHora: `${new Date().toISOString().split('T')[0]} 12:01:40`,
      ip: '189.122.45.10 (São Paulo, BR)',
      dispositivo: 'Navegador Web Chrome (macOS)',
      localizacao: 'Av. Paulista, 1000 - Bela Vista, SP',
      comFoto: true,
      statusAprovacao: 'Confirmado'
    }
  ]);

  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [ajusteData, setAjusteData] = useState({ data: '', hora: '', tipo: 'Entrada', motivo: '' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleBaterPonto = (tipo: 'Entrada' | 'Intervalo Saída' | 'Intervalo Retorno' | 'Saída') => {
    const now = new Date();
    const formatted = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('pt-BR')}`;
    
    const novaMarcacao: MarcaçãoPonto = {
      id: `p-${Date.now()}`,
      tipo,
      dataHora: formatted,
      ip: '177.138.12.90 (Conexão Segura SSL)',
      dispositivo: 'Portal do Colaborador Web',
      localizacao: 'São Paulo, SP (GPS Válido ±15m)',
      comFoto: true,
      statusAprovacao: 'Confirmado'
    };

    setHistoricoPonto(prev => [novaMarcacao, ...prev]);
    setToastMessage(`Ponto de ${tipo} registrado com sucesso às ${now.toLocaleTimeString('pt-BR')}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSolicitarAjuste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ajusteData.data || !ajusteData.hora || !ajusteData.motivo) return;

    const novaMarcacao: MarcaçãoPonto = {
      id: `p-ajuste-${Date.now()}`,
      tipo: ajusteData.tipo as any,
      dataHora: `${ajusteData.data} ${ajusteData.hora}:00`,
      ip: 'Ajuste Solicitado',
      dispositivo: 'Solicitação via Portal',
      localizacao: `Justificativa: ${ajusteData.motivo}`,
      comFoto: false,
      statusAprovacao: 'Ajuste Pendente'
    };

    setHistoricoPonto(prev => [novaMarcacao, ...prev]);
    setShowAjusteModal(false);
    setToastMessage('Solicitação de ajuste de ponto enviada para aprovação do RH!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in font-bold text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Profile Switcher & Portal Info */}
      <div className="bg-[#1E293B] text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-400/30">
              Portal do Colaborador • Meu Ponto Digital
            </span>
          </div>
          <h2 className="text-xl font-black">{currentColab?.nomeCompleto}</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {currentColab?.profissionais.cargo} • {currentColab?.profissionais.departamento} • {currentColab?.profissionais.escalaTrabalho}
          </p>
        </div>

        {/* Demo Switch Colaborador */}
        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 flex items-center gap-3 text-xs">
          <User className="w-4 h-4 text-blue-400" />
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Simular Acesso do Colaborador:</span>
            <select
              value={selectedColabId}
              onChange={(e) => setSelectedColabId(e.target.value)}
              className="bg-slate-900 text-white font-bold text-xs rounded-lg px-2 py-1 border border-slate-700 outline-none cursor-pointer"
            >
              {colaboradores.map(c => (
                <option key={c.id} value={c.id}>{c.nomeCompleto} ({c.profissionais.cargo})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Clock-in Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Clock Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col items-center justify-center text-center space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[#1E293B] py-2">
              {currentTime.toLocaleTimeString('pt-BR')}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Conexão Criptografada e Geolocalizada</span>
            </div>
          </div>

          <div className="w-full pt-2 grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleBaterPonto('Entrada')}
              className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <div className="w-3 h-3 rounded-full bg-emerald-300 animate-ping" />
              <span>🟢 Entrada</span>
            </button>

            <button
              onClick={() => handleBaterPonto('Intervalo Saída')}
              className="py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <span>🟡 Saída Almoço</span>
            </button>

            <button
              onClick={() => handleBaterPonto('Intervalo Retorno')}
              className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <span>🔵 Volta Almoço</span>
            </button>

            <button
              onClick={() => handleBaterPonto('Saída')}
              className="py-3 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <span>🔴 Saída Fim</span>
            </button>
          </div>

          <button
            onClick={() => setShowAjusteModal(true)}
            className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <FileEdit className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Solicitar Ajuste ou Esqueceu de Bater?</span>
          </button>
        </div>

        {/* Today's Punch History */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#2563EB]" />
              <h3 className="font-bold text-[#1E293B] text-sm">Histórico de Marcações do Dia</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Portaria e eSocial REP-P</span>
          </div>

          <div className="space-y-3">
            {historicoPonto.map(m => (
              <div 
                key={m.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl text-white font-bold ${
                    m.tipo === 'Entrada' ? 'bg-emerald-600' :
                    m.tipo === 'Intervalo Saída' ? 'bg-amber-500' :
                    m.tipo === 'Intervalo Retorno' ? 'bg-blue-600' : 'bg-rose-600'
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1E293B] text-sm">{m.tipo}</span>
                      <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {m.dataHora.split(' ')[1]}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {m.localizacao}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    m.statusAprovacao === 'Confirmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {m.statusAprovacao}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Adjustment Request Modal */}
      {showAjusteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#1E293B] text-sm">Solicitar Ajuste de Ponto ao RH</h3>
              <button onClick={() => setShowAjusteModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSolicitarAjuste} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Data da Ocorrência</label>
                <input
                  type="date"
                  required
                  value={ajusteData.data}
                  onChange={(e) => setAjusteData({ ...ajusteData, data: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Horário Correto</label>
                <input
                  type="time"
                  required
                  value={ajusteData.hora}
                  onChange={(e) => setAjusteData({ ...ajusteData, hora: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Marcação</label>
                <select
                  value={ajusteData.tipo}
                  onChange={(e) => setAjusteData({ ...ajusteData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  <option value="Entrada">Entrada</option>
                  <option value="Intervalo Saída">Intervalo Saída</option>
                  <option value="Intervalo Retorno">Intervalo Retorno</option>
                  <option value="Saída">Saída</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo / Justificativa *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva o motivo (ex: falha de conexão, consulta médica com atestado, etc.)"
                  value={ajusteData.motivo}
                  onChange={(e) => setAjusteData({ ...ajusteData, motivo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAjusteModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#2563EB] text-white font-bold rounded-xl cursor-pointer"
                >
                  Enviar para o RH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
