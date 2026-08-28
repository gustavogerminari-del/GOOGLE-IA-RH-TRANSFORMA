import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Sliders, 
  Save, 
  Clock, 
  Percent, 
  DollarSign, 
  CheckCircle2, 
  Building2, 
  FileText,
  Calendar,
  Layers,
  Scale,
  Plus,
  Trash2,
  HelpCircle,
  Zap,
  Check
} from 'lucide-react';
import { 
  ConfiguracoesTrabalhistas, 
  RegraJornadaEmpresa, 
  TipoControleJornada, 
  JornadaSemanalTipo, 
  EscalaTrabalhoTipo,
  PrazoCompensacaoBH,
  FormaAprovacaoBH
} from '../types/dp';

interface ConfiguracoesTrabalhistasProps {
  config: ConfiguracoesTrabalhistas;
  onSalvarConfig: (cfg: ConfiguracoesTrabalhistas) => void;
}

const DEFAULT_REGRAS_JORNADA: RegraJornadaEmpresa = {
  tipoControle: 'Modelo misto',
  jornadaSemanal: '44h',
  jornadaSemanalHorasCustom: 44,
  jornadaDiariaHoras: 8.8,
  escalaPadrao: 'Segunda a sexta',
  horariosPadrao: {
    entrada: '08:00',
    intervaloSaida: '12:00',
    intervaloRetorno: '13:12',
    saida: '18:00'
  },
  pagaHoraExtra: true,
  horaExtraDiaUtilPercent: 50,
  horaExtraDomingoFeriadoPercent: 100,
  adicionalNoturnoPercent: 20,
  percentuaisPersonalizados: [
    { descricao: 'Hora Extra Feriado Nacional Coletivo', percentual: 100 },
    { descricao: 'Hora Extra Plantão de Prontidão', percentual: 60 }
  ],
  ativarBancoHoras: true,
  prazoCompensacao: '6 meses',
  limiteSaldoPositivoHoras: 20,
  limiteSaldoNegativoHoras: 5,
  formaAprovacao: 'Aprovação do Gestor',
  modeloMistoRegra: {
    limiteDiarioBancoHoras: 2,
    limiteMensalBancoHoras: 20
  }
};

export const ConfiguracoesTrabalhistasView: React.FC<ConfiguracoesTrabalhistasProps> = ({
  config,
  onSalvarConfig
}) => {
  const [formData, setFormData] = useState<ConfiguracoesTrabalhistas>({
    ...config,
    regrasJornada: config.regrasJornada || DEFAULT_REGRAS_JORNADA
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [novoPercentualDesc, setNovoPercentualDesc] = useState('');
  const [novoPercentualVal, setNovoPercentualVal] = useState(75);

  const regras = formData.regrasJornada || DEFAULT_REGRAS_JORNADA;

  const updateRegras = (patch: Partial<RegraJornadaEmpresa>) => {
    setFormData(prev => ({
      ...prev,
      regrasJornada: {
        ...(prev.regrasJornada || DEFAULT_REGRAS_JORNADA),
        ...patch
      }
    }));
  };

  const handleAddPercentualCustom = () => {
    if (!novoPercentualDesc.trim()) return;
    const list = [...(regras.percentuaisPersonalizados || [])];
    list.push({
      descricao: novoPercentualDesc.trim(),
      percentual: novoPercentualVal
    });
    updateRegras({ percentuaisPersonalizados: list });
    setNovoPercentualDesc('');
    setNovoPercentualVal(75);
  };

  const handleRemovePercentualCustom = (index: number) => {
    const list = [...(regras.percentuaisPersonalizados || [])];
    list.splice(index, 1);
    updateRegras({ percentuaisPersonalizados: list });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvarConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#2563EB]">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-[#1E293B]">Parâmetros, Jornada & Banco de Horas da Empresa</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Defina as regras próprias de jornada, compensação de banco de horas, percentuais de horas extras e tolerâncias por empresa cliente (Multi-tenant).
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-2 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Configurações Trabalhistas Atualizadas com Sucesso!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 1. SEÇÃO MODELO DE CONTROLE DE JORNADA */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#2563EB]" />
              <h3 className="font-bold text-[#1E293B] text-sm">1. Módulo & Tipo de Controle de Jornada</h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 text-[#2563EB] rounded-lg border border-blue-200/60">
              Regra Ativa: {regras.tipoControle}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Escolha como as horas excedentes trabalhadas pelos colaboradores serão processadas no fechamento do período:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Opção A: Pagamento de Hora Extra */}
            <div 
              onClick={() => updateRegras({ tipoControle: 'Pagamento de hora extra', pagaHoraExtra: true, ativarBancoHoras: false })}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                regras.tipoControle === 'Pagamento de hora extra'
                  ? 'border-[#2563EB] bg-blue-50/40 text-slate-900 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs flex items-center gap-1.5 text-[#1E293B]">
                  <DollarSign className="w-4 h-4 text-[#2563EB]" />
                  Pagamento de Hora Extra
                </span>
                {regras.tipoControle === 'Pagamento de hora extra' && (
                  <Check className="w-4 h-4 text-[#2563EB]" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Todas as horas excedentes são enviadas diretamente para a folha de pagamento como provento de Hora Extra (50%, 100% ou adicional).
              </p>
            </div>

            {/* Opção B: Banco de Horas */}
            <div 
              onClick={() => updateRegras({ tipoControle: 'Banco de horas', pagaHoraExtra: false, ativarBancoHoras: true })}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                regras.tipoControle === 'Banco de horas'
                  ? 'border-[#2563EB] bg-blue-50/40 text-slate-900 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs flex items-center gap-1.5 text-[#1E293B]">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  Banco de Horas
                </span>
                {regras.tipoControle === 'Banco de horas' && (
                  <Check className="w-4 h-4 text-[#2563EB]" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                As horas excedentes viram saldo positivo de compensação e atrasos viram saldo negativo, sem pagamento direto em folha no mês.
              </p>
            </div>

            {/* Opção C: Modelo Misto */}
            <div 
              onClick={() => updateRegras({ tipoControle: 'Modelo misto', pagaHoraExtra: true, ativarBancoHoras: true })}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                regras.tipoControle === 'Modelo misto'
                  ? 'border-[#2563EB] bg-blue-50/40 text-slate-900 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs flex items-center gap-1.5 text-[#1E293B]">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Modelo Misto (Híbrido)
                </span>
                {regras.tipoControle === 'Modelo misto' && (
                  <Check className="w-4 h-4 text-[#2563EB]" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Combina Banco de Horas + Pagamento. Até um limite predefinido de horas vai para o banco; o excedente é pago em folha.
              </p>
            </div>
          </div>
        </div>

        {/* 2. CONFIGURAÇÃO DE JORNADA DA EMPRESA */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-[#1E293B] text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#2563EB]" />
            <span>2. Configuração da Jornada de Trabalho Padrão da Empresa</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jornada Semanal</label>
              <select
                value={regras.jornadaSemanal}
                onChange={(e) => updateRegras({ jornadaSemanal: e.target.value as JornadaSemanalTipo })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
              >
                <option value="44h">44 Horas Semanais (Padrão CLT)</option>
                <option value="40h">40 Horas Semanais</option>
                <option value="Personalizada">Jornada Personalizada</option>
              </select>
            </div>

            {regras.jornadaSemanal === 'Personalizada' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Horas Semanais Customizadas</label>
                <input
                  type="number"
                  step="0.5"
                  value={regras.jornadaSemanalHorasCustom || 36}
                  onChange={(e) => updateRegras({ jornadaSemanalHorasCustom: parseFloat(e.target.value) || 36 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Jornada Diária (Horas/Dia)</label>
              <input
                type="number"
                step="0.1"
                value={regras.jornadaDiariaHoras}
                onChange={(e) => updateRegras({ jornadaDiariaHoras: parseFloat(e.target.value) || 8.0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono text-slate-800 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: 8.8h (8h48m) ou 8.0h diárias</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Modelo de Escala da Empresa</label>
              <select
                value={regras.escalaPadrao}
                onChange={(e) => updateRegras({ escalaPadrao: e.target.value as EscalaTrabalhoTipo })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
              >
                <option value="Segunda a sexta">Segunda a Sexta-feira (5x2)</option>
                <option value="Segunda a sábado">Segunda a Sábado (6x1)</option>
                <option value="12x36">Plantão 12x36</option>
                <option value="Escala personalizada">Escala Personalizada / Flexível</option>
              </select>
            </div>
          </div>

          {/* Horários Padronizados */}
          <div className="pt-2">
            <label className="block font-bold text-slate-700 mb-2">Horários Padronizados de Entrada, Intervalo e Saída</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Entrada</span>
                <input
                  type="time"
                  value={regras.horariosPadrao.entrada}
                  onChange={(e) => updateRegras({
                    horariosPadrao: { ...regras.horariosPadrao, entrada: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Saída Intervalo</span>
                <input
                  type="time"
                  value={regras.horariosPadrao.intervaloSaida}
                  onChange={(e) => updateRegras({
                    horariosPadrao: { ...regras.horariosPadrao, intervaloSaida: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Retorno Intervalo</span>
                <input
                  type="time"
                  value={regras.horariosPadrao.intervaloRetorno}
                  onChange={(e) => updateRegras({
                    horariosPadrao: { ...regras.horariosPadrao, intervaloRetorno: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Saída Final</span>
                <input
                  type="time"
                  value={regras.horariosPadrao.saida}
                  onChange={(e) => updateRegras({
                    horariosPadrao: { ...regras.horariosPadrao, saida: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. CONFIGURAÇÃO DE HORA EXTRA */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-[#1E293B] text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#2563EB]" />
            <span>3. Regras de Adicionais e Pagamento de Hora Extra</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pagamento de Hora Extra?</label>
              <select
                value={regras.pagaHoraExtra ? 'SIM' : 'NAO'}
                onChange={(e) => updateRegras({ pagaHoraExtra: e.target.value === 'SIM' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
              >
                <option value="SIM">SIM (Gera provento automático na folha)</option>
                <option value="NAO">NÃO (Gera crédito no banco de horas)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hora Extra Dia Útil (%)</label>
              <input
                type="number"
                value={regras.horaExtraDiaUtilPercent}
                onChange={(e) => updateRegras({ horaExtraDiaUtilPercent: parseFloat(e.target.value) || 50 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-800 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Mínimo legal 50%</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hora Extra Domingos/Feriados (%)</label>
              <input
                type="number"
                value={regras.horaExtraDomingoFeriadoPercent}
                onChange={(e) => updateRegras({ horaExtraDomingoFeriadoPercent: parseFloat(e.target.value) || 100 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-800 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Convenção / 100%</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Adicional Noturno (%)</label>
              <input
                type="number"
                value={regras.adicionalNoturnoPercent}
                onChange={(e) => updateRegras({ adicionalNoturnoPercent: parseFloat(e.target.value) || 20 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-800 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Trabalho Urbano 20%</span>
            </div>
          </div>

          {/* Percentuais Personalizados */}
          <div className="pt-2 space-y-2">
            <label className="block font-bold text-slate-700 text-xs">Percentuais Personalizados de Convenção Coletiva</label>
            <div className="flex flex-col md:flex-row items-center gap-2 text-xs">
              <input
                type="text"
                placeholder="Ex: Hora Extra em Sábados de Feirão"
                value={novoPercentualDesc}
                onChange={(e) => setNovoPercentualDesc(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl bg-white"
              />
              <div className="flex items-center gap-1 w-full md:w-auto">
                <input
                  type="number"
                  placeholder="%"
                  value={novoPercentualVal}
                  onChange={(e) => setNovoPercentualVal(parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={handleAddPercentualCustom}
                  className="px-4 py-2 bg-blue-50 text-[#2563EB] hover:bg-blue-100 font-bold rounded-xl border border-blue-200 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Regra</span>
                </button>
              </div>
            </div>

            {regras.percentuaisPersonalizados && regras.percentuaisPersonalizados.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                {regras.percentuaisPersonalizados.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{item.descricao}</span>
                      <span className="text-blue-600 font-mono font-bold">Adicional de +{item.percentual}%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePercentualCustom(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. CONFIGURAÇÃO DE BANCO DE HORAS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-[#1E293B] text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#2563EB]" />
            <span>4. Regras de Banco de Horas & Compensação</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ativar Banco de Horas?</label>
              <select
                value={regras.ativarBancoHoras ? 'SIM' : 'NAO'}
                onChange={(e) => updateRegras({ ativarBancoHoras: e.target.value === 'SIM' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
              >
                <option value="SIM">SIM (Banco de Horas Ativo)</option>
                <option value="NAO">NÃO (Desativado)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Prazo de Compensação</label>
              <select
                value={regras.prazoCompensacao}
                onChange={(e) => updateRegras({ prazoCompensacao: e.target.value as PrazoCompensacaoBH })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
              >
                <option value="3 meses">3 Meses (Acordo Individual)</option>
                <option value="6 meses">6 Meses (Acordo Individual Escrito)</option>
                <option value="12 meses">12 Meses (Convenção Coletiva Sindicato)</option>
                <option value="Personalizado">Prazo Personalizado</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Limite Saldo Positivo (Horas)</label>
              <input
                type="number"
                value={regras.limiteSaldoPositivoHoras}
                onChange={(e) => updateRegras({ limiteSaldoPositivoHoras: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-emerald-700 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: +20h max saldo positivo</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Limite Saldo Negativo (Horas)</label>
              <input
                type="number"
                value={regras.limiteSaldoNegativoHoras}
                onChange={(e) => updateRegras({ limiteSaldoNegativoHoras: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-rose-700 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: -05h max saldo negativo</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 text-xs mb-1">Forma de Aprovação para Compensação de Horas</label>
            <select
              value={regras.formaAprovacao}
              onChange={(e) => updateRegras({ formaAprovacao: e.target.value as FormaAprovacaoBH })}
              className="w-full md:w-1/2 px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-800"
            >
              <option value="Automática">Aprovação Automática pelo Sistema</option>
              <option value="Aprovação do Gestor">Aprovação Prévia do Gestor Direto</option>
              <option value="Aprovação do RH">Validação Exclusiva pelo Departamento Pessoal / RH</option>
            </select>
          </div>
        </div>

        {/* 5. CONFIGURAÇÃO DE MODELO MISTO */}
        {regras.tipoControle === 'Modelo misto' && (
          <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-6 shadow-2xs space-y-4">
            <h3 className="font-bold text-[#1E293B] text-sm border-b border-amber-200/60 pb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>5. Parâmetros Específicos do Modelo Misto (Banco de Horas + Hora Extra Paga)</span>
            </h3>

            <p className="text-xs text-slate-600">
              Defina os limites em que as horas excedentes alimentam o Banco de Horas e a partir de qual ponto são pagas em dinheiro na Folha de Pagamento.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-amber-200">
                <label className="block font-bold text-slate-800 mb-1">Limite Diário no Banco de Horas (Horas/Dia)</label>
                <input
                  type="number"
                  step="0.5"
                  value={regras.modeloMistoRegra?.limiteDiarioBancoHoras || 2}
                  onChange={(e) => updateRegras({
                    modeloMistoRegra: {
                      ...(regras.modeloMistoRegra || { limiteMensalBancoHoras: 20 }),
                      limiteDiarioBancoHoras: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Ex: Até 02 horas extras diárias vão para o Banco de Horas. Excedente acima de 2h é pago na Folha.
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-amber-200">
                <label className="block font-bold text-slate-800 mb-1">Limite Mensal no Banco de Horas (Horas/Mês)</label>
                <input
                  type="number"
                  value={regras.modeloMistoRegra?.limiteMensalBancoHoras || 20}
                  onChange={(e) => updateRegras({
                    modeloMistoRegra: {
                      ...(regras.modeloMistoRegra || { limiteDiarioBancoHoras: 2 }),
                      limiteMensalBancoHoras: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Ex: Saldo acumulado no mês até 20 horas. O que ultrapassar 20 horas no mês é convertido para pagamento em folha.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* General CLT Parameters */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-[#1E293B] text-sm border-b border-slate-100 pb-2">6. Tolerâncias de Ponto & Alíquotas Legais CLT</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tolerância Diária de Ponto (Minutos)</label>
              <input
                type="number"
                value={formData.toleranciaPontoMinutos}
                onChange={(e) => setFormData({ ...formData, toleranciaPontoMinutos: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Art. 58 § 1º CLT (Padrão 10 minutos diários)</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Início Horário Noturno</label>
              <input
                type="time"
                value={formData.horarioNoturnoInicio}
                onChange={(e) => setFormData({ ...formData, horarioNoturnoInicio: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Fim Horário Noturno</label>
              <input
                type="time"
                value={formData.horarioNoturnoFim}
                onChange={(e) => setFormData({ ...formData, horarioNoturnoFim: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* Progressive INSS & IRRF Tables */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-[#1E293B] text-sm border-b border-slate-100 pb-2">7. Tabelas Progressivas de INSS & IRRF (Ano Vigente 2026)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* INSS */}
            <div className="space-y-2">
              <h4 className="font-bold text-[#2563EB]">Tabela Progressiva INSS</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold">
                      <th className="p-2">Faixa de Salário</th>
                      <th className="p-2">Alíquota</th>
                      <th className="p-2">Dedução</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.tabelaInss.map((f, i) => (
                      <tr key={i} className="border-b border-slate-100 font-mono">
                        <td className="p-2">Até R$ {f.ate.toFixed(2)}</td>
                        <td className="p-2 font-bold">{f.aliquota}%</td>
                        <td className="p-2">R$ {f.deducao.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* IRRF */}
            <div className="space-y-2">
              <h4 className="font-bold text-emerald-700">Tabela Progressiva IRRF</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold">
                      <th className="p-2">Base de Cálculo</th>
                      <th className="p-2">Alíquota</th>
                      <th className="p-2">Dedução</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.tabelaIrrf.map((f, i) => (
                      <tr key={i} className="border-b border-slate-100 font-mono">
                        <td className="p-2">Até R$ {f.ate.toFixed(2)}</td>
                        <td className="p-2 font-bold">{f.aliquota}%</td>
                        <td className="p-2">R$ {f.deducao.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Regras de Jornada & Parâmetros Trabalhistas</span>
          </button>
        </div>
      </form>
    </div>
  );
};
