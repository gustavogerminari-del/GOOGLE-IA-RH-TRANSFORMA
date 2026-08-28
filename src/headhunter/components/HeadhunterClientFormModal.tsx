import React, { useEffect, useState } from 'react';
import { Building2, X } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { HeadhunterClient } from '../types';

interface HeadhunterClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: HeadhunterClient) => Promise<HeadhunterClient> | HeadhunterClient | Promise<void> | void;
}

export const HeadhunterClientFormModal: React.FC<HeadhunterClientFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { user } = useAuth();
  const companyId = user?.companyId || user?.empresaId || user?.tenantId || '';
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [segmento, setSegmento] = useState('');
  const [porte, setPorte] = useState('');
  const [qtdFuncionarios, setQtdFuncionarios] = useState(0);
  const [responsavel, setResponsavel] = useState('');
  const [cargoResponsavel, setCargoResponsavel] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [site, setSite] = useState('');
  const [endereco, setEndereco] = useState('');
  const [valorPadraoVaga, setValorPadraoVaga] = useState(0);
  const [comissaoPercent, setComissaoPercent] = useState(0);
  const [formaCobranca, setFormaCobranca] = useState('');
  const [prazoPagamentoDias, setPrazoPagamentoDias] = useState(30);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSaving(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyId) {
      setError('Não foi possível identificar a empresa do usuário.');
      return;
    }
    if (!razaoSocial.trim() || !nomeFantasia.trim() || !cnpj.trim()) {
      setError('Preencha Razão Social, Nome Fantasia e CNPJ.');
      return;
    }

    setSaving(true);
    setError('');
    const now = new Date().toISOString();
    const client: HeadhunterClient = {
      id: `cli-${Date.now()}`,
      companyId,
      empresaId: companyId,
      criadoPor: user?.name || 'Headhunter',
      criadoEm: now,
      atualizadoEm: now,
      status: 'Ativo',
      razaoSocial: razaoSocial.trim(),
      nomeFantasia: nomeFantasia.trim(),
      cnpj: cnpj.trim(),
      segmento: segmento.trim(),
      porte,
      qtdFuncionarios: Number(qtdFuncionarios) || 0,
      responsavel: responsavel.trim(),
      cargoResponsavel: cargoResponsavel.trim(),
      telefone: telefone.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim().toLowerCase(),
      site: site.trim(),
      endereco: endereco.trim(),
      valorPadraoVaga: Number(valorPadraoVaga) || 0,
      comissaoNegociadaPercent: Number(comissaoPercent) || 0,
      formaCobranca,
      prazoPagamentoDias: Number(prazoPagamentoDias) || 30,
      contratoAtivo: true,
      historico: [{ data: now, descricao: 'Cliente cadastrado no sistema.', autor: user?.name || 'Headhunter' }],
      reunioesCount: 0,
      pendenciasCount: 0,
      vagasCount: 0,
    };

    try {
      await onSave(client);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível cadastrar o cliente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 p-6 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-900">Cadastrar Novo Cliente Corporativo</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar cadastro de cliente" className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Razão Social *" value={razaoSocial} onChange={setRazaoSocial} required />
            <Field label="Nome Fantasia *" value={nomeFantasia} onChange={setNomeFantasia} required />
            <Field label="CNPJ *" value={cnpj} onChange={setCnpj} placeholder="00.000.000/0001-00" required />
            <Field label="Segmento" value={segmento} onChange={setSegmento} />
            <Field label="Porte" value={porte} onChange={setPorte} />
            <Field label="Quantidade de Funcionários" value={String(qtdFuncionarios)} onChange={value => setQtdFuncionarios(Number(value))} type="number" />
            <Field label="Responsável" value={responsavel} onChange={setResponsavel} />
            <Field label="Cargo do Responsável" value={cargoResponsavel} onChange={setCargoResponsavel} />
            <Field label="Telefone" value={telefone} onChange={setTelefone} />
            <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} />
            <Field label="E-mail Corporativo" value={email} onChange={setEmail} type="email" />
            <Field label="Site" value={site} onChange={setSite} />
            <Field label="Valor Padrão por Vaga (R$)" value={String(valorPadraoVaga)} onChange={value => setValorPadraoVaga(Number(value))} type="number" />
            <Field label="Comissão Negociada (%)" value={String(comissaoPercent)} onChange={value => setComissaoPercent(Number(value))} type="number" />
            <Field label="Forma de Cobrança" value={formaCobranca} onChange={setFormaCobranca} />
            <Field label="Prazo de Pagamento (dias)" value={String(prazoPagamentoDias)} onChange={value => setPrazoPagamentoDias(Number(value))} type="number" />
          </div>
          <Field label="Endereço Completo" value={endereco} onChange={setEndereco} />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 disabled:bg-indigo-300 text-white font-bold rounded-xl cursor-pointer">
              {saving ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}> = ({ label, value, onChange, type = 'text', placeholder, required }) => (
  <label className="block">
    <span className="block font-bold text-slate-700 mb-1">{label}</span>
    <input
      type={type}
      required={required}
      value={value}
      placeholder={placeholder}
      onChange={event => onChange(event.target.value)}
      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
    />
  </label>
);
