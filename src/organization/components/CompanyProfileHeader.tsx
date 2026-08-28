import React from 'react';
import {
  Building2,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Globe,
  Users,
  Edit3,
  Calendar,
  Lock,
} from 'lucide-react';
import { CompanyProfile } from '../types/department';
import { Button } from '../../shared';

export interface CompanyProfileHeaderProps {
  company: CompanyProfile;
  totalCompanyEmployees: number;
  totalOpenJobs: number;
  onEditCompany?: () => void;
  canEditCompany?: boolean;
}

export const CompanyProfileHeader: React.FC<CompanyProfileHeaderProps> = ({
  company,
  totalCompanyEmployees,
  totalOpenJobs,
  onEditCompany,
  canEditCompany = true,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-6 relative overflow-hidden">
      {/* Background Subtle Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Company Logo & Title */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md shrink-0 border-2 border-indigo-200">
            {company.tradingName.substring(0, 2).toUpperCase()}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {company.tradingName}
              </h2>

              {company.isVerified && (
                <span className="bg-emerald-50 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Selo de Verificação RH TRANSFORMA
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-slate-500">
              {company.name} • CNPJ: <strong className="text-slate-800 font-mono">{company.cnpj}</strong>
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap pt-1 font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                {company.address.street}, {company.address.number} — {company.address.city}/{company.address.state}
              </span>

              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                {company.contact.email}
              </span>

              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                {company.contact.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Right Badges & Edit Button */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-2xl text-center flex-1 sm:flex-initial">
              <span className="text-[10px] font-bold text-indigo-600 uppercase block">Total Geral</span>
              <span className="text-base font-black text-indigo-900">{totalCompanyEmployees} Colaboradores</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl text-center flex-1 sm:flex-initial">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Vagas Abertas</span>
              <span className="text-base font-black text-slate-900">{totalOpenJobs} Vagas</span>
            </div>
          </div>

          {onEditCompany && (
            canEditCompany ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditCompany}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Editar Dados da Empresa
              </Button>
            ) : (
              <div className="text-[11px] text-slate-400 font-medium italic flex items-center gap-1">
                <Lock className="w-3 h-3" /> Alteração restrita a Administradores
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
