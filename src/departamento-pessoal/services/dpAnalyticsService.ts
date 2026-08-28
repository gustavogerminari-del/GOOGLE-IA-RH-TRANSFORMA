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
  ReportTemplateModel, 
  ScheduledReportModel, 
  ReportJobModel, 
  DPAlertItem, 
  DPGlobalFilterState, 
  ColaboradorCompleto, 
  ItemBeneficio, 
  RegistroFeriasColaborador, 
  AfastamentoColaborador, 
  CalculoRescisorio, 
  DocumentoColaborador, 
  AjustePontoColaborador, 
  AdmissaoPending 
} from '../types/dp';
import { Paystub, PayrollPeriod } from '../../payroll/types/payroll';

// Firestore Collection Constants
export const ANALYTICS_COLLECTIONS = {
  REPORT_TEMPLATES: 'report_templates',
  SCHEDULED_REPORTS: 'scheduled_reports',
  REPORT_JOBS: 'report_jobs',
  DP_ALERTS: 'alertas_dp',
  DASHBOARD_METRICS: 'dashboard_metrics',
  MONTHLY_METRICS: 'monthly_metrics',
  AUDIT_LOGS: 'payroll_audit_logs'
} as const;

// Default initial templates for DP Reports
export const DEFAULT_REPORT_TEMPLATES: ReportTemplateModel[] = [
  {
    id: 'tpl-headcount-std',
    companyId: 'default',
    name: 'Quadro Geral de Colaboradores (Headcount)',
    description: 'Relação completa de ativos, cargos, departamentos, admissão e salários.',
    dataSource: 'colaboradores',
    selectedFields: ['nomeCompleto', 'cpf', 'cargo', 'departamento', 'unidade', 'salarioBase', 'dataAdmissao', 'status'],
    filters: {},
    grouping: 'departamento',
    sorting: 'nomeCompleto',
    visibility: 'company',
    createdBy: 'Sistema RH TRANSFORMA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl-custos-folha',
    companyId: 'default',
    name: 'Relatório Analítico de Custos de Folha',
    description: 'Apurativo de salários, encargos patronais (35%), benefícios e custos totais.',
    dataSource: 'custos',
    selectedFields: ['colaborador', 'cargo', 'departamento', 'salarioBase', 'encargos35', 'beneficios', 'custoTotal'],
    filters: {},
    grouping: 'departamento',
    sorting: 'custoTotal',
    visibility: 'finance',
    createdBy: 'Sistema RH TRANSFORMA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl-ferias-provisoes',
    companyId: 'default',
    name: 'Mapa de Férias & Provisões Financeiras',
    description: 'Dias de saldo acumulado, prazos limite de concessão e provisão de 1/3.',
    dataSource: 'ferias',
    selectedFields: ['colaboradorNome', 'cargo', 'departamento', 'diasSaldo', 'status', 'previsaoUmTerco'],
    filters: {},
    grouping: 'status',
    sorting: 'diasSaldo',
    visibility: 'rh',
    createdBy: 'Sistema RH TRANSFORMA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl-turnover-rescisoes',
    companyId: 'default',
    name: 'Relatório de Turnover e Desligamentos',
    description: 'Análise de admissões, desligamentos, motivos de rescisão e verbas pagas.',
    dataSource: 'rescisoes',
    selectedFields: ['colaboradorNome', 'tipoRescisao', 'dataDesligamento', 'avisoPrevio', 'valorLiquidoRescisao'],
    filters: {},
    grouping: 'tipoRescisao',
    sorting: 'dataDesligamento',
    visibility: 'rh',
    createdBy: 'Sistema RH TRANSFORMA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl-diversidade-lgpd',
    companyId: 'default',
    name: 'Perfil Demográfico & Diversidade (Agregado LGPD)',
    description: 'Estatísticas agregadas por faixa etária, gênero e tempo de casa.',
    dataSource: 'diversidade',
    selectedFields: ['faixaEtaria', 'genero', 'escolaridade', 'totalColaboradores', 'percentual'],
    filters: {},
    grouping: 'faixaEtaria',
    sorting: 'totalColaboradores',
    visibility: 'company',
    createdBy: 'Sistema RH TRANSFORMA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Default initial alerts
export const DEFAULT_INITIAL_ALERTS: Omit<DPAlertItem, 'id'>[] = [
  {
    companyId: '',
    category: 'Critico',
    title: 'Período Aquisitivo de Férias Vencido (Dobro legal)',
    description: '2 colaboradores possuem saldo de férias vencido ultrapassando o período concessivo.',
    originModule: 'ferias',
    assignedTo: 'Equipe DP',
    status: 'Pendente',
    createdAt: new Date().toISOString()
  },
  {
    companyId: '',
    category: 'Alto',
    title: 'Exame Médico Ocupacional (ASO) Vencendo',
    description: '3 colaboradores possuem exame periódico a vencer nos próximos 15 dias.',
    originModule: 'documentos',
    assignedTo: 'Saúde Ocupacional',
    status: 'Pendente',
    createdAt: new Date().toISOString()
  },
  {
    companyId: '',
    category: 'Medio',
    title: 'Término de Contrato de Experiência (90 dias)',
    description: '1 colaborador atinge o limite do 2º período de experiência esta semana.',
    originModule: 'admissoes',
    assignedTo: 'Gestor Direto',
    status: 'Em Andamento',
    createdAt: new Date().toISOString()
  }
];

// ==========================================
// 1. TEMPLATES DE RELATÓRIO
// ==========================================

export async function getReportTemplatesFirestore(companyId: string): Promise<ReportTemplateModel[]> {
  try {
    const q = query(
      collection(db, ANALYTICS_COLLECTIONS.REPORT_TEMPLATES),
      where('companyId', 'in', [companyId, 'default'])
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({
        id: d.id,
        ...(sanitizeFirestoreData(d.data()) as Record<string, any>)
      })) as ReportTemplateModel[];
    }
  } catch (err) {
    console.warn('[Analytics] Erro ao carregar modelos de relatórios do Firestore:', err);
  }

  // Fallback initial templates
  const initial = DEFAULT_REPORT_TEMPLATES.map(t => ({ ...t, companyId }));
  for (const tpl of initial) {
    try {
      await setDoc(doc(db, ANALYTICS_COLLECTIONS.REPORT_TEMPLATES, tpl.id), tpl, { merge: true });
    } catch (e) {
      // ignore
    }
  }
  return initial;
}

export async function saveReportTemplateFirestore(companyId: string, template: ReportTemplateModel): Promise<void> {
  const docId = template.id || `tpl-${Date.now()}`;
  const data = {
    ...template,
    id: docId,
    companyId,
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, ANALYTICS_COLLECTIONS.REPORT_TEMPLATES, docId), data, { merge: true });
}

export async function deleteReportTemplateFirestore(templateId: string): Promise<void> {
  await deleteDoc(doc(db, ANALYTICS_COLLECTIONS.REPORT_TEMPLATES, templateId));
}

// ==========================================
// 2. AGENDAMENTOS DE RELATÓRIO
// ==========================================

export async function getScheduledReportsFirestore(companyId: string): Promise<ScheduledReportModel[]> {
  try {
    const q = query(
      collection(db, ANALYTICS_COLLECTIONS.SCHEDULED_REPORTS),
      where('companyId', '==', companyId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({
        id: d.id,
        ...(sanitizeFirestoreData(d.data()) as Record<string, any>)
      })) as ScheduledReportModel[];
    }
  } catch (err) {
    console.warn('[Analytics] Erro ao carregar agendamentos do Firestore:', err);
  }
  return [];
}

export async function saveScheduledReportFirestore(companyId: string, item: ScheduledReportModel): Promise<void> {
  const docId = item.id || `sched-${Date.now()}`;
  const data = {
    ...item,
    id: docId,
    companyId
  };
  await setDoc(doc(db, ANALYTICS_COLLECTIONS.SCHEDULED_REPORTS, docId), data, { merge: true });
}

export async function deleteScheduledReportFirestore(scheduledId: string): Promise<void> {
  await deleteDoc(doc(db, ANALYTICS_COLLECTIONS.SCHEDULED_REPORTS, scheduledId));
}

// ==========================================
// 3. JOBS E HISTÓRICO DE EXPORTAÇÃO
// ==========================================

export async function getReportJobsFirestore(companyId: string): Promise<ReportJobModel[]> {
  try {
    const q = query(
      collection(db, ANALYTICS_COLLECTIONS.REPORT_JOBS),
      where('companyId', '==', companyId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...(sanitizeFirestoreData(d.data()) as Record<string, any>)
      })) as ReportJobModel[];
      list.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
      return list;
    }
  } catch (err) {
    console.warn('[Analytics] Erro ao carregar histórico de jobs:', err);
  }
  return [];
}

export async function saveReportJobFirestore(companyId: string, job: ReportJobModel): Promise<void> {
  const data = {
    ...job,
    companyId
  };
  await setDoc(doc(db, ANALYTICS_COLLECTIONS.REPORT_JOBS, job.id), data, { merge: true });
}

// ==========================================
// 4. ALERTAS E PENDÊNCIAS UNIFICADAS
// ==========================================

export async function getDPAlertsFirestore(companyId: string): Promise<DPAlertItem[]> {
  try {
    const q = query(
      collection(db, ANALYTICS_COLLECTIONS.DP_ALERTS),
      where('companyId', '==', companyId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...(sanitizeFirestoreData(d.data()) as Record<string, any>)
      })) as DPAlertItem[];
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return list;
    }
  } catch (err) {
    console.warn('[Analytics] Erro ao carregar alertas do Firestore:', err);
  }

  return [];
}

export async function updateDPAlertStatusFirestore(
  alertId: string,
  status: 'Pendente' | 'Em Andamento' | 'Resolvido' | 'Ignorado',
  userName?: string,
  ignoreReason?: string
): Promise<void> {
  const ref = doc(db, ANALYTICS_COLLECTIONS.DP_ALERTS, alertId);
  const updateData: any = {
    status,
    updatedAt: new Date().toISOString()
  };
  if (status === 'Resolvido' || status === 'Ignorado') {
    updateData.resolvedAt = new Date().toISOString();
    updateData.resolvedBy = userName || 'Usuário Sistema';
  }
  if (ignoreReason) {
    updateData.ignoreReason = ignoreReason;
  }
  await updateDoc(ref, updateData);
}

// ==========================================
// 5. EXPORTADORES REAIS (CSV, XLSX, PDF)
// ==========================================

export function exportDataToCSV(fileName: string, headers: string[], rows: (string | number)[][]): void {
  const csvRows = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
  ];
  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${fileName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportDataToXLSX(fileName: string, headers: string[], rows: (string | number)[][]): void {
  // Generates XML Spreadsheet 2003 / TSV formatted file compatible with Excel
  let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
  xml += '<Worksheet ss:Name="Relatorio_MAIS_RH"><Table>';
  
  // Header Row
  xml += '<Row>';
  headers.forEach(h => {
    xml += `<Cell><Data ss:Type="String">${String(h).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>`;
  });
  xml += '</Row>';

  // Data Rows
  rows.forEach(row => {
    xml += '<Row>';
    row.forEach(cell => {
      const isNum = typeof cell === 'number';
      const type = isNum ? 'Number' : 'String';
      xml += `<Cell><Data ss:Type="${type}">${String(cell ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>`;
    });
    xml += '</Row>';
  });

  xml += '</Table></Worksheet></Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDataToPDF(title: string, companyName: string, headers: string[], rows: (string | number)[][]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const formattedDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${title} - ${companyName}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; margin: 20px; font-size: 11px; line-height: 1.4; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
        .header h1 { margin: 0; font-size: 18px; color: #1e293b; text-transform: uppercase; font-weight: 900; }
        .header p { margin: 3px 0 0; color: #64748b; font-size: 10px; }
        .company-badge { font-weight: bold; color: #2563eb; background: #eff6ff; padding: 4px 8px; border-radius: 4px; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #f8fafc; color: #475569; font-weight: 800; text-align: left; padding: 8px 10px; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; font-size: 9px; }
        td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 8px; text-align: justify; display: flex; justify-content: space-between; color: #94a3b8; font-size: 9px; }
        @media print {
          body { margin: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>${title}</h1>
          <p>Relatório Gerencial Oficial de Departamento Pessoal • RH TRANSFORMA</p>
        </div>
        <div>
          <span class="company-badge">${companyName}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell ?? '-'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <span>Gerado por RH TRANSFORMA em ${formattedDate}</span>
        <span>Documento Confidencial • Uso Interno</span>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// ==========================================
// 6. CÁLCULO DE FORMULAS E FILTROS EM MEMÓRIA
// ==========================================

export function applyGlobalFilters<T extends Record<string, any>>(
  list: T[],
  filters: DPGlobalFilterState,
  getEmployeeFields?: (item: T) => {
    department?: string;
    unit?: string;
    costCenter?: string;
    role?: string;
    manager?: string;
    contractType?: string;
    status?: string;
    createdAt?: string;
  }
): T[] {
  return list.filter(item => {
    const fields = getEmployeeFields ? getEmployeeFields(item) : {
      department: item.departamento || item.profissionais?.departamento || item.department,
      unit: item.unidade || item.profissionais?.unidade || item.unit,
      costCenter: item.centroCusto || item.profissionais?.centroCusto || item.costCenter,
      role: item.cargo || item.profissionais?.cargo || item.role,
      manager: item.gestor || item.profissionais?.gestor || item.manager,
      contractType: item.tipoContrato || item.profissionais?.tipoContrato || item.contractType,
      status: item.status || item.profissionais?.status || item.status
    };

    if (filters.department && fields.department !== filters.department) return false;
    if (filters.unit && fields.unit !== filters.unit) return false;
    if (filters.costCenter && fields.costCenter !== filters.costCenter) return false;
    if (filters.role && fields.role !== filters.role) return false;
    if (filters.manager && fields.manager !== filters.manager) return false;
    if (filters.contractType && fields.contractType !== filters.contractType) return false;

    if (filters.employeeStatus && filters.employeeStatus !== 'Todos') {
      if (fields.status && fields.status !== filters.employeeStatus) return false;
    }

    return true;
  });
}
