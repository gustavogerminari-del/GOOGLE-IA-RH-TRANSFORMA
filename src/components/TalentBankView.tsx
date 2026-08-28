import React from 'react';
import { TalentBankManagementView, Candidate } from '../talent-bank';
import { Job } from '../jobs';

interface TalentBankViewProps {
  candidates: Candidate[];
  jobs: Job[];
  openNewCandidateModal: () => void;
  onAssignCandidateToJob: (candidateId: string, jobId: string) => void;
  searchTerm: string;
}

export const TalentBankView: React.FC<TalentBankViewProps> = ({
  candidates,
  jobs,
  onAssignCandidateToJob,
  searchTerm,
}) => {
  return (
    <TalentBankManagementView
      initialCandidatesList={candidates}
      jobsList={jobs}
      onAssignCandidateToJob={onAssignCandidateToJob}
      searchTermExternal={searchTerm}
    />
  );
};
