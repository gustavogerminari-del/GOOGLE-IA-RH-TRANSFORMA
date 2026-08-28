import React, { useState, useEffect } from 'react';
import { Building2, Save, CheckCircle, ShieldCheck, DollarSign, CreditCard, Landmark } from 'lucide-react';
import { PayrollCompanySettings } from '../types/payroll';
import { getPayrollCompanySettingsFirestore, savePayrollCompanySettingsFirestore } from '../services/payrollFirestoreService';

interface CompanyPayrollSettingsTabProps {
  companyId: string;
}

export const CompanyPayrollSettingsTab: React.FC<CompanyPayrollSettingsTabProps> = ({ companyId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const [settings, setSettings] = useState<PayrollCompanySettings>({
    payrollSettingsId: `set-${companyId}`,
    companyId,
    empresaId: companyId,
    razaoSocial: 'RH TRANSFORMA Tecnologia S.A.',
    cnpj: '12.345.678/0001-90',
    regimeTributario: 'Simples Nacional',
    naturezaJuridica: '206-2 Sociedade Empresária Limitada',
    cnae: '6201-5/00 - Desenvolvimento de Software',
    fpas: '515',
    terceiros: '0064',
    ratPercent: 2.0,
    fapPercent: 1.0,
    sindicatoDefault: 'SINDPD - Sindicato dos Trabalhadores em Processamento de Dados',
    convenacaoColetiva: 'CCT 2026/2027 Vigente',
    dataPagamentoDia: 5,
    formaPagamentoPadrao: 'PIX',
    contaBancaria: {
      banco: '341 - Itaú Unibanco',
      agencia: '0123',
      conta: '98765-4'
    },
    responsavelNome: 'Carlos Eduardo Silva',
    responsavelEmail: 'dp@rlconnect.com.br'
  });

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const data = await getPayrollCompanySettingsFirestore(companyId);
        if (data) setSettings(data);
      } catch (err) {
        console.error('Erro ao carregar configuracoes da folha:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);
    try {
      await savePayrollCompanySettingsFirestore(companyId, settings);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err) {
      console.error('Erro ao salvar configuracoes:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
        Carregando configurações da empresa...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
              Configurações Fiscais & Trabalhistas da Empresa
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Parâmetros da Empresa para Folha de Pagamento
            </h2>
            <p className="text-xs text-slate-500">
              CNPJ, regime tributário, alíquotas RAT/FAP, convenção coletiva e dados de pagamento bancário.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Salvar Configurações'}</span>
          </button>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-extrabold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Configurações da Folha de Pagamento salvas com sucesso no Firebase!</span>
          </div>
        )}

        {/* Informações Cadastrais e Fiscais */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Identificação da Empresa & Enquadramento Fiscal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Razão Social *</label>
              <input
                type="text"
                required
                value={settings.razaoSocial}
                onChange={e => setSettings({ ...settings, razaoSocial: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">CNPJ *</label>
              <input
                type="text"
                required
                value={settings.cnpj}
                onChange={e => setSettings({ ...settings, cnpj: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Regime Tributário *</label>
              <select
                value={settings.regimeTributario}
                onChange={e => setSettings({ ...settings, regimeTributario: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white"
              >
                <option value="Simples Nacional">Simples Nacional</option>
                <option value="Lucro Presumido">Lucro Presumido</option>
                <option value="Lucro Real">Lucro Real</option>
                <option value="MEI">MEI / Microempreendedor</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">CNAE Principal</label>
              <input
                type="text"
                value={settings.cnae || ''}
                onChange={e => setSettings({ ...settings, cnae: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">FPAS / Código de Terceiros</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="FPAS"
                  value={settings.fpas || ''}
                  onChange={e => setSettings({ ...settings, fpas: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
                <input
                  type="text"
                  placeholder="Terceiros"
                  value={settings.terceiros || ''}
                  onChange={e => setSettings({ ...settings, terceiros: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alíquotas RAT (%) & FAP (%)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="RAT"
                  value={settings.ratPercent}
                  onChange={e => setSettings({ ...settings, ratPercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="FAP"
                  value={settings.fapPercent}
                  onChange={e => setSettings({ ...settings, fapPercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Convenção Coletiva e Sindicato */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <Landmark className="w-4 h-4 text-indigo-600" />
            Sindicato & Convenção Coletiva de Trabalho (CCT)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sindicato Representante Predominante</label>
              <input
                type="text"
                value={settings.sindicatoDefault || ''}
                onChange={e => setSettings({ ...settings, sindicatoDefault: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Convenção Coletiva em Vigência</label>
              <input
                type="text"
                value={settings.convenacaoColetiva || ''}
                onChange={e => setSettings({ ...settings, convenacaoColetiva: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Dados de Pagamento */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            Datas e Conta Pagadora para Depósitos Bancários
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Dia Limite Pagamento (Mês)</label>
              <input
                type="number"
                min={1}
                max={31}
                value={settings.dataPagamentoDia}
                onChange={e => setSettings({ ...settings, dataPagamentoDia: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Até o 5º dia útil legal</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Forma de Pagamento Padrão</label>
              <select
                value={settings.formaPagamentoPadrao}
                onChange={e => setSettings({ ...settings, formaPagamentoPadrao: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
              >
                <option value="PIX">PIX Lote</option>
                <option value="TED">TED Bancário</option>
                <option value="Depósito">Depósito em Conta Salário</option>
                <option value="Cheque">Cheque Nominal</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Banco e Agência Pagadora</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Banco"
                  value={settings.contaBancaria.banco}
                  onChange={e => setSettings({
                    ...settings,
                    contaBancaria: { ...settings.contaBancaria, banco: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
                <input
                  type="text"
                  placeholder="Agência"
                  value={settings.contaBancaria.agencia}
                  onChange={e => setSettings({
                    ...settings,
                    contaBancaria: { ...settings.contaBancaria, agencia: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Conta Corrente Pagadora</label>
              <input
                type="text"
                placeholder="Conta"
                value={settings.contaBancaria.conta}
                onChange={e => setSettings({
                  ...settings,
                  contaBancaria: { ...settings.contaBancaria, conta: e.target.value }
                })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Responsável do RH/DP */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            Responsável do Departamento Pessoal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome do Gestor de DP / RH *</label>
              <input
                type="text"
                required
                value={settings.responsavelNome}
                onChange={e => setSettings({ ...settings, responsavelNome: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">E-mail do Responsável *</label>
              <input
                type="email"
                required
                value={settings.responsavelEmail}
                onChange={e => setSettings({ ...settings, responsavelEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
              />
            </div>
          </div>
        </div>

      </div>
    </form>
  );
};
