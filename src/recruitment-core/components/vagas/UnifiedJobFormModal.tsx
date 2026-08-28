import React from 'react';
import { JobFormModal, HeadhunterClientOption } from '../../../jobs/components/JobFormModal';
import { UnifiedJob, OrigemProcesso } from '../../types/recruitment';

interface UnifiedJobFormModalProps {
  origemProcesso?: OrigemProcesso;
  existingJob?: UnifiedJob | null;
  clients?: HeadhunterClientOption[];
  onClose: () => void;
  onSave: (jobData: UnifiedJob) => void;
}

export const UnifiedJobFormModal: React.FC<UnifiedJobFormModalProps> = ({
  origemProcesso = 'headhunter',
  existingJob,
  clients = [],
  onClose,
  onSave
}) => {
  const isHeadhunter = origemProcesso === 'headhunter';

  return (
    <JobFormModal
      isOpen={true}
      onClose={onClose}
      initialJob={existingJob}
      clients={clients}
      openedFromModule={isHeadhunter ? 'headhunter' : 'recrutamento'}
      onSaveJob={(jobData) => {
        onSave(jobData as UnifiedJob);
      }}
    />
  );
};
