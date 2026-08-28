import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  FileCheck, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Eye, 
  X,
  FileSignature
} from 'lucide-react';
import { ProcessoRescisaoCompleto } from '../../types/terminationTypes';

interface DocumentosAssinaturaTabProps {
  process: ProcessoRescisaoCompleto;
}

export const DocumentosAssinaturaTab: React.FC<DocumentosAssinaturaTabProps> = ({ process }) => {
  const [selectedDocType, setSelectedDocType] = useState<'TRCT' | 'AVISO' | 'QUITACAO' | 'ASO'>('TRCT');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Variable replacement helper
  const renderDocumentText = (type: 'TRCT' | 'AVISO' | 'QUITACAO') => {
    const nome = process.employeeName;
    const cpf = process.employeeCpf || '000.000.000-00';
    const cargo = process.employeeRole || 'Cargo N/A';
    const adm = process.admissionDate;
    const deslig = process.plannedTerminationDate;
    const tipo = process.terminationType;
    const liquido = process.totalNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (type === 'AVISO') {
      return `NOTIFICAÇÃO DE AVISO-PRÉVIO

Ao Sr(a): ${nome}
CPF: ${cpf}
Cargo: ${cargo}

Comunicamos que a partir desta data, não mais utilizaremos os seus serviços em nossa empresa, rescindindo o seu contrato de trabalho sob a modalidade: "${tipo}".

Solicitamos o comparecimento ao Departamento Pessoal para a entrega da Carteira de Trabalho e realização do Exame Médico Demissional.

Data de Emissão: ${process.requestDate}
Data Efetiva de Desligamento: ${deslig}

___________________________________________
Assinatura do Empregador / Responsável RH

___________________________________________
Assinatura do Empregado (${nome})`;
    }

    if (type === 'QUITACAO') {
      return `TERMO DE QUITAÇÃO DE RESCISÃO CONTRATUAL

Empregado: ${nome}
CPF: ${cpf}
Cargo: ${cargo}
Data de Admissão: ${adm} | Data de Demissão: ${deslig}

Declaramos para os devidos fins de direito que recebi da empresa o valor líquido rescisório de ${liquido}, dando plena, geral e irrevogável quitação de todas as verbas rescisórias decorrentes do contrato de trabalho encerrado nesta data.

Local e Data: ${deslig}

___________________________________________
Assinatura do Empregado: ${nome}`;
    }

    // Default TRCT
    return `TERMO DE RESCISÃO DO CONTRATO DE TRABALHO (TRCT)
IDENTIFICAÇÃO DA EMPRESA E COLABORADOR
Empresa ID: ${process.companyId}
Colaborador: ${nome} | CPF: ${cpf}
Cargo: ${cargo} | Depto: ${process.employeeDepartment || 'Geral'}
Admissão: ${adm} | Desligamento: ${deslig}
Causa do Afastamento: ${tipo}

RESUMO DAS VERBAS RESCISÓRIAS:
(+) Total de Proventos: ${process.totalGross.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
(-) Total de Descontos: ${process.totalDiscounts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
(=) VALOR LÍQUIDO A PAGAR: ${liquido}

MULTA RESCISÓRIA FGTS: ${process.fgtsFineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${process.fgtsFinePercentage}%)

Homologação em conformidade com o Artigo 477 da CLT e eSocial S-2299.`;
  };

  const handleSendToSignature = () => {
    alert(`Documento ${selectedDocType} de ${process.employeeName} enviado para o Hub de Assinaturas Digitais!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-sm text-slate-900">Documentos e Minutas Rescisórias</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Geração automática com substituição de variáveis e envio para assinatura digital</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir TRCT</span>
          </button>

          <button
            onClick={handleSendToSignature}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Enviar para Assinatura Digital</span>
          </button>
        </div>
      </div>

      {/* Document Selector & Preview Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2">
          <h4 className="font-bold text-xs text-slate-700 border-b border-slate-100 pb-2">Documentos Disponíveis</h4>

          <button
            onClick={() => setSelectedDocType('TRCT')}
            className={`w-full p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
              selectedDocType === 'TRCT' ? 'bg-rose-50 border-rose-300 font-bold text-rose-950' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <span className="block">TRCT (Termo de Rescisão)</span>
            <span className="text-[10px] text-slate-500 font-normal">Demonstrativo oficial de verbas e eSocial S-2299</span>
          </button>

          <button
            onClick={() => setSelectedDocType('AVISO')}
            className={`w-full p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
              selectedDocType === 'AVISO' ? 'bg-rose-50 border-rose-300 font-bold text-rose-950' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <span className="block">Notificação de Aviso-Prévio</span>
            <span className="text-[10px] text-slate-500 font-normal">Comunicação formal de início do aviso</span>
          </button>

          <button
            onClick={() => setSelectedDocType('QUITACAO')}
            className={`w-full p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
              selectedDocType === 'QUITACAO' ? 'bg-rose-50 border-rose-300 font-bold text-rose-950' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <span className="block">Termo de Quitação Rescisória</span>
            <span className="text-[10px] text-slate-500 font-normal">Declaração de recebimento de verbas</span>
          </button>
        </div>

        {/* Text Preview Paper */}
        <div className="md:col-span-2 bg-slate-900 rounded-2xl p-6 shadow-xl text-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-amber-400 font-mono">Minuta Gerada: {selectedDocType}</span>
            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-200 cursor-pointer flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Expandir Visualização</span>
            </button>
          </div>

          <pre className="whitespace-pre-wrap font-mono text-xs text-slate-300 bg-slate-950/80 p-4 rounded-xl border border-slate-800 max-h-96 overflow-y-auto leading-relaxed">
            {renderDocumentText(selectedDocType)}
          </pre>
        </div>
      </div>

      {/* Expanded Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Visualização de Documento Rescisório ({selectedDocType})</h3>
              <button onClick={() => setShowPreviewModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-[60vh] overflow-y-auto leading-relaxed">
              {renderDocumentText(selectedDocType)}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Fechar
              </button>
              <button
                onClick={() => { setShowPreviewModal(false); window.print(); }}
                className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Imprimir Documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
