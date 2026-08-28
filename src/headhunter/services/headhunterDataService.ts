import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  query,
  where,
} from '../../firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  sanitizeFirestoreData, 
  safeFirestoreRead, 
  safeFirestoreWrite, 
  OperationType 
} from '../../lib/firestoreUtils';
import { 
  HeadhunterClient, 
  HeadhunterLead, 
  HeadhunterProposal, 
  HeadhunterContract 
} from '../types';

const COLLECTIONS = {
  CLIENTS: 'clientes_headhunter',
  LEADS: 'headhunter_leads',
  PROPOSALS: 'headhunter_proposals',
  CONTRACTS: 'headhunter_contracts'
};

let clientsCache: HeadhunterClient[] = [];
let leadsCache: HeadhunterLead[] = [];
let proposalsCache: HeadhunterProposal[] = [];
let contractsCache: HeadhunterContract[] = [];

export async function syncHeadhunterDataWithFirestore(companyId: string): Promise<void> {
  if (!companyId) throw new Error('Não foi possível identificar a empresa do usuário.');
  const tenantQuery = (collectionName: string) =>
    query(collection(db, collectionName), where('empresaId', '==', companyId));
  const cliRead = await safeFirestoreRead(
    async () => {
      const snap = await getDocs(tenantQuery(COLLECTIONS.CLIENTS));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as HeadhunterClient));
    },
    OperationType.LIST,
    COLLECTIONS.CLIENTS,
    []
  );
  if (!cliRead.success) throw new Error(`Falha ao consultar clientes: ${cliRead.error?.error}`);
  clientsCache = [...clientsCache.filter(item => item.empresaId !== companyId && item.companyId !== companyId), ...cliRead.data];

  const leadRead = await safeFirestoreRead(
    async () => {
      const snap = await getDocs(tenantQuery(COLLECTIONS.LEADS));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as HeadhunterLead));
    },
    OperationType.LIST,
    COLLECTIONS.LEADS,
    []
  );
  if (!leadRead.success) throw new Error(`Falha ao consultar leads: ${leadRead.error?.error}`);
  leadsCache = [...leadsCache.filter(item => item.empresaId !== companyId && item.companyId !== companyId), ...leadRead.data];

  const propRead = await safeFirestoreRead(
    async () => {
      const snap = await getDocs(tenantQuery(COLLECTIONS.PROPOSALS));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as HeadhunterProposal));
    },
    OperationType.LIST,
    COLLECTIONS.PROPOSALS,
    []
  );
  if (!propRead.success) throw new Error(`Falha ao consultar propostas: ${propRead.error?.error}`);
  proposalsCache = [...proposalsCache.filter(item => item.empresaId !== companyId && item.companyId !== companyId), ...propRead.data];

  const ctrRead = await safeFirestoreRead(
    async () => {
      const snap = await getDocs(tenantQuery(COLLECTIONS.CONTRACTS));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as HeadhunterContract));
    },
    OperationType.LIST,
    COLLECTIONS.CONTRACTS,
    []
  );
  if (!ctrRead.success) throw new Error(`Falha ao consultar contratos: ${ctrRead.error?.error}`);
  contractsCache = [...contractsCache.filter(item => item.empresaId !== companyId && item.companyId !== companyId), ...ctrRead.data];
}

export class HeadhunterDataService {
  static getClients(companyId?: string): HeadhunterClient[] {
    return clientsCache.filter(c => !companyId || c.companyId === companyId || c.empresaId === companyId);
  }

  static async saveClient(client: HeadhunterClient): Promise<HeadhunterClient> {
    const companyId = client.companyId || client.empresaId;
    if (!companyId || companyId === '') {
      throw new Error("Não foi possível identificar a empresa do usuário.");
    }

    const clientToSave: HeadhunterClient = {
      ...client,
      companyId,
      empresaId: companyId
    };

    const res = await safeFirestoreWrite(
      async () => {
        await setDoc(doc(db, COLLECTIONS.CLIENTS, clientToSave.id), sanitizeFirestoreData(clientToSave), { merge: true });
        clientsCache = [clientToSave, ...clientsCache.filter(c => c.id !== clientToSave.id)];
        return clientToSave;
      },
      OperationType.WRITE,
      `${COLLECTIONS.CLIENTS}/${clientToSave.id}`
    );

    if (!res.success) {
      throw new Error(`Erro ao salvar cliente no Firestore: ${res.error?.error}`);
    }

    return clientToSave;
  }

  static getLeads(companyId?: string): HeadhunterLead[] {
    return leadsCache.filter(l => !companyId || l.companyId === companyId || l.empresaId === companyId);
  }

  static async saveLead(lead: HeadhunterLead): Promise<HeadhunterLead> {
    const companyId = lead.companyId || lead.empresaId;
    if (!companyId || companyId === '') {
      throw new Error("Não foi possível identificar a empresa do usuário.");
    }

    const leadToSave: HeadhunterLead = {
      ...lead,
      companyId,
      empresaId: companyId
    };

    const res = await safeFirestoreWrite(
      async () => {
        await setDoc(doc(db, COLLECTIONS.LEADS, leadToSave.id), sanitizeFirestoreData(leadToSave), { merge: true });
        leadsCache = [leadToSave, ...leadsCache.filter(l => l.id !== leadToSave.id)];
        return leadToSave;
      },
      OperationType.WRITE,
      `${COLLECTIONS.LEADS}/${leadToSave.id}`
    );

    if (!res.success) {
      throw new Error(`Erro ao salvar lead no Firestore: ${res.error?.error}`);
    }

    return leadToSave;
  }

  static getProposals(companyId?: string): HeadhunterProposal[] {
    return proposalsCache.filter(p => !companyId || p.companyId === companyId || p.empresaId === companyId);
  }

  static async saveProposal(proposal: HeadhunterProposal): Promise<HeadhunterProposal> {
    const companyId = proposal.companyId || proposal.empresaId;
    if (!companyId || companyId === '') {
      throw new Error("Não foi possível identificar a empresa do usuário.");
    }

    const proposalToSave: HeadhunterProposal = {
      ...proposal,
      companyId,
      empresaId: companyId
    };

    const res = await safeFirestoreWrite(
      async () => {
        await setDoc(doc(db, COLLECTIONS.PROPOSALS, proposalToSave.id), sanitizeFirestoreData(proposalToSave), { merge: true });
        proposalsCache = [proposalToSave, ...proposalsCache.filter(p => p.id !== proposalToSave.id)];
        return proposalToSave;
      },
      OperationType.WRITE,
      `${COLLECTIONS.PROPOSALS}/${proposalToSave.id}`
    );

    if (!res.success) {
      throw new Error(`Erro ao salvar proposta no Firestore: ${res.error?.error}`);
    }

    return proposalToSave;
  }

  static getContracts(companyId?: string): HeadhunterContract[] {
    return contractsCache.filter(c => !companyId || c.companyId === companyId || c.empresaId === companyId);
  }

  static async saveContract(contract: HeadhunterContract): Promise<HeadhunterContract> {
    const companyId = contract.companyId || contract.empresaId;
    if (!companyId || companyId === '') {
      throw new Error("Não foi possível identificar a empresa do usuário.");
    }

    const contractToSave: HeadhunterContract = {
      ...contract,
      companyId,
      empresaId: companyId
    };

    const res = await safeFirestoreWrite(
      async () => {
        await setDoc(doc(db, COLLECTIONS.CONTRACTS, contractToSave.id), sanitizeFirestoreData(contractToSave), { merge: true });
        contractsCache = [contractToSave, ...contractsCache.filter(c => c.id !== contractToSave.id)];
        return contractToSave;
      },
      OperationType.WRITE,
      `${COLLECTIONS.CONTRACTS}/${contractToSave.id}`
    );

    if (!res.success) {
      throw new Error(`Erro ao salvar contrato no Firestore: ${res.error?.error}`);
    }

    return contractToSave;
  }
}
