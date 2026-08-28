import React, { useEffect, useState } from 'react';
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Loader2,
  Search
} from 'lucide-react';
import { CompanyLeadPayload } from './types';
import { signInWithEmailAndPassword } from '../firebase/auth';
import { auth } from '../lib/firebase';

// RH_TRIAL_AUTO_PROVISION_V1 — provisionamento automático do trial de 14 dias.

// RH_COMPANY_ACCESS_AUTOFILL_V3 — CPF/CNPJ, consulta pública de CNPJ e endereço automático por CEP.
interface CompanyRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPlan?: string;
  onSuccessSubmit?: (payload: CompanyLeadPayload) => void;
}

const digits = (value: string) => String(value || '').replace(/\D/g, '');

const formatCpfCnpj = (value: string) => {
  const d = digits(value).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const formatCep = (value: string) => digits(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');

const validCpf = (value: string) => {
  const d = digits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (base: number) => {
    let sum = 0;
    for (let i = 0; i < base - 1; i++) sum += Number(d[i]) * (base - i);
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };
  return calc(10) === Number(d[9]) && calc(11) === Number(d[10]);
};

const validCnpj = (value: string) => {
  const d = digits(value);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calculate = (base: string) => {
    let weight = base.length - 7;
    let sum = 0;
    for (const char of base) {
      sum += Number(char) * weight--;
      if (weight < 2) weight = 9;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = calculate(d.slice(0, 12));
  const second = calculate(d.slice(0, 12) + first);
  return first === Number(d[12]) && second === Number(d[13]);
};

const documentValid = (value: string) => {
  const d = digits(value);
  return d.length === 11 ? validCpf(d) : d.length === 14 ? validCnpj(d) : false;
};

// RH_TRIAL_PACKAGES_V1 — trial comercial com dois pacotes e sem Banco/Match Talentos.
const TRIAL_PACKAGE_RECRUITMENT_HEADHUNTER = 'Recrutamento + Headhunter';
const TRIAL_PACKAGE_RECRUITMENT_DP = 'Recrutamento + DP';
const normalizeTrialPackage = (value?: string) =>
  value === TRIAL_PACKAGE_RECRUITMENT_DP ? TRIAL_PACKAGE_RECRUITMENT_DP : TRIAL_PACKAGE_RECRUITMENT_HEADHUNTER;
const trialPackageCodeFor = (value: string) =>
  value === TRIAL_PACKAGE_RECRUITMENT_DP ? 'RECRUTAMENTO_DP' : 'RECRUTAMENTO_HEADHUNTER';

export const CompanyRegistrationModal: React.FC<CompanyRegistrationModalProps> = ({
  isOpen,
  onClose,
  preselectedPlan = 'Recrutamento + Headhunter',
  onSuccessSubmit
}) => {
  const [companyName, setCompanyName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companySize, setCompanySize] = useState('1-10 colaboradores');
  const [selectedPlan, setSelectedPlan] = useState(normalizeTrialPackage(preselectedPlan));
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [protocol, setProtocol] = useState('');
  const [lookupCnpjLoading, setLookupCnpjLoading] = useState(false);
  const [lookupCepLoading, setLookupCepLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');

  const documentDigits = digits(cpfCnpj);
  const documentType = documentDigits.length === 11 ? 'CPF' : documentDigits.length === 14 ? 'CNPJ' : '';

  const reset = () => {
    setCompanyName(''); setCpfCnpj(''); setContactName(''); setEmail(''); setPhone('');
    setCompanySize('1-10 colaboradores'); setCep(''); setStreet(''); setNumber('');
    setComplement(''); setNeighborhood(''); setCity(''); setUf(''); setMessage('');
    setPassword(''); setConfirmPassword(''); setAcceptTerms(false);
    setSubmitError(''); setProtocol(''); setLookupMessage('');
  };

  const fillAddressFromCep = async (rawCep: string, silent = false) => {
    const clean = digits(rawCep);
    if (clean.length !== 8) return;
    setLookupCepLoading(true);
    if (!silent) setLookupMessage('Consultando CEP...');
    try {
      const response = await fetch('/api/cep-lookup?cep=' + encodeURIComponent(clean), {
        method: 'GET',
        credentials: 'same-origin',
        headers: { accept: 'application/json' }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) throw new Error(data?.error || data?.message || 'CEP não localizado.');
      const address = data.address || {};
      setCep(formatCep(address.cep || clean));
      if (address.street) setStreet(String(address.street));
      if (address.neighborhood) setNeighborhood(String(address.neighborhood));
      if (address.city) setCity(String(address.city));
      if (address.uf) setUf(String(address.uf).toUpperCase().slice(0, 2));
      if (address.complement && !complement) setComplement(String(address.complement));
      if (!silent) setLookupMessage('Endereço localizado pelo CEP. Confira o número antes de enviar.');
    } catch (error) {
      if (!silent) setLookupMessage(error instanceof Error ? error.message : 'Não foi possível consultar o CEP.');
    } finally {
      setLookupCepLoading(false);
    }
  };

  const fillCompanyFromCnpj = async (rawCnpj: string) => {
    const clean = digits(rawCnpj);
    if (!validCnpj(clean)) {
      if (clean.length === 14) setLookupMessage('CNPJ inválido. Confira os números informados.');
      return;
    }
    setLookupCnpjLoading(true);
    setLookupMessage('Consultando CNPJ e dados cadastrais...');
    try {
      const response = await fetch('/api/company-lookup?cnpj=' + encodeURIComponent(clean), {
        method: 'GET',
        credentials: 'same-origin',
        headers: { accept: 'application/json' }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) throw new Error(data?.error || data?.message || 'CNPJ não localizado.');
      const company = data.company || {};
      if (company.companyName || company.tradeName || company.legalName) {
        setCompanyName(String(company.companyName || company.tradeName || company.legalName));
      }
      if (company.email) setEmail((current) => current.trim() ? current : String(company.email));
      if (company.phone) setPhone((current) => current.trim() ? current : String(company.phone));
      if (company.cep) setCep(formatCep(String(company.cep)));
      if (company.street) setStreet(String(company.street));
      if (company.number) setNumber(String(company.number));
      if (company.complement) setComplement(String(company.complement));
      if (company.neighborhood) setNeighborhood(String(company.neighborhood));
      if (company.city) setCity(String(company.city));
      if (company.uf) setUf(String(company.uf).toUpperCase().slice(0, 2));
      setLookupMessage('Dados da empresa localizados pelo CNPJ. Você pode corrigir qualquer campo antes de enviar.');
      if (company.cep && (!company.street || !company.city || !company.uf)) {
        await fillAddressFromCep(String(company.cep), true);
      }
    } catch (error) {
      setLookupMessage(error instanceof Error ? error.message : 'Não foi possível consultar o CNPJ. Preencha os dados manualmente.');
    } finally {
      setLookupCnpjLoading(false);
    }
  };

  useEffect(() => {
    const clean = digits(cpfCnpj);
    if (clean.length !== 14 || !validCnpj(clean)) return;
    const timer = window.setTimeout(() => { void fillCompanyFromCnpj(clean); }, 500);
    return () => window.clearTimeout(timer);
  }, [cpfCnpj]);

  useEffect(() => {
    const clean = digits(cep);
    if (clean.length !== 8) return;
    const timer = window.setTimeout(() => { void fillAddressFromCep(clean); }, 500);
    return () => window.clearTimeout(timer);
  }, [cep]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError('');

    if (![11, 14].includes(documentDigits.length) || !documentValid(cpfCnpj)) {
      setSubmitError('Informe um CPF ou CNPJ válido.');
      return;
    }
    if (!companyName.trim()) {
      setSubmitError(documentType === 'CPF' ? 'Informe seu nome profissional ou nome da empresa.' : 'Informe o nome da empresa.');
      return;
    }
    if (password.length < 8) {
      setSubmitError('Crie uma senha com pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('A senha e a confirmação precisam ser iguais.');
      return;
    }
    if (!acceptTerms) {
      setSubmitError('Aceite os termos do teste grátis e a Política de Privacidade para continuar.');
      return;
    }
    if (!cep.trim() || !street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !uf.trim()) {
      setSubmitError('Preencha o endereço completo antes de enviar.');
      return;
    }

    const address = [
      street.trim() + ', ' + number.trim(),
      complement.trim(),
      neighborhood.trim(),
      city.trim() + '/' + uf.trim().toUpperCase(),
      'CEP ' + cep.trim()
    ].filter(Boolean).join(' - ');

    const payload = {
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      companySize,
      selectedPlan,
      trialPackageCode: trialPackageCodeFor(selectedPlan),
      trialBlockedModules: ['BANCO_TALENTOS', 'MATCH_TALENTOS'],
      message: message.trim(),
      cpfCnpj: cpfCnpj.trim(),
      ...(documentType === 'CNPJ' ? { cnpj: cpfCnpj.trim() } : { cpf: cpfCnpj.trim() }),
      documentType,
      address,
      addressData: {
        cep: cep.trim(),
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        uf: uf.trim().toUpperCase()
      }
    } as CompanyLeadPayload & Record<string, unknown>;

    setSubmitting(true);
    try {
      const response = await fetch('/api/trials/start', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          ...payload,
          plan: selectedPlan,
          password,
          acceptTerms: true,
          source: 'TESTE_GRATIS_SITE'
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || data?.message || 'Falha ao registrar a solicitação (HTTP ' + response.status + ').');
      }

      setProtocol(String(data.companyId || data.id || ''));
      if (onSuccessSubmit) onSuccessSubmit(payload as CompanyLeadPayload);
      setSubmitted(true);
      try {
        await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      } catch (loginError) {
        console.warn('Trial criado; login automático não concluído.', loginError);
      }
      setTimeout(() => {
        window.location.assign('/');
      }, 1400);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível registrar a solicitação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[94vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner"><Building2 className="w-6 h-6" /></div>
            <div>
              <div className="flex items-center gap-2 flex-wrap"><h3 className="text-xl font-black tracking-tight">Cadastrar Empresa — RH TRANSFORMA</h3><span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Solução Corporativa</span></div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">Empresa ou headhunter autônomo pode solicitar acesso usando CNPJ ou CPF.</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 className="w-10 h-10" /></div>
              <h4 className="text-2xl font-black text-slate-900">Teste grátis liberado!</h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto font-medium leading-relaxed">O acesso de <strong>{companyName}</strong> foi criado por 14 dias. Estamos entrando no RH TRANSFORMA com o e-mail e a senha que você escolheu.</p>
              {protocol && <p className="text-[11px] font-bold text-slate-400">Protocolo: {protocol}</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-amber-900 font-medium"><Sparkles className="w-5 h-5 text-amber-600 shrink-0" /><span>Ganhe <strong>14 dias de teste grátis</strong> sem compromisso. Escolha uma das duas experiências abaixo. <strong>Banco de Talentos e Match Talentos não são liberados em nenhum pacote do trial.</strong></span></div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nome da Empresa / Profissional *" icon={<Building2 className="w-4 h-4" />}><input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Empresa ou nome profissional" className="rh-company-input" /></Field>
                <Field label="CPF ou CNPJ *" icon={lookupCnpjLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}><input required inputMode="numeric" value={cpfCnpj} onChange={(e) => { setCpfCnpj(formatCpfCnpj(e.target.value)); setLookupMessage(''); }} onBlur={() => { if (digits(cpfCnpj).length === 14) void fillCompanyFromCnpj(cpfCnpj); }} placeholder="CPF ou CNPJ" className="rh-company-input" /></Field>
                <Field label="Seu Nome / Cargo *" icon={<User className="w-4 h-4" />}><input required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Ex: Marina Silva - Head de RH" className="rh-company-input" /></Field>
                <Field label="E-mail *" icon={<Mail className="w-4 h-4" />}><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com.br" className="rh-company-input" /></Field>
                <Field label="Telefone / WhatsApp *" icon={<Phone className="w-4 h-4" />}><input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(43) 99999-8888" className="rh-company-input" /></Field>
                <Field label="CEP *" icon={lookupCepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}><input required inputMode="numeric" value={cep} onChange={(e) => { setCep(formatCep(e.target.value)); setLookupMessage(''); }} onBlur={() => { if (digits(cep).length === 8) void fillAddressFromCep(cep); }} placeholder="00000-000" className="rh-company-input" /></Field>
                <Field label="Endereço / Logradouro *" icon={<MapPin className="w-4 h-4" />}><input required value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua, Avenida..." className="rh-company-input" /></Field>
                <Field label="Número *"><input required value={number} onChange={(e) => setNumber(e.target.value)} placeholder="123" className="rh-company-input no-icon" /></Field>
                <Field label="Bairro *"><input required value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" className="rh-company-input no-icon" /></Field>
                <Field label="Cidade *"><input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className="rh-company-input no-icon" /></Field>
                <Field label="UF *"><input required maxLength={2} value={uf} onChange={(e) => setUf(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0,2).toUpperCase())} placeholder="PR" className="rh-company-input no-icon" /></Field>
                <Field label="Complemento"><input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Sala, bloco..." className="rh-company-input no-icon" /></Field>
              </div>

              {lookupMessage && <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-sky-800">{lookupMessage}</div>}
              <p className="-mt-2 text-[10px] text-slate-500">CNPJ: o sistema busca nome e endereço automaticamente. CPF: informe o nome profissional e use o CEP para preencher o endereço.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Tamanho da Empresa</label><select value={companySize} onChange={(e) => setCompanySize(e.target.value)} className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"><option value="1-10 colaboradores">1 a 10 colaboradores</option><option value="11-50 colaboradores">11 a 50 colaboradores</option><option value="51-200 colaboradores">51 a 200 colaboradores</option><option value="200+ colaboradores">Mais de 200 colaboradores</option></select></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Pacote para Teste Grátis</label><select value={selectedPlan} onChange={(e) => setSelectedPlan(normalizeTrialPackage(e.target.value))} className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"><option value={TRIAL_PACKAGE_RECRUITMENT_HEADHUNTER}>Recrutamento + Headhunter</option><option value={TRIAL_PACKAGE_RECRUITMENT_DP}>Recrutamento + DP</option></select><p className="mt-1 text-[10px] font-semibold text-slate-500">Os dois pacotes não incluem Banco de Talentos nem Match Talentos durante os 14 dias.</p></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Crie sua Senha *" icon={<ShieldCheck className="w-4 h-4" />}><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="rh-company-input" /></Field>
                <Field label="Confirme sua Senha *" icon={<ShieldCheck className="w-4 h-4" />}><input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" className="rh-company-input" /></Field>
              </div>

              <div><label className="block text-xs font-bold text-slate-700 mb-1">Mensagem ou Necessidade Específica (Opcional)</label><textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Descreva quantas vagas costuma abrir por mês ou os desafios atuais do seu RH..." className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500" /></div>

              <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] font-semibold text-slate-600"><input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5" /><span>Concordo com os termos do teste grátis de 14 dias e com o tratamento dos dados para criação e administração do meu acesso.</span></label>

              {submitError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700">{submitError}</div>}

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium"><ShieldCheck className="w-4 h-4 text-emerald-600" /><span>Sem necessidade de cartão de crédito</span></div>
                <div className="flex items-center justify-end gap-2"><button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">Cancelar</button><button type="submit" disabled={submitting || lookupCnpjLoading || lookupCepLoading} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer">{submitting ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Registrando...</span></> : <><span>Iniciar Teste Grátis — 14 dias</span><ArrowRight className="w-4 h-4" /></>}</button></div>
              </div>

              <style>{`.rh-company-input{width:100%;font-size:.75rem;font-weight:600;padding:.625rem .75rem .625rem 2.25rem;border-radius:.75rem;border:1px solid #e2e8f0;background:rgba(248,250,252,.5);outline:none}.rh-company-input:focus{background:#fff;box-shadow:0 0 0 2px rgba(99,102,241,.35)}.rh-company-input.no-icon{padding-left:.75rem}`}</style>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <div>
    <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
    <div className="relative">
      {icon && <span className="absolute left-3 top-3 text-slate-400">{icon}</span>}
      {children}
    </div>
  </div>
);
