import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { CompanyProfile } from '../types/department';
import { Button, Input } from '../../shared';

export interface CompanyEditModalProps {
  company: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveCompany: (updatedCompany: CompanyProfile) => void;
}

export const CompanyEditModal: React.FC<CompanyEditModalProps> = ({
  company,
  isOpen,
  onClose,
  onSaveCompany,
}) => {
  const [name, setName] = useState(company.name);
  const [tradingName, setTradingName] = useState(company.tradingName);
  const [cnpj, setCnpj] = useState(company.cnpj);
  const [isVerified, setIsVerified] = useState(company.isVerified);
  const [street, setStreet] = useState(company.address.street);
  const [number, setNumber] = useState(company.address.number);
  const [neighborhood, setNeighborhood] = useState(company.address.neighborhood);
  const [city, setCity] = useState(company.address.city);
  const [state, setState] = useState(company.address.state);
  const [email, setEmail] = useState(company.contact.email);
  const [phone, setPhone] = useState(company.contact.phone);
  const [website, setWebsite] = useState(company.contact.website);
  const [industryCategory, setIndustryCategory] = useState(company.industryCategory);

  useEffect(() => {
    setName(company.name);
    setTradingName(company.tradingName);
    setCnpj(company.cnpj);
    setIsVerified(company.isVerified);
    setStreet(company.address.street);
    setNumber(company.address.number);
    setNeighborhood(company.address.neighborhood);
    setCity(company.address.city);
    setState(company.address.state);
    setEmail(company.contact.email);
    setPhone(company.contact.phone);
    setWebsite(company.contact.website);
    setIndustryCategory(company.industryCategory);
  }, [company, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSaveCompany({
      ...company,
      name,
      tradingName,
      cnpj,
      isVerified,
      address: {
        ...company.address,
        street,
        number,
        neighborhood,
        city,
        state,
      },
      contact: {
        email,
        phone,
        website,
      },
      industryCategory,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-extrabold text-slate-900">
            Editar Dados da Empresa
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Razão Social *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nome Fantasia *"
              value={tradingName}
              onChange={(e) => setTradingName(e.target.value)}
              required
            />

            <Input
              label="CNPJ *"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Logradouro / Endereço"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>
            <Input
              label="Número"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Cidade / Estado"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="UF"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="E-mail de Contato Corporativo"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Telefone Institucional"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Selo de Verificação Toggle */}
          <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-extrabold text-emerald-900 block">Selo de Verificação RH TRANSFORMA</span>
                <span className="text-[11px] text-slate-600">Confirma que a empresa possui compliance e auditoria ativa.</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
