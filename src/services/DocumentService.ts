import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from '../firebase/firestore';
import { db, auth } from '../lib/firebase';
import { sanitizeFirestoreData, handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { 
  HRDocument, 
  DocumentTemplate, 
  DocumentCategoryConfig, 
  DocumentAuditLog 
} from '../documents-signature/types';
import { AuditService } from './AuditService';

const COLLECTION_DOCUMENTS = 'documents';
const COLLECTION_TEMPLATES = 'document_templates';
const COLLECTION_CATEGORIES = 'document_categories';

// Initial seed data for documents when Firestore is empty for a company
const INITIAL_SEED_DOCUMENTS: Omit<HRDocument, 'companyId'>[] = [
  {
    id: 'doc-seed-001',
    title: 'Contrato Individual de Trabalho CLT - Mariana Siqueira',
    fileName: 'contrato_clt_mariana_siqueira_v2.pdf',
    fileSize: '1.4 MB',
    category: 'Contrato de Trabalho',
    linkedEntityName: 'Mariana Costa Siqueira',
    linkedType: 'Colaborador',
    uploadedAt: '2026-07-01',
    expirationDate: '2028-07-01',
    validityStatus: 'Válido',
    signatureStatus: 'Assinado Digitalmente',
    version: 1,
    signers: [
      { name: 'Mariana Costa Siqueira', email: 'mariana.siqueira@empresa.com.br', role: 'Colaborador', signedAt: '2026-07-01 14:32', hasSigned: true, sha256Hash: 'a8f9c02firestore3e...', ipAddress: '187.32.109.12' },
      { name: 'Carlos Eduardo RH', email: 'carlos.rh@maisrh.com.br', role: 'Representante Legal RH', signedAt: '2026-07-01 15:05', hasSigned: true, sha256Hash: 'e3b0c44298f...', ipAddress: '200.150.20.5' }
    ],
    accessPermissions: { canView: true, canSign: true, canDownload: true, canDelete: false },
    contractDetails: {
      contractType: 'CLT',
      salaryBase: 6500,
      startDate: '2026-07-01',
      status: 'Ativo',
      renewalCount: 0
    },
    auditTrail: [
      { id: 'aud-01', action: 'Criação', performedBy: 'Carlos Eduardo RH', userEmail: 'carlos.rh@maisrh.com.br', ipAddress: '200.150.20.5', timestamp: '2026-07-01T10:00:00Z', details: 'Documento gerado a partir do Modelo CLT' },
      { id: 'aud-02', action: 'Assinatura', performedBy: 'Mariana Costa Siqueira', userEmail: 'mariana.siqueira@empresa.com.br', ipAddress: '187.32.109.12', timestamp: '2026-07-01T14:32:00Z', details: 'Assinado eletronicamente com validação de hash' }
    ],
    content: `CONTRATO INDIVIDUAL DE TRABALHO CLT\n\nEMPREGADOR: RH TRANSFORMA Tecnologias Ltda, CNPJ 12.345.678/0001-90.\nEMPREGADO: Mariana Costa Siqueira, CPF 123.456.789-00.\n\nCláusula 1ª - Da Função e Remuneração:\nA Empregada é contratada para exercer a função de Analista de RH Senior, com salário mensal de R$ 6.500,00.\n\nCláusula 2ª - Da Jornada:\nA jornada semanal de trabalho será de 44 horas semanais.\n\nSão Paulo, 01 de Julho de 2026.`
  },
  {
    id: 'doc-seed-002',
    title: 'Termo de Confidencialidade e NDA Corporativo - Rodrigo Albuquerque',
    fileName: 'nda_termo_confidencialidade_2026.pdf',
    fileSize: '850 KB',
    category: 'NDA / Sigilo',
    linkedEntityName: 'Rodrigo Albuquerque',
    linkedType: 'Colaborador',
    uploadedAt: '2026-07-10',
    expirationDate: '2026-08-10',
    validityStatus: 'A Vencer',
    signatureStatus: 'Pendente de Assinatura',
    version: 1,
    signers: [
      { name: 'Rodrigo Albuquerque', email: 'rodrigo.albuquerque@email.com', role: 'Colaborador', hasSigned: false },
      { name: 'Diretoria de RH', email: 'rh@maisrh.com.br', role: 'Representante Legal RH', hasSigned: true, signedAt: '2026-07-10 10:00', sha256Hash: '43b901fc88a...', ipAddress: '200.150.20.5' }
    ],
    accessPermissions: { canView: true, canSign: true, canDownload: true, canDelete: true },
    auditTrail: [
      { id: 'aud-03', action: 'Criação', performedBy: 'Diretoria de RH', userEmail: 'rh@maisrh.com.br', ipAddress: '200.150.20.5', timestamp: '2026-07-10T10:00:00Z', details: 'Enviado termo de NDA para assinatura' }
    ],
    content: `TERMO DE CONFIDENCIALIDADE E NÃO DIVULGAÇÃO (NDA)\n\nPelo presente instrumento, Rodrigo Albuquerque compromete-se a manter estrito sigilo sobre todas as informações estratégicas, segredos de negócio e dados de clientes do RH TRANSFORMA.`
  },
  {
    id: 'doc-seed-003',
    title: 'Atestado de Saúde Ocupacional (ASO Adm) - Gabriel Lima',
    fileName: 'aso_admissional_gabriel.pdf',
    fileSize: '510 KB',
    category: 'Atestado / Laudo',
    linkedEntityName: 'Gabriel Lima',
    linkedType: 'Colaborador',
    uploadedAt: '2026-05-15',
    expirationDate: '2026-05-15',
    validityStatus: 'Vencido',
    signatureStatus: 'Assinado Digitalmente',
    version: 1,
    signers: [
      { name: 'Dr. Roberto Médico do Trabalho', email: 'roberto@clinica.com.br', role: 'Testemunha', hasSigned: true, signedAt: '2026-05-15 09:00' }
    ],
    accessPermissions: { canView: true, canSign: false, canDownload: true, canDelete: false },
    auditTrail: [
      { id: 'aud-04', action: 'Criação', performedBy: 'Clínica Ocupacional', userEmail: 'roberto@clinica.com.br', ipAddress: '177.10.20.1', timestamp: '2026-05-15T09:00:00Z', details: 'ASO Cadastrado no sistema' }
    ]
  }
];

const INITIAL_TEMPLATES: Omit<DocumentTemplate, 'companyId'>[] = [
  {
    id: 'tmpl-clt',
    title: 'Modelo Padrão - Contrato de Trabalho CLT',
    category: 'Contrato de Trabalho',
    description: 'Contrato individual de trabalho no regime CLT com cláusulas de jornada e remuneração',
    templateText: `CONTRATO INDIVIDUAL DE TRABALHO CLT\n\nEMPREGADOR: {{empresaNome}}, pessoa jurídica com sede sob CNPJ nº {{cnpj}}.\nEMPREGADO(A): {{nomeColaborador}}, portador(a) do CPF nº {{cpf}} e RG {{rg}}.\n\n1. O(A) EMPREGADO(A) é contratado(a) para exercer a função de {{cargo}}, no departamento {{departamento}}, com remuneração mensal de R$ {{salario}}.\n2. A data de admissão é {{dataAdmissao}}.\n3. O presente contrato vigorará por prazo indeterminado.\n\n{{cidadeEmpresa}}, {{dataAtual}}.`,
    requiredSignerRoles: ['Colaborador', 'Representante Legal RH'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tmpl-nda',
    title: 'Modelo Padrão - Termo de Sigilo e NDA',
    category: 'NDA / Sigilo',
    description: 'Termo de confidencialidade para novos colaboradores e prestadores',
    templateText: `TERMO DE CONFIDENCIALIDADE E NÃO DIVULGAÇÃO (NDA)\n\nPor este termo, {{nomeColaborador}} (CPF {{cpf}}), no exercício da função de {{cargo}} em {{empresaNome}}, compromete-se formalmente a não revelar, divulgar ou utilizar dados confidenciais a que tiver acesso.\n\nData: {{dataAtual}}.`,
    requiredSignerRoles: ['Colaborador', 'Representante Legal RH'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tmpl-equip',
    title: 'Modelo Padrão - Termo de Guardadoria de Equipamentos',
    category: 'Termo de Equipamentos',
    description: 'Termo de entrega de notebook, celular e periféricos do trabalho',
    templateText: `TERMO DE RESPONSABILIDADE DE EQUIPAMENTOS\n\nDeclaro que recebi de {{empresaNome}} os equipamentos descritos para uso estritamente profissional por {{nomeColaborador}} (CPF {{cpf}}).\n\nEquipamento: Notebook corporativo, Carregador e Mouse.\nData: {{dataAtual}}.`,
    requiredSignerRoles: ['Colaborador'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class DocumentService {
  /**
   * Helper para sanitizar companyId
   */
  private static getCompanyId(companyId?: string): string {
    const normalized = companyId?.trim();
    if (!normalized) throw new Error('empresaId é obrigatório para operações de documentos.');
    return normalized;
  }

  /**
   * Cria um novo documento e o persiste no Firestore
   */
  static async create(docData: Partial<HRDocument> & { companyId?: string }): Promise<HRDocument> {
    const companyId = this.getCompanyId(docData.companyId);
    const id = docData.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const user = auth.currentUser;
    const nowIso = new Date().toISOString();
    const nowDate = nowIso.split('T')[0];

    const auditEntry: DocumentAuditLog = {
      id: `aud-${Date.now()}`,
      action: 'Criação',
      performedBy: user?.displayName || user?.email || 'Sistema de RH',
      userEmail: user?.email || 'usuario@maisrh.com.br',
      ipAddress: '187.32.109.12',
      timestamp: nowIso,
      details: `Documento "${docData.title || 'Novo Documento'}" registrado no repositório`
    };

    const hrDoc: HRDocument = {
      id,
      companyId,
      colaboradorId: docData.colaboradorId,
      title: docData.title || 'Novo Documento',
      fileName: docData.fileName || 'documento.pdf',
      fileSize: docData.fileSize || '1.0 MB',
      fileUrl: docData.fileUrl || '',
      category: docData.category || 'Contrato de Trabalho',
      linkedEntityName: docData.linkedEntityName || 'Geral',
      linkedType: docData.linkedType || 'Colaborador',
      uploadedAt: docData.uploadedAt || nowDate,
      expirationDate: docData.expirationDate,
      validityStatus: docData.validityStatus || (docData.expirationDate ? 'Válido' : 'Sem Validade'),
      signatureStatus: docData.signatureStatus || 'Pendente de Assinatura',
      signers: docData.signers || [],
      accessPermissions: docData.accessPermissions || {
        canView: true,
        canSign: true,
        canDownload: true,
        canDelete: true
      },
      content: docData.content || '',
      version: docData.version || 1,
      history: docData.history || [
        {
          version: 1,
          updatedAt: nowIso,
          updatedBy: user?.email || 'Sistema de RH',
          changeDescription: 'Criação inicial do documento',
          fileName: docData.fileName || 'documento.pdf'
        }
      ],
      auditTrail: docData.auditTrail ? [...docData.auditTrail, auditEntry] : [auditEntry],
      contractDetails: docData.contractDetails,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    try {
      await setDoc(doc(db, COLLECTION_DOCUMENTS, id), sanitizeFirestoreData(hrDoc), { merge: true });
      await AuditService.log({
        action: 'CREATE',
        description: `Documento "${hrDoc.title}" registrado no repositório`,
        moduleName: 'Documentos',
        targetEntity: 'Documento',
        companyId
      });
      return hrDoc;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTION_DOCUMENTS}/${id}`);
    }
  }

  /**
   * Atualiza um documento existente
   */
  static async update(id: string, data: Partial<HRDocument>, updatedByEmail = 'usuario@maisrh.com.br'): Promise<HRDocument | null> {
    try {
      const docRef = doc(db, COLLECTION_DOCUMENTS, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return null;
      }

      const existingData = snap.data() as HRDocument;
      const nowIso = new Date().toISOString();

      const newAuditLog: DocumentAuditLog = {
        id: `aud-${Date.now()}`,
        action: 'Atualização',
        performedBy: updatedByEmail,
        userEmail: updatedByEmail,
        ipAddress: '187.32.109.12',
        timestamp: nowIso,
        details: `Documento atualizado. Status de assinatura: ${data.signatureStatus || existingData.signatureStatus}`
      };

      const updatedDoc: HRDocument = {
        ...existingData,
        ...data,
        updatedAt: nowIso,
        auditTrail: [...(existingData.auditTrail || []), newAuditLog]
      };

      await setDoc(docRef, sanitizeFirestoreData(updatedDoc), { merge: true });

      await AuditService.log({
        action: 'UPDATE',
        description: `Documento ${existingData.title} atualizado`,
        moduleName: 'Documentos',
        targetEntity: 'Documento',
        companyId: existingData.companyId
      });

      return updatedDoc;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_DOCUMENTS}/${id}`);
    }
  }

  /**
   * Deleta um documento por ID
   */
  static async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_DOCUMENTS, id);
      await deleteDoc(docRef);
      await AuditService.log({
        action: 'DELETE',
        description: `Documento ${id} excluído do repositório`,
        moduleName: 'Documentos',
        targetEntity: 'Documento'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_DOCUMENTS}/${id}`);
    }
  }

  /**
   * Busca documento por ID
   */
  static async getById(id: string): Promise<HRDocument | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION_DOCUMENTS, id));
      if (snap.exists()) {
        return snap.data() as HRDocument;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTION_DOCUMENTS}/${id}`);
    }
  }

  static async get(id: string): Promise<HRDocument | null> {
    return this.getById(id);
  }

  /**
   * Lista todos os documentos escopados por empresa (com auto-seeding caso vazio)
   */
  static async list(companyId?: string): Promise<HRDocument[]> {
    const empId = this.getCompanyId(companyId);
    try {
      const q = query(collection(db, COLLECTION_DOCUMENTS), where('companyId', '==', empId));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const list: HRDocument[] = [];
        snap.forEach(d => list.push(d.data() as HRDocument));
        return list;
      }

      return [];
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_DOCUMENTS);
    }
  }

  /**
   * Realiza busca textual em documentos
   */
  static async search(term: string, companyId?: string): Promise<HRDocument[]> {
    const all = await this.list(companyId);
    const lower = term.toLowerCase();
    return all.filter(d => 
      d.title.toLowerCase().includes(lower) || 
      d.fileName.toLowerCase().includes(lower) ||
      d.linkedEntityName.toLowerCase().includes(lower) ||
      d.category.toLowerCase().includes(lower)
    );
  }

  /**
   * Paginação
   */
  static async paginate(page: number, pageSize: number, companyId?: string): Promise<{ items: HRDocument[]; total: number }> {
    const all = await this.list(companyId);
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      total: all.length
    };
  }

  // ==========================================
  // MODELOS DE DOCUMENTOS (TEMPLATES)
  // ==========================================

  static async listTemplates(companyId?: string): Promise<DocumentTemplate[]> {
    const empId = this.getCompanyId(companyId);
    try {
      const q = query(collection(db, COLLECTION_TEMPLATES), where('companyId', '==', empId));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const list: DocumentTemplate[] = [];
        snap.forEach(d => list.push(d.data() as DocumentTemplate));
        return list;
      }

      return [];
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_TEMPLATES);
    }
  }

  static async saveTemplate(tmpl: Partial<DocumentTemplate> & { companyId?: string }): Promise<DocumentTemplate> {
    const companyId = this.getCompanyId(tmpl.companyId);
    const id = tmpl.id || `tmpl-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const fullTmpl: DocumentTemplate = {
      id,
      companyId,
      title: tmpl.title || 'Novo Modelo de Documento',
      category: tmpl.category || 'Contrato de Trabalho',
      description: tmpl.description || '',
      templateText: tmpl.templateText || '',
      requiredSignerRoles: tmpl.requiredSignerRoles || ['Colaborador', 'Representante Legal RH'],
      createdAt: tmpl.createdAt || nowIso,
      updatedAt: nowIso
    };

    try {
      await setDoc(doc(db, COLLECTION_TEMPLATES, id), sanitizeFirestoreData(fullTmpl), { merge: true });
      return fullTmpl;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTION_TEMPLATES}/${id}`);
    }
  }

  /**
   * Substituição de variáveis para geração automática de documentos
   */
  static renderTemplate(
    templateText: string,
    vars: {
      nomeColaborador?: string;
      cpf?: string;
      rg?: string;
      cargo?: string;
      departamento?: string;
      salario?: string | number;
      dataAdmissao?: string;
      empresaNome?: string;
      cnpj?: string;
      cidadeEmpresa?: string;
      dataAtual?: string;
      [key: string]: any;
    }
  ): string {
    let rendered = templateText;
    const todayStr = vars.dataAtual || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const defaults = {
      nomeColaborador: vars.nomeColaborador || '[Nome do Colaborador]',
      cpf: vars.cpf || '[CPF]',
      rg: vars.rg || '[RG]',
      cargo: vars.cargo || '[Cargo]',
      departamento: vars.departamento || '[Departamento]',
      salario: typeof vars.salario === 'number' ? vars.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : (vars.salario || '[Salário]'),
      dataAdmissao: vars.dataAdmissao || '[Data Admissão]',
      empresaNome: vars.empresaNome || 'RH TRANSFORMA Tecnologias Ltda',
      cnpj: vars.cnpj || '12.345.678/0001-90',
      cidadeEmpresa: vars.cidadeEmpresa || 'São Paulo - SP',
      dataAtual: todayStr
    };

    Object.entries(defaults).forEach(([key, val]) => {
      const reg = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(reg, String(val));
    });

    return rendered;
  }
}
