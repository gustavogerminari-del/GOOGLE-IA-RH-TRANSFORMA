import { 
  doc, 
  getDoc, 
  setDoc
} from '../firebase/firestore';
import { db } from '../lib/firebase';
import { sanitizeFirestoreData } from '../lib/firestoreUtils';
import { AuditService } from './AuditService';

const COLLECTION_NAME = 'settings';

export interface CompanySettings {
  companyId: string;
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  allowSelfRegistration: boolean;
  defaultEmployeeRole: string;
  timeClockSettings: {
    toleranciaMinutos: number;
    exigirGeolocalizacao: boolean;
    permitirFoto: boolean;
  };
  notificationSettings: {
    emailNotifications: boolean;
    newApplications: boolean;
    payrollAlerts: boolean;
    timeClockAlerts: boolean;
  };
  updatedAt: string;
}

export class SettingsService {
  static async getByCompanyId(companyId: string): Promise<CompanySettings> {
    const defaultSettings: CompanySettings = {
      companyId,
      theme: 'light',
      primaryColor: '#0F172A',
      allowSelfRegistration: false,
      defaultEmployeeRole: 'COLABORADOR',
      timeClockSettings: {
        toleranciaMinutos: 10,
        exigirGeolocalizacao: true,
        permitirFoto: true
      },
      notificationSettings: {
        emailNotifications: true,
        newApplications: true,
        payrollAlerts: true,
        timeClockAlerts: true
      },
      updatedAt: new Date().toISOString()
    };

    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, companyId));
      if (snap.exists()) {
        return { ...defaultSettings, ...snap.data() } as CompanySettings;
      }
    } catch (err) {
      console.warn('Erro ao carregar configurações do Firestore:', err);
    }
    return defaultSettings;
  }

  static async update(companyId: string, settings: Partial<CompanySettings>): Promise<CompanySettings> {
    const now = new Date().toISOString();
    const updatedData = {
      ...settings,
      companyId,
      updatedAt: now
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, companyId), sanitizeFirestoreData(updatedData), { merge: true });
      await AuditService.log({
        action: 'UPDATE',
        description: `Configurações da empresa ${companyId} atualizadas`,
        moduleName: 'Configurações',
        targetEntity: 'Empresa',
        companyId
      });
    } catch (err) {
      console.warn('Erro ao atualizar configurações no Firestore:', err);
    }

    return this.getByCompanyId(companyId);
  }
}
