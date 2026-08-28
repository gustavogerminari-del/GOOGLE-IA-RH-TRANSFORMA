import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Globe, 
  Share2, 
  QrCode, 
  MessageCircle, 
  Mail, 
  Code,
  ExternalLink
} from 'lucide-react';
import { UnifiedJob } from '../../types/recruitment';

interface JobShareModalProps {
  job: UnifiedJob;
  onClose: () => void;
}

export const JobShareModal: React.FC<JobShareModalProps> = ({ job, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const shareUrl = `${window.location.origin}/vagas/portal?jobId=${job.id}`;
  const embedCode = `<iframe src="${shareUrl}&embed=true" width="100%" height="600" frameborder="0"></iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const whatsappShareText = encodeURIComponent(
    `🚀 *Vaga Aberta: ${job.titulo || job.title}*\n` +
    `📍 Localização: ${job.location || job.cidade || 'Presencial'}\n` +
    `💼 Contrato: ${job.tipoContrato || job.type || 'CLT'}\n` +
    `💰 Salário: ${job.salario || job.salaryRange || 'A combinar'}\n\n` +
    `Inscreva-se agora mesmo no link:\n${shareUrl}`
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              Divulgação de Vaga
            </span>
            <h3 className="text-lg font-black text-slate-900">
              Compartilhar Vaga: {job.titulo || job.title}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Código: <strong className="font-mono text-indigo-600">{job.codigoVaga || job.id}</strong>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Link Input */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-700 block">Link Público da Vaga:</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 shrink-0 transition ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Fast Action Social Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`https://wa.me/?text=${whatsappShareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900 font-black text-xs flex items-center justify-center gap-2 transition"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Enviar via WhatsApp</span>
          </a>

          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-900 font-black text-xs flex items-center justify-center gap-2 transition"
          >
            <ExternalLink className="w-4 h-4 text-slate-600" />
            <span>Abrir Portal Público</span>
          </a>
        </div>

        {/* Embed Widget Section */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-indigo-600" />
              Código de Incorporação (iFrame para Site Institucional)
            </span>
            <button
              onClick={handleCopyEmbed}
              className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              {copiedEmbed ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedEmbed ? 'Copiado' : 'Copiar iFrame'}</span>
            </button>
          </div>
          <textarea
            readOnly
            rows={2}
            value={embedCode}
            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-600 outline-none resize-none"
          ></textarea>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
