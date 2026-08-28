import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Download, 
  Lock, 
  Clock, 
  Globe, 
  User, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Key,
  Info
} from 'lucide-react';
import { AuditLogEntry, AuditSeverity } from './types';
import { AuditService } from '../services/AuditService';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('Todas');
  const [selectedModule, setSelectedModule] = useState<string>('Todos');
  const [selectedLogDetail, setSelectedLogDetail] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    let isMounted = true;
    AuditService.list().then(data => {
      if (isMounted) {
        setLogs(data || []);
      }
      setLoading(false);
    }).catch(err => {
      console.warn('Erro ao carregar audit logs:', err);
      setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.ipAddress.includes(searchTerm);
    const matchesSev = selectedSeverity === 'Todas' || log.severity === selectedSeverity;
    const matchesMod = selectedModule === 'Todos' || log.moduleName === selectedModule;
    return matchesSearch && matchesSev && matchesMod;
  });

  const handleExportLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID,Data/Hora,Usuario,Email,Papel,IP,Modulo,Acao,Gravidade,Descricao\n" +
      filteredLogs.map(e => `${e.id},"${e.timestamp}","${e.userName}","${e.userEmail}","${e.userRole}","${e.ipAddress}","${e.moduleName}","${e.actionType}","${e.severity}","${e.description}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `auditoria_maisrh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Security Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            Acesso Restrito: Nível N0 (Master & Administrador)
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Trilha de Auditoria & Segurança de Operações</h2>
          <p className="text-xs text-slate-300">
            Registro imutável de logs contendo IP, identificação do usuário, data/hora e detalhes de todas as alterações no sistema.
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          Exportar Relatório Auditado
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por usuário, e-mail, IP ou ação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs">
            <span className="font-semibold text-slate-500">Gravidade:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="Todas">Todas</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="SECURITY">SECURITY</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="font-semibold text-slate-500">Módulo:</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="Todos">Todos os Módulos</option>
              <option value="Vagas">Vagas</option>
              <option value="Banco de Talentos">Banco de Talentos</option>
              <option value="Equipe Interna">Equipe Interna</option>
              <option value="Consultoria RH">Consultoria RH</option>
              <option value="Planos SaaS">Planos SaaS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3.5 px-4">Data / Hora</th>
                <th className="py-3.5 px-4">Usuário / Responsável</th>
                <th className="py-3.5 px-4">IP & Localização</th>
                <th className="py-3.5 px-4">Módulo</th>
                <th className="py-3.5 px-4">Ação</th>
                <th className="py-3.5 px-4">Descrição da Operação</th>
                <th className="py-3.5 px-4 text-center">Nível</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.map((log) => (
                <tr 
                  key={log.id}
                  onClick={() => setSelectedLogDetail(log)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                    {log.timestamp}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{log.userName}</div>
                    <div className="text-[10px] text-slate-500">{log.userRole}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono text-slate-800 font-semibold block">{log.ipAddress}</span>
                    <span className="text-[10px] text-slate-400">{log.locationState}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {log.moduleName}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-extrabold text-slate-800">
                    {log.actionType}
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                    {log.description}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      log.severity === 'SECURITY'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : log.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : log.severity === 'WARNING'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedLogDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Detalhes do Evento de Auditoria</h3>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Fechar ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px]">ID do Log</span>
                  <span className="font-mono font-bold text-slate-900">{selectedLogDetail.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Timestamp</span>
                  <span className="font-mono font-bold text-slate-900">{selectedLogDetail.timestamp}</span>
                </div>
              </div>

              <div>
                <strong className="block text-slate-900">Usuário do Operador:</strong>
                <p>{selectedLogDetail.userName} ({selectedLogDetail.userEmail}) - <em>{selectedLogDetail.userRole}</em></p>
              </div>

              <div>
                <strong className="block text-slate-900">Endereço IP & Origem:</strong>
                <p className="font-mono">{selectedLogDetail.ipAddress} ({selectedLogDetail.locationState})</p>
              </div>

              <div>
                <strong className="block text-slate-900">Módulo e Tipo de Operação:</strong>
                <p>{selectedLogDetail.moduleName} → <strong>{selectedLogDetail.actionType}</strong></p>
              </div>

              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                <strong className="block text-slate-900 mb-1">Payload / Descrição da Ação:</strong>
                <p className="leading-relaxed">{selectedLogDetail.description}</p>
                {selectedLogDetail.targetEntity && (
                  <p className="mt-2 text-[11px] text-indigo-700 font-semibold">
                    Alvo Afetado: {selectedLogDetail.targetEntity}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
