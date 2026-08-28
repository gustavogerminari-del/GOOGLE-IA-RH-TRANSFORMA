import { ConfiguracoesTrabalhistas } from '../types/dp';

export const DEFAULT_CONFIG_TRABALHISTA: ConfiguracoesTrabalhistas = {
  companyId: '',
  toleranciaPontoMinutos: 10, // Art. 58 § 1º da CLT
  adicionalHorasExtrasSemanaPercent: 50,
  adicionalHorasExtrasDomingoFeriadoPercent: 100,
  adicionalNoturnoPercent: 20,
  horarioNoturnoInicio: '22:00',
  horarioNoturnoFim: '05:00',
  aliquotaFgtsPercent: 8,
  
  // Regras de Jornada, Banco de Horas e Hora Extra
  regrasJornada: {
    tipoControle: 'Modelo misto',
    jornadaSemanal: '44h',
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
  },
  
  // Tabela INSS 2026 (Oficial Vigorante)
  tabelaInss: [
    { ate: 1412.00, aliquota: 7.5, deducao: 0 },
    { ate: 2666.68, aliquota: 9.0, deducao: 21.18 },
    { ate: 4000.03, aliquota: 12.0, deducao: 101.18 },
    { ate: 7786.02, aliquota: 14.0, deducao: 181.18 }
  ],
  
  // Tabela IRRF 2026 (Com isenção e dedução por dependente de R$ 189,59)
  tabelaIrrf: [
    { ate: 2259.20, aliquota: 0, deducao: 0, deducaoDependente: 189.59 },
    { ate: 2826.65, aliquota: 7.5, deducao: 169.44, deducaoDependente: 189.59 },
    { ate: 3751.05, aliquota: 15.0, deducao: 381.44, deducaoDependente: 189.59 },
    { ate: 4664.68, aliquota: 22.5, deducao: 662.77, deducaoDependente: 189.59 },
    { ate: 999999.00, aliquota: 27.5, deducao: 896.00, deducaoDependente: 189.59 }
  ]
};
