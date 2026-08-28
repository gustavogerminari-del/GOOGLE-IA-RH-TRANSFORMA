import { CompanyProfile, Department } from '../types/department';

export const INITIAL_COMPANY_PROFILE: CompanyProfile = {
  id: '',
  name: '',
  tradingName: '',
  cnpj: '',
  isVerified: false,
  address: {
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  },
  contact: {
    email: '',
    phone: '',
    website: '',
  },
  industryCategory: '',
  foundedYear: new Date().getFullYear(),
};

export const INITIAL_DEPARTMENTS_DATA: Department[] = [];
