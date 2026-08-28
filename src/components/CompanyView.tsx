import React from 'react';
import { OrganizationManagementView } from '../organization';
import { Department as LegacyDepartment, Recruiter } from '../types/rh';

interface CompanyViewProps {
  departments?: LegacyDepartment[];
  recruiters?: Recruiter[];
}

export const CompanyView: React.FC<CompanyViewProps> = () => {
  return <OrganizationManagementView />;
};
