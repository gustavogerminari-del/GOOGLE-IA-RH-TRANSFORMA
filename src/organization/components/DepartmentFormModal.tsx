import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Users,
  DollarSign,
  Layers,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Department, Sector } from '../types/department';
import { Button, Input } from '../../shared';

export interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDepartment: (
    deptData: Omit<Department, 'id'>,
    existingId?: string
  ) => void;
  initialDepartment?: Department | null;
}

export const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({
  isOpen,
  onClose,
  onSaveDepartment,
  initialDepartment,
}) => {
  const isEditing = !!initialDepartment;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [costCenter, setCostCenter] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerRole, setManagerRole] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [employeeCount, setEmployeeCount] = useState<number>(15);
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState<number>(150000);
  const [monthlyBudgetSpent, setMonthlyBudgetSpent] = useState<number>(120000);
  const [openJobsCount, setOpenJobsCount] = useState<number>(1);
  const [description, setDescription] = useState('');

  // Sector list state
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorHeadcount, setNewSectorHeadcount] = useState<number>(5);

  const [error, setError] = useState('');

  useEffect(() => {
    if (initialDepartment) {
      setName(initialDepartment.name);
      setCode(initialDepartment.code);
      setCostCenter(initialDepartment.costCenter || '');
      setManagerName(initialDepartment.manager.name);
      setManagerRole(initialDepartment.manager.role);
      setManagerEmail(initialDepartment.manager.email);
      setEmployeeCount(initialDepartment.employeeCount);
      setMonthlyBudgetLimit(initialDepartment.monthlyBudgetLimit);
      setMonthlyBudgetSpent(initialDepartment.monthlyBudgetSpent);
      setOpenJobsCount(initialDepartment.openJobsCount);
      setDescription(initialDepartment.description || '');
      setSectors(initialDepartment.sectors || []);
    } else {
      setName('');
      setCode('NOV');
      setCostCenter('CC-106');
      setManagerName('Mariana Silva');
      setManagerRole('Gerente de Área');
      setManagerEmail('mariana.silva@maisrh.com.br');
      setEmployeeCount(10);
      setMonthlyBudgetLimit(120000);
      setMonthlyBudgetSpent(90000);
      setOpenJobsCount(1);
      setDescription('');
      setSectors([
        { id: 'sec-1', name: 'Operações Internas', code: 'SEC-OP', activeEmployeeCount: 10 },
      ]);
    }
    setError('');
  }, [initialDepartment, isOpen]);

  if (!isOpen) return null;

  const handleAddSector = () => {
    if (!newSectorName.trim()) return;
    const newSec: Sector = {
      id: `sec-${Date.now()}`,
      name: newSectorName.trim(),
      code: `SEC-${newSectorName.substring(0, 3).toUpperCase()}`,
      activeEmployeeCount: Number(newSectorHeadcount) || 1,
    };
    setSectors((prev) => [...prev, newSec]);
    setNewSectorName('');
    setNewSectorHeadcount(5);
  };

  const handleRemoveSector = (id: string) => {
    setSectors((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !code.trim() || !managerName.trim()) {
      setError('Preencha os campos obrigatórios: Nome, Código e Líder do Departamento.');
      return;
    }

    onSaveDepartment(
      {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        costCenter: costCenter.trim(),
        manager: {
          name: managerName.trim(),
          role: managerRole.trim() || 'Gerente de Departamento',
          email: managerEmail.trim() || 'lider@maisrh.com.br',
          avatar: initialDepartment?.manager.avatar || '',
        },
        employeeCount: Number(employeeCount) || 0,
        monthlyBudgetLimit: Number(monthlyBudgetLimit) || 0,
        monthlyBudgetSpent: Number(monthlyBudgetSpent) || 0,
        openJobsCount: Number(openJobsCount) || 0,
        sectors,
        description: description.trim(),
        updatedAt: new Date().toISOString().split('T')[0],
      },
      initialDepartment?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
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
            {isEditing ? 'Editar Departamento & Setores' : 'Cadastrar Novo Departamento'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Nome do Departamento *"
                placeholder="Ex: Tecnologia & Inovação"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <Input
              label="Código Sigla *"
              placeholder="Ex: TEC"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Líder Responsável *"
              placeholder="Ex: Gabriel Martins"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              required
            />

            <Input
              label="Cargo do Líder"
              placeholder="Ex: Director of Engineering"
              value={managerRole}
              onChange={(e) => setManagerRole(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="E-mail do Líder"
              type="email"
              placeholder="gabriel@maisrh.com.br"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
            />

            <Input
              label="Centro de Custo (CC)"
              placeholder="Ex: CC-101"
              value={costCenter}
              onChange={(e) => setCostCenter(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              type="number"
              label="Colaboradores (Headcount) *"
              value={employeeCount}
              onChange={(e) => setEmployeeCount(Number(e.target.value))}
              min={0}
              required
            />

            <Input
              type="number"
              label="Orçamento Limite (R$) *"
              value={monthlyBudgetLimit}
              onChange={(e) => setMonthlyBudgetLimit(Number(e.target.value))}
              min={0}
              step={1000}
              required
            />

            <Input
              type="number"
              label="Orçamento Executado (R$)"
              value={monthlyBudgetSpent}
              onChange={(e) => setMonthlyBudgetSpent(Number(e.target.value))}
              min={0}
              step={1000}
            />
          </div>

          {/* Setores Internos Builder */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block">
              Setores Internos do Departamento
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome do Setor ex: Front-end"
                value={newSectorName}
                onChange={(e) => setNewSectorName(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Pessoas"
                value={newSectorHeadcount}
                onChange={(e) => setNewSectorHeadcount(Number(e.target.value))}
                className="w-24"
              />
              <Button type="button" variant="outline" onClick={handleAddSector} leftIcon={<Plus className="w-4 h-4" />}>
                Adicionar
              </Button>
            </div>

            {sectors.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                {sectors.map((sec) => (
                  <div
                    key={sec.id}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800"
                  >
                    <span>
                      <strong>{sec.name}</strong> ({sec.code}) — {sec.activeEmployeeCount} pessoas
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSector(sec.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Descrição / Responsabilidade do Departamento
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 font-medium"
              placeholder="Breve resumo da área e escopo de atuação..."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Departamento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
