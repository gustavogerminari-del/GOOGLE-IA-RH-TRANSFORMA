import React from 'react';
import { JobsManagementView, Job } from '../jobs';
import { Candidate, Stage, StageId } from '../types/rh';

interface JobsViewProps {
  jobs: Job[];
  candidates: Candidate[];
  stages: Stage[];
  openNewJobModal: () => void;
  onMoveCandidateStage: (candidateId: string, newStageId: StageId) => void;
  searchTerm: string;
  onUpdateJobs?: (updatedJobs: Job[]) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({ jobs, onUpdateJobs }) => {
  return <JobsManagementView initialJobsList={jobs} onUpdateJobs={onUpdateJobs} />;
};
