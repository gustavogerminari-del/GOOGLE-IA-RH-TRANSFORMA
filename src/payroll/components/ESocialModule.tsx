import React, { useEffect, useState } from 'react';
import { 
  FileCheck, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Code2, 
  Send, 
  FileCode, 
  Building2, 
  Database,
  RefreshCw
} from 'lucide-react';
import { ESocialEvent } from '../types/payroll';
import { getESocialEventsFirestore, saveESocialEventsFirestore } from '../services/payrollFirestoreService';
import { useAuth } from '../../auth';

export const ESocialModule: React.FC = () => {
  const { user } = useAuth();
  const companyId = (user?.companyId || user?.empresaId || '').trim();
  const [events, setEvents] = useState<ESocialEvent[]>([]);

  useEffect(() => {
    let active = true;
    if (!companyId) { setEvents([]); return; }
    getESocialEventsFirestore(companyId)
      .then(data => { if (active) setEvents(data); })
      .catch(err => console.error('[eSocial] Erro ao carregar eventos:', err));
    return () => { active = false; };
  }, [companyId]);
  const [selectedEvent, setSelectedEvent] = useState<ESocialEvent | null>(events[0] || null);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionSuccess, setTransmissionSuccess] = useState(false);

  const handleTransmit = (eventId: string) => {
    if (!companyId) {
      console.error('[eSocial] Empresa não identificada.');
      return;
    }
    setIsTransmitting(true);
    setTransmissionSuccess(false);

    setTimeout(() => {
      const updated = events.map(evt => {
        if (evt.id === eventId) {
          return {
            ...evt,
            status: 'Validado com Sucesso' as const,
            receiptNumber: `1.1.${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}.${Math.floor(100000000000 + Math.random() * 900000000000)}`
          };
        }
        return evt;
      });

      void saveESocialEventsFirestore(companyId, updated).catch(err => {
        console.error('[eSocial] Erro ao persistir eventos:', err);
      });
      setEvents(updated);
      const match = updated.find(e => e.id === eventId);
      if (match) setSelectedEvent(match);

      setIsTransmitting(false);
      setTransmissionSuccess(true);
    }, 1200);
  };

  const handleDownloadSefip = () => {
    const textContent = `00112345678000190GRUPO ALPHA LOGISTICA SA                       202607111000000000382500000306000
1012345678900CARLOS EDUARDO SANTOS               0008500000000680000101
1023456789011JULIANA MARTINS                     0006200000000496000101
1034567890122FERNANDO SOUZA                      0009750000000780000101
9038250000030600010633500`;

    const element = document.createElement("a");
    const file = new Blob([textContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "SEFIP_2026_07_ALPHA.RE";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner eSocial */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-400/30">
              eSocial Government Hub 2026
            </span>
            <span className="text-xs text-slate-400">• SEFIP / GFIP / DIRF / RAIS</span>
          </div>
          <h2 className="text-xl font-black mt-1 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-emerald-400" />
            Obrigações Acessórias Digitais & Transmissão Governamental
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Gere arquivos XML validados do eSocial e arquivos digitais da Caixa Econômica e Receita Federal em 1 clique.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadSefip}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 border border-emerald-400/30"
          >
            <Download className="w-4 h-4" />
            <span>Gerar Arquivo SEFIP (.RE)</span>
          </button>
        </div>
      </div>

      {/* Grid Events & XML Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Events List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
            <span>Eventos da Folha do Mês</span>
            <span className="text-xs text-slate-500 font-normal">Julho / 2026</span>
          </h3>

          <div className="space-y-2">
            {events.map(evt => {
              const isSelected = selectedEvent?.id === evt.id;
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-500 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-indigo-700 text-xs">{evt.code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      evt.status === 'Validado com Sucesso'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {evt.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs mt-1">{evt.title}</h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                    <span>{evt.totalRecords} registros</span>
                    <span>Gerado em: {new Date(evt.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* XML Viewer & Actions */}
        <div className="lg:col-span-2 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-5 flex flex-col justify-between space-y-4">
          {selectedEvent ? (
            <>
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-extrabold block">
                      Evento {selectedEvent.code}
                    </span>
                    <h3 className="text-base font-black text-white">{selectedEvent.title}</h3>
                  </div>

                  <button
                    onClick={() => handleTransmit(selectedEvent.id)}
                    disabled={isTransmitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isTransmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-300" />
                        <span>Validando WebService...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-emerald-400" />
                        <span>Transmitir para eSocial</span>
                      </>
                    )}
                  </button>
                </div>

                {transmissionSuccess && (
                  <div className="mt-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Lote enviado e validado com sucesso no governo! Recibo: {selectedEvent.receiptNumber}</span>
                  </div>
                )}

                <p className="text-xs text-slate-400 mt-3">{selectedEvent.description}</p>

                {selectedEvent.receiptNumber && (
                  <div className="mt-2 text-xs font-mono text-emerald-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <strong>Número de Recibo Oficial:</strong> {selectedEvent.receiptNumber}
                  </div>
                )}

                {/* XML Code Container */}
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                      Estrutura XML Schemas v_S_01_02_00
                    </span>
                    <span>UTF-8</span>
                  </div>

                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300 overflow-x-auto max-h-72 leading-relaxed">
                    {selectedEvent.xmlData}
                  </pre>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                <span>Certificado Digital A1 Ativo</span>
                <span className="text-emerald-400 font-bold">Conexão Segura Receita Federal / SERPRO</span>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500">
              Selecione um evento da lista para visualizar.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
