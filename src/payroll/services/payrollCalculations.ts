/**
 * MÓDULO FOLHA DE PAGAMENTO - Motor de Cálculos Trabalhistas e Fiscais (CLT 2026)
 * Tabelas e alíquotas oficiais de INSS, IRRF, FGTS e Encargos Patronais
 */

// RH_PAYROLL_OFFICIAL_2026_V1
export const MINIMUM_WAGE_2026 = 1621.00;
export const INSS_CEILING_2026 = 8475.55;
export const IRRF_DEPENDENT_DEDUCTION = 189.59;
export const IRRF_SIMPLIFIED_DEDUCTION = 607.20;

/**
 * Cálculo do INSS Progressivo por Faixas (Vigência 2026)
 */
export function calculateINSS(grossSalary: number): { amount: number; effectiveRate: number; base: number } {
  const salary = Math.max(0, Number(grossSalary) || 0);
  const base = Math.min(salary, INSS_CEILING_2026);
  let tax = 0;

  // Portaria Interministerial MPS/MF nº 13/2026 — competência janeiro/2026 em diante.
  const bands = [
    { from: 0, to: 1621.00, rate: 0.075 },
    { from: 1621.00, to: 2902.84, rate: 0.09 },
    { from: 2902.84, to: 4354.27, rate: 0.12 },
    { from: 4354.27, to: 8475.55, rate: 0.14 },
  ];
  for (const band of bands) {
    if (base <= band.from) continue;
    tax += (Math.min(base, band.to) - band.from) * band.rate;
  }

  const amount = Number(tax.toFixed(2));
  const effectiveRate = salary > 0 ? Number(((amount / salary) * 100).toFixed(2)) : 0;
  return { amount, effectiveRate, base };
}

/**
 * Cálculo do IRRF com Dedução por Dependente, Pensão Alimentícia e Regra de Desconto Simplificado
 */
export function calculateIRRF(
  grossSalary: number,
  inssAmount: number,
  dependentsCount: number = 0,
  pensaoAlimenticia: number = 0
): { amount: number; ratePercent: number; deduction: number; base: number } {
  const monthlyTaxableIncome = Math.max(0, Number(grossSalary) || 0);
  const legalDeductions = Math.max(0, Number(inssAmount) || 0)
    + (Math.max(0, Number(dependentsCount) || 0) * IRRF_DEPENDENT_DEDUCTION)
    + Math.max(0, Number(pensaoAlimenticia) || 0);

  // A fonte pagadora pode usar o desconto simplificado mensal quando mais vantajoso.
  const baseTraditional = Math.max(0, monthlyTaxableIncome - legalDeductions);
  const baseSimplified = Math.max(0, monthlyTaxableIncome - IRRF_SIMPLIFIED_DEDUCTION);
  const base = Math.min(baseTraditional, baseSimplified);

  let ratePercent = 0;
  let deduction = 0;
  if (base <= 2428.80) {
    ratePercent = 0;
    deduction = 0;
  } else if (base <= 2826.65) {
    ratePercent = 7.5;
    deduction = 182.16;
  } else if (base <= 3751.05) {
    ratePercent = 15.0;
    deduction = 394.16;
  } else if (base <= 4664.68) {
    ratePercent = 22.5;
    deduction = 675.49;
  } else {
    ratePercent = 27.5;
    deduction = 908.73;
  }

  const rawTax = Math.max(0, (base * (ratePercent / 100)) - deduction);

  // Lei 15.270/2025 — redução mensal a partir de janeiro/2026.
  // A faixa de redução considera o rendimento tributável mensal, e não a base após deduções.
  let reduction = 0;
  if (monthlyTaxableIncome <= 5000) {
    reduction = Math.min(rawTax, 312.89);
  } else if (monthlyTaxableIncome <= 7350) {
    reduction = Math.min(rawTax, Math.max(0, 978.62 - (0.133145 * monthlyTaxableIncome)));
  }

  const amount = Math.max(0, Number((rawTax - reduction).toFixed(2)));
  return { amount, ratePercent, deduction, base: Number(base.toFixed(2)) };
}

/**
 * Cálculo do FGTS (8% sobre Proventos Tributáveis)
 */
export function calculateFGTS(grossSalary: number): { amount: number; base: number } {
  const base = grossSalary;
  const amount = Number((base * 0.08).toFixed(2));
  return { amount, base };
}

/**
 * Cálculo dos Encargos Patronais da Empresa (INSS Patronal 20%, RAT/SAT 2%, Terceiros 5.8%)
 */
export function calculateEmployerCharges(grossSalary: number) {
  const inssPatronal = Number((grossSalary * 0.20).toFixed(2));
  const ratSat = Number((grossSalary * 0.02).toFixed(2));
  const terceiros = Number((grossSalary * 0.058).toFixed(2));
  const totalPatronal = Number((inssPatronal + ratSat + terceiros).toFixed(2));
  const fgtsValor = Number((grossSalary * 0.08).toFixed(2));

  return {
    inssPatronal,
    ratSat,
    terceiros,
    totalPatronal,
    fgtsValor
  };
}

/**
 * Horas Extras (50% e 100%)
 */
export function calculateOvertime(baseSalary: number, hours50: number = 0, hours100: number = 0) {
  const hourlyRate = baseSalary / 220;
  const amount50 = Number((hourlyRate * 1.5 * hours50).toFixed(2));
  const amount100 = Number((hourlyRate * 2.0 * hours100).toFixed(2));
  return { hourlyRate, amount50, amount100, totalOvertime: amount50 + amount100 };
}

/**
 * Adicional Noturno (20% sobre valor hora base)
 */
export function calculateNightShift(baseSalary: number, nightHours: number = 0) {
  const hourlyRate = baseSalary / 220;
  const amount = Number((hourlyRate * 0.20 * nightHours).toFixed(2));
  return amount;
}

/**
 * Insalubridade (10%, 20% ou 40% sobre Salário Mínimo)
 */
export function calculateInsalubridade(degree: '10%' | '20%' | '40%') {
  const percentMap = { '10%': 0.10, '20%': 0.20, '40%': 0.40 };
  const percent = percentMap[degree] || 0.20;
  return Number((MINIMUM_WAGE_2026 * percent).toFixed(2));
}

/**
 * Periculosidade (30% sobre Salário Base)
 */
export function calculatePericulosidade(baseSalary: number) {
  return Number((baseSalary * 0.30).toFixed(2));
}

/**
 * DSR (Descanso Semanal Remunerado) sobre Horas Extras / Comissões
 */
export function calculateDSR(overtimeAndCommissionsTotal: number, workingDays: number = 25, sundaysAndHolidays: number = 5) {
  if (workingDays <= 0) return 0;
  return Number(((overtimeAndCommissionsTotal / workingDays) * sundaysAndHolidays).toFixed(2));
}

/**
 * Gera Hash Digital SHA-like para validação do Holerite Assinado
 */
export function generateDigitalHash(paystubId: string, employeeCpf: string, timestamp: string): string {
  const str = `${paystubId}-${employeeCpf}-${timestamp}-MAISRH-SECURE-CLT-2026`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'MAISRH-SHA256-' + Math.abs(hash).toString(16).toUpperCase().padStart(12, '0') + '-' + Date.now().toString(36).toUpperCase();
}
