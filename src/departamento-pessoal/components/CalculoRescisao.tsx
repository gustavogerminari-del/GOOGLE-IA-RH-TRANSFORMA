import React from 'react';
import { CalculoRescisorio, ColaboradorCompleto } from '../types/dp';
import { PainelRescisoes } from './rescisao/PainelRescisoes';

interface CalculoRescisaoProps {
  rescisoes: CalculoRescisorio[];
  colaboradores: ColaboradorCompleto[];
  onSalvarRescisao: (rescisao: CalculoRescisorio) => void;
  companyId: string;
}

export const CalculoRescisao: React.FC<CalculoRescisaoProps> = ({
  rescisoes,
  colaboradores,
  onSalvarRescisao,
  companyId
}) => {
  return (
    <PainelRescisoes
      colaboradores={colaboradores}
      companyId={companyId}
      legacyRescisoes={rescisoes}
      onSalvarRescisaoLegacy={onSalvarRescisao}
    />
  );
};
