import React from 'react';
import { JobFormModal } from '../jobs/components/JobFormModal';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (job: any) => void;
  departments?: string[];
  initialJob?: any;
}

export const NewJobModal: React.FC<NewJobModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialJob,
}) => {
  return (
    <JobFormModal
      isOpen={isOpen}
      onClose={onClose}
      initialJob={initialJob}
      openedFromModule="recrutamento"
      onSaveJob={(jobData) => {
        if (onSubmit) {
          onSubmit(jobData);
        }
      }}
    />
  );
};
