import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  addDoc 
} from '../../firebase/firestore';
import { db } from '../../lib/firebase';
import { sanitizeFirestoreData } from '../../lib/firestoreUtils';
import { 
  PayrollPeriod, 
  Paystub, 
  PaystubItem, 
  RubricDefinition, 
  TaxTableVersion, 
  PayrollAuditLog, 
  PayrollValidationResult,
  PayrollType,
  ESocialEvent
} from '../types/payroll';
import { 
  calculateINSS, 
  calculateIRRF, 
  calculateFGTS, 
  calculateEmployerCharges, 
  generateDigitalHash,
  calculateOvertime,
  calculateNightShift,
  calculateInsalubridade,
  calculatePericulosidade,
  calculateDSR
} from './payrollCalculations';
import { 
  getColaboradoresFirestore, 
  getBeneficiosFirestore, 
  getFeriasFirestore, 
  getAfastamentosFirestore, 
  getRescisoesFirestore, 
  getAjustesPontoFirestore 
} from '../../departamento-pessoal/services/dpFirestoreService';

export { getColaboradoresFirestore };

const COLLECTION_PERIODS = 'payroll_competences';
const COLLECTION_PAYSTUBS = 'payroll_stubs';
const COLLECTION_RUBRICS = 'payroll_events';
const COLLECTION_TAX_TABLES = 'tax_tables';
const COLLECTION_AUDIT = 'payroll_audit_logs';
const COLLECTION_ESOCIAL = 'esocial_events';
const COLLECTION_COMPANY_SETTINGS = 'payroll_company_settings';
const COLLECTION_SALARY_HISTORY = 'payroll_salary_history';
const COLLECTION_VARIABLE_PAY = 'payroll_variable_pay';
const COLLECTION_ALIMONY = 'payroll_alimony';
const COLLECTION_LOANS = 'payroll_loans';
const COLLECTION_PAYMENTS = 'payroll_payments';
const COLLECTION_PONTO_REGISTROS = 'registros_ponto';

export async function getPayrollCompanySettingsFirestore(companyId: string) {
  try {
    const q = query(
      collection(db, COLLECTION_COMPANY_SETTINGS),
      where('companyId', '==', companyId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return sanitizeFirestoreData(snap.docs[0].data()) as any;
    }
  } catch (err) {
    console.warn('[Payroll] Erro ao carregar configurações da empresa:', err);
  }
  return {
    payrollSettingsId: `set-${companyId}`,
    companyId,
    empresaId: companyId,
    configured: false,
    razaoSocial: '',
    cnpj: '',
    regimeTributario: '',
    naturezaJuridica: '',
    cnae: '',
    fpas: '',
    terceiros: '',
    ratPercent: 0,
    fapPercent: 0,
    sindicatoDefault: '',
    convenacaoColetiva: '',
    dataPagamentoDia: 0,
    formaPagamentoPadrao: '',
    contaBancaria: { banco: '', agencia: '', conta: '' },
    responsavelNome: '',
    responsavelEmail: ''
  };
}

export async function savePayrollCompanySettingsFirestore(companyId: string, settings: any): Promise<void> {
  const docId = settings.payrollSettingsId || `set-${companyId}`;
  const data = {
    ...settings,
    companyId,
    empresaId: companyId,
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, COLLECTION_COMPANY_SETTINGS, docId), data, { merge: true });
}

export async function getSalaryHistoryFirestore(companyId: string, employeeId?: string): Promise<any[]> {
  try {
    let q;
    if (employeeId) {
      q = query(
        collection(db, COLLECTION_SALARY_HISTORY),
        where('companyId', '==', companyId),
        where('employeeId', '==', employeeId)
      );
    } else {
      q = query(
        collection(db, COLLECTION_SALARY_HISTORY),
        where('companyId', '==', companyId)
      );
    }
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...(sanitizeFirestoreData(d.data()) as any) }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return list;
    }
  } catch (err) {
    console.warn('[Payroll] Erro ao carregar histórico salarial:', err);
  }
  return [];
}

export async function saveSalaryHistoryFirestore(companyId: string, item: any): Promise<void> {
  const docId = item.salaryHistoryId || `sal-${Date.now()}`;
  const data = {
    ...item,
    salaryHistoryId: docId,
    companyId,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, COLLECTION_SALARY_HISTORY, docId), data, { merge: true });
}

export async function getVariablePayFirestore(companyId: string, competencia?: string): Promise<any[]> {
  try {
    let q;
    if (competencia) {
      q = query(
        collection(db, COLLECTION_VARIABLE_PAY),
        where('companyId', '==', companyId),
        where('competencia', '==', competencia)
      );
    } else {
      q = query(
        collection(db, COLLECTION_VARIABLE_PAY),
        where('companyId', '==', companyId)
      );
    }
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...(sanitizeFirestoreData(d.data()) as any) }));
    }
  } catch (err) {
    console.warn('[Payroll] Erro ao carregar lancamentos variaveis:', err);
  }
  return [];
}

export async function saveVariablePayFirestore(companyId: string, item: any): Promise<void> {
  const docId = item.variablePayId || `vp-${Date.now()}`;
  const data = {
    ...item,
    variablePayId: docId,
    companyId,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, COLLECTION_VARIABLE_PAY, docId), data, { merge: true });
}

export async function getAlimonyFirestore(companyId: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, COLLECTION_ALIMONY),
      where('companyId', '==', companyId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...(sanitizeFirestoreData(d.data()) as any) }));
    }
  } catch (err) {
    console.warn('[Payroll] Erro ao carregar pensoes alimenticias:', err);
  }
  return [];
}

export async function saveAlimonyFirestore(companyId: string, item: any): Promise<void> {
  const docId = item.alimonyId || `alim-${Date.now()}`;
  const data = {
    ...item,
    alimonyId: docId,
    companyId
  };
  await setDoc(doc(db, COLLECTION_ALIMONY, docId), data, { merge: true });
}

export async function getLoansFirestore(companyId: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, COLLECTION_LOANS),
      where('companyId', '==', companyId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...(sanitizeFirestoreData(d.data()) as any) }));
    }
  } catch (err) {
    console.warn('[Payroll] Erro ao carregar consignados/emprestimos:', err);
  }
  return [];
}

export async function saveLoanFirestore(companyId: string, item: any): Promise<void> {
  const docId = item.loanId || `loan-${Date.now()}`;
  const data = {
    ...item,
    loanId: docId,
    companyId
  };
  await setDoc(doc(db, COLLECTION_LOANS, docId), data, { merge: true });
}

export async function getPayrollPaymentsFirestore(companyId: string, periodId?: string): Promise<any[]> {
  try {
    let q;
    if (periodId) {
      q = query(
        collection(db, COLLECTION_PAYMENTS),
        where('companyId', '==', companyId),
        where('payrollPeriodId', '==', periodId)
      );
    } else {
      q = query(
        collection(db, COLLECTION_PAYMENTS),
        where('companyId', '==', companyId)
      );
    }
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...(sanitizeFirestoreData(d.data()) as any) }));
    }
  } catch (err) {
    console.warn('[Payroll] Erro ao carregar pagamentos bancarios:', err);
  }
  return [];
}

export async function savePayrollPaymentFirestore(companyId: string, item: any): Promise<void> {
  const docId = item.paymentId || `pay-${Date.now()}`;
  const data = {
    ...item,
    paymentId: docId,
    companyId
  };
  await setDoc(doc(db, COLLECTION_PAYMENTS, docId), data, { merge: true });
}

// RH_PAYROLL_OFFICIAL_2026_V1
// Default Tax Table Version for 2026
export const DEFAULT_TAX_TABLE_2026: TaxTableVersion = {
  id: 'tax-2026-v1',
  companyId: 'default',
  vigenciaInicio: '2026-01',
  description: 'Tabela 2026 — INSS Portaria MPS/MF 13/2026 e IRRF Receita Federal com redução Lei 15.270/2025',
  minimumWage: 1621.00,
  inssCeiling: 8475.55,
  irrfDependentDeduction: 189.59,
  irrfSimplifiedDeduction: 607.20,
  ratPercent: 2.0,
  terceirosPercent: 5.8,
  inssPatronalPercent: 20.0,
  fgtsPercent: 8.0,
  isSystemDefault: true,
  inssBrackets: [
    { min: 0, max: 1621.00, rate: 7.5 },
    { min: 1621.01, max: 2902.84, rate: 9.0 },
    { min: 2902.85, max: 4354.27, rate: 12.0 },
    { min: 4354.28, max: 8475.55, rate: 14.0 }
  ],
  irrfBrackets: [
    { min: 0, max: 2428.80, rate: 0, deduction: 0 },
    { min: 2428.81, max: 2826.65, rate: 7.5, deduction: 182.16 },
    { min: 2826.66, max: 3751.05, rate: 15.0, deduction: 394.16 },
    { min: 3751.06, max: 4664.68, rate: 22.5, deduction: 675.49 },
    { min: 4664.69, max: 999999.00, rate: 27.5, deduction: 908.73 }
  ]
};

// Default System Rubrics Catalog
export const DEFAULT_RUBRICS: RubricDefinition[] = [
  { code: '1001', name: 'Salário Base', type: 'Provento', description: 'Salário contratual trabalhado no mês', incidesINSS: true, incidesIRRF: true, incidesFGTS: true, incidesDSR: false, isSystemDefault: true },
  { code: '1002', name: 'Horas Extras 50%', type: 'Provento', description: 'Horas excedentes em dias úteis com 50% adicional', incidesINSS: true, incidesIRRF: true, incidesFGTS: true, incidesDSR: true, isSystemDefault: true },
  { code: '1003', name: 'Horas Extras 100%', type: 'Provento', description: 'Horas excedentes em domingos/feriados com 100% adicional', incidesINSS: true, incidesIRRF: true, incidesFGTS: true, incidesDSR: true, isSystemDefault: true },
  { code: '1004', name: 'Adicional Noturno 20%', type: 'Provento', description: 'Trabalho em horário noturno (22h às 05h)', incidesINSS: true, incidesIRRF: true, incidesFGTS: true, incidesDSR: true, isSystemDefault: true },
  { code: '1005', name: 'Adicional de Insalubridade', type: 'Provento', description: 'Grau mínimo (10%), médio (20%) ou máximo (40%) s/ sal. mínimo', incidesINSS: true, incidesIRRF: true, incidesFGTS: true, incidesDSR: false, isSystemDefault: true },
  { code: '1006', name: 'Adicional de Periculosidade', type: 'Provento', description: '30% sobre o salário base contratual', incidesINSS: true, incidesIRRF: true, incidesFGTS: true, incidesDSR: false, isSystemDefault: true },
  { code: '1007', name: 'DSR sobre Horas Extras e Adicionais', type: 'Provento', description: 'Descanso Semanal Remunerado s/ variáveis', incidesINSS: true, incidesIRRF: true, incidesFGTS: true, incidesDSR: false, isSystemDefault: true },
  { code: '1008', name: 'Comissões de Vendas', type: 'Provento', description: 'Comissões e gratificações variáveis sobre metas', incidesINSS: true, incidesIRRF: true, incidesFGTS: true, incidesDSR: true, isSystemDefault: true },
  { code: '1015', name: 'Férias Gozadas no Mês', type: 'Provento', description: 'Proventos de férias gozadas dentro da competência', incidesINSS: true, incidesIRRF: true, incidesFGTS: true, incidesDSR: false, isSystemDefault: true },
  { code: '1016', name: '1/3 Constitucional de Férias', type: 'Provento', description: 'Adicional constitucional de 1/3 de férias', incidesINSS: true, incidesIRRF: true, incidesFGTS: true, incidesDSR: false, isSystemDefault: true },
  { code: '5001', name: 'INSS', type: 'Desconto', description: 'Contribuição previdenciária oficial do trabalhador (tabela progressiva)', incidesINSS: false, incidesIRRF: false, incidesFGTS: false, isSystemDefault: true },
  { code: '5002', name: 'IRRF', type: 'Desconto', description: 'Imposto de Renda Retido na Fonte com dedução de dependentes e previdência', incidesINSS: false, incidesIRRF: false, incidesFGTS: false, isSystemDefault: true },
  { code: '5003', name: 'Vale Transporte (Coparticipação até 6%)', type: 'Desconto', description: 'Desconto legal de Vale Transporte', incidesINSS: false, incidesIRRF: false, incidesFGTS: false, isSystemDefault: true },
  { code: '5004', name: 'Vale Refeição / Alimentação (Coparticipação PAT)', type: 'Desconto', description: 'Desconto do benefício de alimentação', incidesINSS: false, incidesIRRF: false, incidesFGTS: false, isSystemDefault: true },
  { code: '5005', name: 'Pensão Alimentícia (Judicial)', type: 'Desconto', description: 'Desconto de pensão alimentícia fixado por decisão judicial', incidesINSS: false, incidesIRRF: false, incidesFGTS: false, isSystemDefault: true },
  { code: '5006', name: 'Faltas e Atrasos Não Justificados', type: 'Desconto', description: 'Desconto de horas ou dias de ausência não abonados', incidesINSS: true, incidesIRRF: true, incidesFGTS: true, isSystemDefault: true },
  { code: '5007', name: 'DSR sobre Faltas', type: 'Desconto', description: 'Perda do DSR proporcional às faltas não justificadas na semana', incidesINSS: true, incidesIRRF: true, incidesFGTS: true, isSystemDefault: true },
  { code: '5008', name: 'Plano de Saúde (Co-participação)', type: 'Desconto', description: 'Desconto de convênio médico do colaborador/dependentes', incidesINSS: false, incidesIRRF: false, incidesFGTS: false, isSystemDefault: true },
  { code: '9001', name: 'Base de Cálculo do FGTS (Informativa)', type: 'Informativa', description: 'Base tributável sujeita a recolhimento do FGTS', incidesINSS: false, incidesIRRF: false, incidesFGTS: false, isSystemDefault: true },
  { code: '9002', name: 'FGTS do Mês (8% Informativo)', type: 'Informativa', description: 'Valor recolhido pela empresa na conta vinculada', incidesINSS: false, incidesIRRF: false, incidesFGTS: false, isSystemDefault: true }
];

/**
 * Carrega ou inicializa os Períodos/Competências de Folha para uma empresa
 */
export async function getPayrollPeriodsFirestore(companyId: string): Promise<PayrollPeriod[]> {
  try {
    const q = query(
      collection(db, COLLECTION_PERIODS),
      where('companyId', '==', companyId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...(sanitizeFirestoreData(d.data()) as Record<string, any>)
      })) as PayrollPeriod[];
      list.sort((a, b) => b.referenceMonth.localeCompare(a.referenceMonth));
      return list;
    }
  } catch (err) {
    console.warn('[Payroll] Erro ao carregar competências do Firestore:', err);
  }

  return [];
}

/**
 * Salva ou atualiza uma Competência de Folha no Firestore
 */
export async function savePayrollPeriodFirestore(companyId: string, period: PayrollPeriod): Promise<void> {
  const periodData = {
    ...period,
    companyId,
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, COLLECTION_PERIODS, period.id), periodData, { merge: true });
}

/**
 * Trava / Fecha Competência de Folha com log de auditoria
 */
export async function closePayrollPeriodFirestore(
  companyId: string, 
  periodId: string, 
  userName: string,
  userEmail: string
): Promise<void> {
  if (!companyId || !periodId) throw new Error('Empresa e competência são obrigatórias para fechar a folha.');
  const ref = doc(db, COLLECTION_PERIODS, periodId);
  const current = await getDoc(ref);
  if (!current.exists()) throw new Error('Competência de folha não encontrada.');
  const data = current.data() as any;
  if (String(data.companyId || data.empresaId || '') !== companyId) throw new Error('Competência não pertence à empresa informada.');
  if (data.status !== 'Aberto') throw new Error('Somente uma competência aberta pode ser fechada.');
  const closedAt = new Date().toISOString();
  await updateDoc(ref, {
    status: 'Fechado',
    closedAt,
    closedBy: userName,
    updatedAt: closedAt
  });

  await logPayrollAuditFirestore(
    companyId,
    periodId,
    'Fechamento de Folha',
    userEmail,
    userName,
    `Competência ${periodId} foi travada e fechada com sucesso.`
  );
}

/**
 * Reabre Competência com justificativa obrigatória e auditoria
 */
export async function reopenPayrollPeriodFirestore(
  companyId: string,
  periodId: string,
  userName: string,
  userEmail: string,
  reason: string
): Promise<void> {
  if (!companyId || !periodId) throw new Error('Empresa e competência são obrigatórias para reabrir a folha.');
  if (!reason || !reason.trim()) throw new Error('Justificativa de reabertura é obrigatória.');
  const ref = doc(db, COLLECTION_PERIODS, periodId);
  const current = await getDoc(ref);
  if (!current.exists()) throw new Error('Competência de folha não encontrada.');
  const data = current.data() as any;
  if (String(data.companyId || data.empresaId || '') !== companyId) throw new Error('Competência não pertence à empresa informada.');
  if (data.status !== 'Fechado') throw new Error('Somente uma competência fechada pode ser reaberta.');
  const reopenedAt = new Date().toISOString();
  await updateDoc(ref, {
    status: 'Aberto',
    reopenedAt,
    reopenedBy: userName,
    reopenReason: reason,
    updatedAt: reopenedAt
  });

  await logPayrollAuditFirestore(
    companyId,
    periodId,
    'Reabertura de Folha',
    userEmail,
    userName,
    `Competência ${periodId} reaberta. Motivo: ${reason}`
  );
}

/**
 * Carrega Holerites do Firestore
 */
export async function getPaystubsFirestore(companyId: string, periodId?: string): Promise<Paystub[]> {
  try {
    let q;
    if (periodId) {
      q = query(
        collection(db, COLLECTION_PAYSTUBS),
        where('companyId', '==', companyId),
        where('periodId', '==', periodId)
      );
    } else {
      q = query(
        collection(db, COLLECTION_PAYSTUBS),
        where('companyId', '==', companyId)
      );
    }
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({
        id: d.id,
        ...(sanitizeFirestoreData(d.data()) as Record<string, any>)
      })) as Paystub[];
    }
  } catch (err) {
    console.warn('[Payroll] Erro ao carregar holerites do Firestore:', err);
  }

  return [];
}

/**
 * Salva ou atualiza um Holerite no Firestore
 */
export async function savePaystubFirestore(companyId: string, stub: Paystub): Promise<void> {
  const data = {
    ...stub,
    companyId
  };
  await setDoc(doc(db, COLLECTION_PAYSTUBS, stub.id), data, { merge: true });
}

/**
 * Assina Digitalmente um Holerite no Firestore
 */
export async function signPaystubFirestore(
  companyId: string,
  paystubId: string,
  userIp: string,
  userName: string,
  userEmail: string
): Promise<Paystub | null> {
  const ref = doc(db, COLLECTION_PAYSTUBS, paystubId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const current = snap.data() as Paystub;
  const paystubTenant = String((current as any).companyId || (current as any).empresaId || '').trim();
  if (!paystubTenant || paystubTenant !== companyId) throw new Error('Holerite não pertence à empresa informada.');
  const timestamp = new Date().toISOString();
  const hash = generateDigitalHash(paystubId, current.cpf, timestamp);

  const updated: Paystub = {
    ...current,
    statusAssinatura: 'Assinado Digitalmente',
    dataAssinatura: timestamp,
    hashDigital: hash,
    ipAssinatura: userIp
  };

  await setDoc(ref, updated, { merge: true });

  await logPayrollAuditFirestore(
    companyId,
    current.periodId,
    'Assinatura Digital de Holerite',
    userEmail,
    userName,
    `Holerite do colaborador ${current.employeeName} assinado digitalmente. Hash: ${hash}`
  );

  return updated;
}

/**
 * Log de Auditoria no Firestore
 */
export async function logPayrollAuditFirestore(
  companyId: string,
  periodId: string | undefined,
  action: string,
  userEmail: string,
  userName: string,
  details: string
): Promise<void> {
  try {
    const log: Omit<PayrollAuditLog, 'id'> = {
      companyId,
      periodId: periodId || 'N/A',
      action,
      userEmail: userEmail || '',
      userName: userName || 'Sistema RH TRANSFORMA',
      details,
      timestamp: new Date().toISOString()
    };
    await addDoc(collection(db, COLLECTION_AUDIT), log);
  } catch (err) {
    console.error('[Payroll] Erro ao gravar log de auditoria:', err);
  }
}

/**
 * Carrega Logs de Auditoria do Firestore
 */
export async function getPayrollAuditLogsFirestore(companyId: string): Promise<PayrollAuditLog[]> {
  try {
    const q = query(
      collection(db, COLLECTION_AUDIT),
      where('companyId', '==', companyId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const logs = snap.docs.map(d => ({
        id: d.id,
        ...(sanitizeFirestoreData(d.data()) as Record<string, any>)
      })) as PayrollAuditLog[];
      logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return logs;
    }
  } catch (err) {
    console.warn('[Payroll] Erro ao buscar audit logs:', err);
  }
  return [];
}

/**
 * Busca Tabelas Tributárias (INSS / IRRF / Sal. Mínimo / Alíquotas)
 */
export async function getTaxTablesFirestore(companyId: string): Promise<TaxTableVersion[]> {
  try {
    const q = query(
      collection(db, COLLECTION_TAX_TABLES),
      where('companyId', 'in', [companyId, 'default'])
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({
        id: d.id,
        ...(sanitizeFirestoreData(d.data()) as Record<string, any>)
      })) as TaxTableVersion[];
    }
  } catch (err) {
    console.warn('[Payroll] Erro ao buscar tabelas tributarias:', err);
  }
  return [{ ...DEFAULT_TAX_TABLE_2026, companyId }];
}

/**
 * Salva Tabela Tributária
 */
export async function saveTaxTableFirestore(companyId: string, table: TaxTableVersion): Promise<void> {
  const data = {
    ...table,
    companyId
  };
  await setDoc(doc(db, COLLECTION_TAX_TABLES, table.id), data, { merge: true });
}

/**
 * Busca Catálogo de Rúbricas / Eventos
 */
export async function getRubricCatalogFirestore(companyId: string): Promise<RubricDefinition[]> {
  try {
    const q = query(
      collection(db, COLLECTION_RUBRICS),
      where('companyId', 'in', [companyId, 'default'])
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({
        id: d.id,
        ...(sanitizeFirestoreData(d.data()) as Record<string, any>)
      })) as RubricDefinition[];
    }
  } catch (err) {
    console.warn('[Payroll] Erro ao carregar rúbricas do Firestore:', err);
  }
  return DEFAULT_RUBRICS.map(r => ({ ...r, companyId }));
}

/**
 * Salva ou edita Rúbrica no Catálogo
 */
export async function saveRubricFirestore(companyId: string, rubric: RubricDefinition): Promise<void> {
  const docId = rubric.id || `rubric-${rubric.code}`;
  const data = {
    ...rubric,
    id: docId,
    companyId
  };
  await setDoc(doc(db, COLLECTION_RUBRICS, docId), data, { merge: true });
}

/**
 * Validação de Inconsistências pré-fechamento da Folha
 */
export async function validatePayrollPeriodFirestore(
  companyId: string,
  periodId: string
): Promise<PayrollValidationResult> {
  const colaboradores = await getColaboradoresFirestore(companyId);
  const stubs = await getPaystubsFirestore(companyId, periodId);

  const warnings: string[] = [];
  const errors: string[] = [];
  const employeesMissingSalary: string[] = [];
  const employeesWithPendingAbsences: string[] = [];

  for (const colab of colaboradores) {
    const sal = colab.profissionais?.salarioBase || 0;
    if (sal <= 0) {
      employeesMissingSalary.push(colab.nomeCompleto);
      errors.push(`Colaborador(a) ${colab.nomeCompleto} não possui salário base cadastrado.`);
    }
    if (!String(colab.pessoais?.cpf || '').trim()) {
      errors.push(`Colaborador(a) ${colab.nomeCompleto} não possui CPF cadastrado.`);
    }
    if (!String(colab.profissionais?.dataAdmissao || '').trim()) {
      errors.push(`Colaborador(a) ${colab.nomeCompleto} não possui data de admissão cadastrada.`);
    }
  }

  const unsignedCount = stubs.filter(s => s.statusAssinatura !== 'Assinado Digitalmente').length;
  if (unsignedCount > 0) {
    warnings.push(`Existem ${unsignedCount} holerites aguardando assinatura digital dos colaboradores.`);
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    totalEmployeesToCheck: colaboradores.length,
    employeesMissingSalary,
    employeesWithPendingAbsences
  };
}

/**
 * MOTOR DE PROCESSAMENTO AUTOMATIZADO 100% DE FOLHA DE PAGAMENTO
 * Cruza dados de Colaboradores, Benefícios, Férias, Rescisões e Ponto Digital para recalcular a competência inteira.
 */
export async function processBatchPayrollFirestore(
  companyId: string,
  referenceMonth: string,
  type: PayrollType = 'Mensal',
  userName: string = 'Administrador DP',
  userEmail: string = 'dp@maisrh.com.br'
): Promise<{ period: PayrollPeriod; paystubs: Paystub[] }> {

  const [yearStr, monthStr] = referenceMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const periodId = `per-${year}-${monthStr}`;

  // 1. Busca Colaboradores Ativos da Empresa
  const colaboradores = await getColaboradoresFirestore(companyId);
  const activeColabs = colaboradores.filter(c => c.profissionais?.status !== 'Rescindido');

  // 2. Busca Benefícios, Férias, Rescisões, Lançamentos Variáveis, Pensão, Empréstimos e Registros do Ponto Digital
  const [beneficios, feriasList, rescisoes, variablePayList, alimonyList, loansList] = await Promise.all([
    getBeneficiosFirestore(companyId),
    getFeriasFirestore(companyId),
    getRescisoesFirestore(companyId),
    getVariablePayFirestore(companyId, referenceMonth),
    getAlimonyFirestore(companyId),
    getLoansFirestore(companyId)
  ]);

  // Carrega Ponto Digital (registros_ponto) do mês de referência
  let pontoRegistros: any[] = [];
  try {
    const qPonto = query(
      collection(db, COLLECTION_PONTO_REGISTROS),
      where('empresaId', '==', companyId)
    );
    const snapPonto = await getDocs(qPonto);
    if (!snapPonto.empty) {
      pontoRegistros = snapPonto.docs
        .map(d => ({ id: d.id, ...(sanitizeFirestoreData(d.data()) as any) }))
        .filter(r => (r.data || '').startsWith(referenceMonth));
    }
  } catch (err) {
    console.warn('[Payroll] Erro ao carregar registros de ponto para a folha:', err);
  }

  const newPaystubs: Paystub[] = [];

  for (const colab of activeColabs) {
    const cAny = colab as any;
    const stubId = `stub-${year}-${monthStr}-${colab.id}`;
    const salarioBase = Number(colab.profissionais?.salarioBase || 0);
    const cargo = String(colab.profissionais?.cargo || '').trim();
    const departamento = String(colab.profissionais?.departamento || '').trim();
    const admissaoDate = String(colab.profissionais?.dataAdmissao || '').trim();
    const cpf = String(colab.pessoais?.cpf || '').trim();
    const dependentsCount = colab.trabalhistas?.dependentesCount || 0;

    if (!Number.isFinite(salarioBase) || salarioBase <= 0) throw new Error(`Folha não processada: ${colab.nomeCompleto} está sem salário base válido.`);
    if (!cpf) throw new Error(`Folha não processada: ${colab.nomeCompleto} está sem CPF.`);
    if (!admissaoDate) throw new Error(`Folha não processada: ${colab.nomeCompleto} está sem data de admissão.`);

    // Itens da Folha
    const items: PaystubItem[] = [
      {
        id: `item-${Date.now()}-base`,
        code: '1001',
        name: 'Salário Base',
        type: 'Provento',
        reference: '30 dias',
        amount: salarioBase,
        origin: 'cadastro',
        calculationMemory: { baseValue: salarioBase, notes: 'Salário contratual mensal' }
      }
    ];

    let totalProventos = salarioBase;

    // --- IMPORTAÇÃO DO PONTO DIGITAL ---
    const colabPonto = pontoRegistros.filter(p => p.funcionarioId === colab.id || p.cpf === cpf);
    const totalHE50Min = colabPonto.reduce((acc, p) => acc + (p.horasExtras50Minutos || p.horasExtrasMinutos || 0), 0);
    const totalHE100Min = colabPonto.reduce((acc, p) => acc + (p.horasExtras100Minutos || 0), 0);
    const totalHE140Min = colabPonto.reduce((acc, p) => acc + (p.horasExtras140Minutos || 0), 0);
    const totalNightMin = colabPonto.reduce((acc, p) => acc + (p.adicionalNoturnoMinutos || 0), 0);
    const totalAbsenceMin = colabPonto.reduce((acc, p) => acc + (p.faltasMinutos || 0) + (p.atrasoMinutos || 0), 0);

    const valorHoraBase = salarioBase / 220;

    // Horas Extras 50%
    if (totalHE50Min > 0) {
      const horas50 = totalHE50Min / 60;
      const val50 = Number((valorHoraBase * 1.5 * horas50).toFixed(2));
      totalProventos += val50;
      items.push({
        id: `item-${Date.now()}-he50`,
        code: '1002',
        name: 'Horas Extras 50%',
        type: 'Provento',
        reference: `${horas50.toFixed(1)} hrs`,
        amount: val50,
        origin: 'ponto',
        calculationMemory: { baseValue: salarioBase, rateUsed: 1.5, notes: 'Importado do Ponto Digital (50%)' }
      });
    }

    // Horas Extras 100%
    if (totalHE100Min > 0) {
      const horas100 = totalHE100Min / 60;
      const val100 = Number((valorHoraBase * 2.0 * horas100).toFixed(2));
      totalProventos += val100;
      items.push({
        id: `item-${Date.now()}-he100`,
        code: '1003',
        name: 'Horas Extras 100%',
        type: 'Provento',
        reference: `${horas100.toFixed(1)} hrs`,
        amount: val100,
        origin: 'ponto',
        calculationMemory: { baseValue: salarioBase, rateUsed: 2.0, notes: 'Importado do Ponto Digital (100% Domingo/Feriado)' }
      });
    }

    // Horas Extras 140% (Convenção Especial)
    if (totalHE140Min > 0) {
      const horas140 = totalHE140Min / 60;
      const val140 = Number((valorHoraBase * 2.4 * horas140).toFixed(2));
      totalProventos += val140;
      items.push({
        id: `item-${Date.now()}-he140`,
        code: '1009',
        name: 'Horas Extras 140% (Convenção)',
        type: 'Provento',
        reference: `${horas140.toFixed(1)} hrs`,
        amount: val140,
        origin: 'ponto',
        calculationMemory: { baseValue: salarioBase, rateUsed: 2.4, notes: 'Importado do Ponto Digital (140%)' }
      });
    }

    // Adicional Noturno
    if (totalNightMin > 0) {
      const horasNoturnas = totalNightMin / 60;
      const valNoturno = Number((valorHoraBase * 0.20 * horasNoturnas).toFixed(2));
      totalProventos += valNoturno;
      items.push({
        id: `item-${Date.now()}-noturno`,
        code: '1004',
        name: 'Adicional Noturno (20%)',
        type: 'Provento',
        reference: `${horasNoturnas.toFixed(1)} hrs`,
        amount: valNoturno,
        origin: 'ponto',
        calculationMemory: { baseValue: salarioBase, rateUsed: 0.20, notes: 'Importado do Ponto Digital (Noturno 22h-05h)' }
      });
    }

    // Reflexo DSR sobre Horas Extras / Noturno
    const totalVariaceovertime = items
      .filter(i => i.origin === 'ponto' && i.type === 'Provento')
      .reduce((a, b) => a + b.amount, 0);

    if (totalVariaceovertime > 0) {
      const dsrVal = calculateDSR(totalVariaceovertime, 25, 5);
      if (dsrVal > 0) {
        totalProventos += dsrVal;
        items.push({
          id: `item-${Date.now()}-dsr`,
          code: '1007',
          name: 'DSR sobre Horas Extras e Adicionais',
          type: 'Provento',
          reference: '25d / 5d',
          amount: dsrVal,
          origin: 'ponto',
          calculationMemory: { baseValue: totalVariaceovertime, notes: 'Descanso Semanal Remunerado s/ variáveis' }
        });
      }
    }

    // Insalubridade
    if (cAny.trabalhistas?.insalubridadeDegree) {
      const valInsalubridade = calculateInsalubridade(cAny.trabalhistas.insalubridadeDegree as any);
      totalProventos += valInsalubridade;
      items.push({
        id: `item-${Date.now()}-insalubridade`,
        code: '1005',
        name: `Adicional de Insalubridade (${cAny.trabalhistas.insalubridadeDegree})`,
        type: 'Provento',
        reference: cAny.trabalhistas.insalubridadeDegree,
        amount: valInsalubridade,
        origin: 'cadastro',
        calculationMemory: { baseValue: DEFAULT_TAX_TABLE_2026.minimumWage, rateUsed: 0.20, notes: 'Grau médio s/ salário mínimo' }
      });
    }

    // Periculosidade (30%)
    if (cAny.trabalhistas?.periculosidade) {
      const valPeric = calculatePericulosidade(salarioBase);
      totalProventos += valPeric;
      items.push({
        id: `item-${Date.now()}-peric`,
        code: '1006',
        name: 'Adicional de Periculosidade (30%)',
        type: 'Provento',
        reference: '30% Base',
        amount: valPeric,
        origin: 'cadastro',
        calculationMemory: { baseValue: salarioBase, rateUsed: 0.30, notes: '30% sobre o salário base' }
      });
    }

    // Lançamentos Variáveis (Comissões, Prêmios, Bônus)
    const colabVars = variablePayList.filter(v => v.employeeId === colab.id && v.aprovacao === 'aprovado');
    for (const v of colabVars) {
      totalProventos += v.valor;
      items.push({
        id: `item-${Date.now()}-var-${v.variablePayId}`,
        code: '1008',
        name: `Comissão / Variável (${v.tipo.toUpperCase()})`,
        type: 'Provento',
        reference: v.origem || 'Variável',
        amount: v.valor,
        origin: 'importacao',
        calculationMemory: { baseValue: v.valor, notes: `Aprovado por ${v.responsavel || 'RH'}` }
      });
    }

    // --- DESCONTOS ---

    // Faltas / Atrasos do Ponto
    if (totalAbsenceMin > 0) {
      const horasFalta = totalAbsenceMin / 60;
      const descFaltas = Number((valorHoraBase * horasFalta).toFixed(2));
      if (descFaltas > 0) {
        items.push({
          id: `item-${Date.now()}-faltas`,
          code: '5006',
          name: 'Faltas e Atrasos Não Justificados',
          type: 'Desconto',
          reference: `${horasFalta.toFixed(1)} hrs`,
          amount: descFaltas,
          origin: 'ponto',
          calculationMemory: { baseValue: salarioBase, notes: 'Importado do Ponto Digital' }
        });
      }
    }

    // Benefícios (VT / VR)
    const colabBens = beneficios.filter(b =>
      (b as any).colaboradorId === colab.id && (b as any).status === 'Ativo'
    );
    for (const b of colabBens) {
      const bAny = b as any;
      const bNome = (bAny.nomeBeneficio || bAny.nome || '').toLowerCase();
      if (bNome.includes('vale transporte') || bAny.tipo === 'VT') {
        const vtDesc = Number((salarioBase * 0.06).toFixed(2));
        if (vtDesc > 0) {
          items.push({
            id: `item-${Date.now()}-vt`,
            code: '5003',
            name: 'Vale Transporte (Coparticipação até 6%)',
            type: 'Desconto',
            reference: '6,0%',
            amount: vtDesc,
            origin: 'beneficio'
          });
        }
      } else if (bNome.includes('refeição') || bAny.tipo === 'VR') {
        const baseVr = Number(bAny.valorMensalEmpresa || bAny.valorMensal || bAny.valor || 0);
        if (!Number.isFinite(baseVr) || baseVr <= 0) continue;
        const vrDesc = Number((baseVr * 0.20).toFixed(2));
        items.push({
          id: `item-${Date.now()}-vr`,
          code: '5004',
          name: 'Vale Refeição (Coparticipação)',
          type: 'Desconto',
          reference: 'Copart.',
          amount: vrDesc,
          origin: 'beneficio'
        });
      }
    }

    // Pensão Alimentícia Judicial
    let pensaoTotal = cAny.trabalhistas?.pensaoAlimenticiaValue || 0;
    const colabAlimony = alimonyList.filter(a => a.employeeId === colab.id && a.status === 'Ativo');
    for (const al of colabAlimony) {
      if (al.tipoCalculo === 'valor_fixo') {
        pensaoTotal += al.valorOuPercentual;
      } else if (al.tipoCalculo === 'percentual_liquido' || al.tipoCalculo === 'percentual_bruto') {
        pensaoTotal += Number((totalProventos * (al.valorOuPercentual / 100)).toFixed(2));
      }
    }

    if (pensaoTotal > 0) {
      items.push({
        id: `item-${Date.now()}-pensao`,
        code: '5005',
        name: 'Pensão Alimentícia (Judicial)',
        type: 'Desconto',
        reference: 'Judicial',
        amount: pensaoTotal,
        origin: 'manual'
      });
    }

    // Consignados / Empréstimos
    const colabLoans = loansList.filter(l => l.employeeId === colab.id && l.status === 'Ativo');
    for (const loan of colabLoans) {
      if (loan.valorParcela > 0) {
        items.push({
          id: `item-${Date.now()}-loan-${loan.loanId}`,
          code: '5009',
          name: `Empréstimo Consignado (${loan.instituicao})`,
          type: 'Desconto',
          reference: `Parc. ${loan.parcelasPagas + 1}/${loan.totalParcelas}`,
          amount: loan.valorParcela,
          origin: 'manual',
          calculationMemory: { baseValue: loan.saldoDevedor, notes: `Contrato ${loan.contratoNumero}` }
        });
      }
    }

    // Cálculo INSS Progressivo
    const inssCalc = calculateINSS(totalProventos);
    items.push({
      id: `item-${Date.now()}-inss`,
      code: '5001',
      name: 'INSS (Previdência Social)',
      type: 'Desconto',
      reference: `${inssCalc.effectiveRate}%`,
      amount: inssCalc.amount,
      origin: 'cadastro',
      calculationMemory: { baseValue: inssCalc.base, rateUsed: inssCalc.effectiveRate, notes: 'Alíquota progressiva oficial 2026' }
    });

    // Cálculo IRRF
    const irrfCalc = calculateIRRF(totalProventos, inssCalc.amount, dependentsCount, pensaoTotal);
    items.push({
      id: `item-${Date.now()}-irrf`,
      code: '5002',
      name: 'IRRF (Imposto de Renda)',
      type: 'Desconto',
      reference: `${irrfCalc.ratePercent}%`,
      amount: irrfCalc.amount,
      origin: 'cadastro',
      calculationMemory: { baseValue: irrfCalc.base, rateUsed: irrfCalc.ratePercent, notes: 'Com abatimento legal de dependentes e pensão' }
    });

    // Informativos FGTS
    const fgtsCalc = calculateFGTS(totalProventos);
    items.push({
      id: `item-${Date.now()}-base-fgts`,
      code: '9001',
      name: 'Base do FGTS (Informativa)',
      type: 'Informativa',
      reference: 'Base',
      amount: totalProventos,
      origin: 'cadastro'
    });
    items.push({
      id: `item-${Date.now()}-fgts`,
      code: '9002',
      name: 'FGTS do Mês (8% Informativo)',
      type: 'Informativa',
      reference: '8,0%',
      amount: fgtsCalc.amount,
      origin: 'cadastro'
    });

    // Totais do Holerite
    const totalDescontos = Number(
      items.filter(i => i.type === 'Desconto' || i.type === 'desconto').reduce((acc, i) => acc + i.amount, 0).toFixed(2)
    );
    const valorLiquido = Number((totalProventos - totalDescontos).toFixed(2));
    const employer = calculateEmployerCharges(totalProventos);

    const paystub: Paystub = {
      id: stubId,
      companyId,
      empresaId: companyId,
      periodId,
      periodName: `Folha ${type} - ${monthStr}/${year}`,
      employeeId: colab.id,
      employeeName: colab.nomeCompleto,
      cpf,
      cargo,
      departamento,
      admissaoDate,
      salarioBase,
      diasTrabalhados: 30,
      dependentsCount,
      pensaoAlimenticiaValue: pensaoTotal,
      items,
      totalProventos: Number(totalProventos.toFixed(2)),
      totalDescontos,
      valorLiquido,
      baseINSS: inssCalc.base,
      valorINSS: inssCalc.amount,
      baseIRRF: irrfCalc.base,
      valorIRRF: irrfCalc.amount,
      baseFGTS: fgtsCalc.base,
      valorFGTS: fgtsCalc.amount,
      employerCharges: employer,
      statusAssinatura: 'Pendente'
    };

    newPaystubs.push(paystub);
    await savePaystubFirestore(companyId, paystub);

    // Gerar registro de Pagamento Bancário
    await savePayrollPaymentFirestore(companyId, {
      paymentId: `pay-${stubId}`,
      payrollPeriodId: periodId,
      employeeId: colab.id,
      employeeName: colab.nomeCompleto,
      companyId,
      valor: valorLiquido,
      banco: (colab.trabalhistas as any)?.banco || '',
      agencia: (colab.trabalhistas as any)?.agencia || '0001',
      conta: (colab.trabalhistas as any)?.conta || '12345-6',
      pixKey: (colab.trabalhistas as any)?.chavePix || cpf,
      forma: 'PIX',
      status: 'pendente'
    });
  }

  // Consolidação dos Totais do Período
  const totalGross = newPaystubs.reduce((a, s) => a + s.totalProventos, 0);
  const totalDiscounts = newPaystubs.reduce((a, s) => a + s.totalDescontos, 0);
  const totalNet = newPaystubs.reduce((a, s) => a + s.valorLiquido, 0);
  const totalFGTS = newPaystubs.reduce((a, s) => a + s.valorFGTS, 0);
  const totalPatronal = newPaystubs.reduce((a, s) => a + s.employerCharges.totalPatronal, 0);

  const period: PayrollPeriod = {
    id: periodId,
    payrollPeriodId: periodId,
    companyId,
    empresaId: companyId,
    referenceMonth,
    year,
    month,
    type,
    status: 'aberta',
    dataInicial: `${referenceMonth}-01`,
    dataFinal: `${referenceMonth}-30`,
    dataDePagamento: `${referenceMonth}-05`,
    totalEmployees: newPaystubs.length,
    totalGross: Number(totalGross.toFixed(2)),
    totalDiscounts: Number(totalDiscounts.toFixed(2)),
    totalNet: Number(totalNet.toFixed(2)),
    totalFGTS: Number(totalFGTS.toFixed(2)),
    totalPatronal: Number(totalPatronal.toFixed(2)),
    paystubsCount: newPaystubs.length,
    paystubsSignedCount: 0,
    versionNumber: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await savePayrollPeriodFirestore(companyId, period);

  await logPayrollAuditFirestore(
    companyId,
    periodId,
    'Processamento Automatizado de Folha',
    userEmail,
    userName,
    `Folha de pagamento ${referenceMonth} (${type}) reprocessada com sucesso para ${newPaystubs.length} colaboradores com integração completa ao Ponto Digital e Benefícios.`
  );

  return { period, paystubs: newPaystubs };
}

/**
 * Busca/Gera Eventos eSocial
 */
export async function getESocialEventsFirestore(companyId: string): Promise<ESocialEvent[]> {
  try {
    const q = query(
      collection(db, COLLECTION_ESOCIAL),
      where('companyId', '==', companyId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({
        id: d.id,
        ...(sanitizeFirestoreData(d.data()) as Record<string, any>)
      })) as ESocialEvent[];
    }
  } catch (err) {
    console.warn('[Payroll] Erro ao carregar eventos eSocial:', err);
  }
  return [];
}


/** Persiste eventos eSocial da empresa no Firestore. */
export async function saveESocialEventsFirestore(companyId: string, events: ESocialEvent[]): Promise<void> {
  const normalizedCompanyId = companyId.trim();
  if (!normalizedCompanyId) throw new Error('empresaId é obrigatório para salvar eventos eSocial.');
  await Promise.all(events.map(event => {
    const id = event.id || `esocial-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return setDoc(doc(db, COLLECTION_ESOCIAL, id), sanitizeFirestoreData({
      ...event,
      id,
      companyId: normalizedCompanyId,
      empresaId: normalizedCompanyId,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  }));
}
