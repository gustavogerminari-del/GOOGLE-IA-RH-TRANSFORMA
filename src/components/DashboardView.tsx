import React from 'react';
import { MainDashboardView } from '../dashboard';
import { Job, Candidate, Interview, Stage } from '../types/rh';

interface DashboardViewProps {
  jobs: Job[];
  candidates: Candidate[];
  interviews: Interview[];
  stages: Stage[];
  onNavigateToJobs: () => void;
  onNavigateToCandidates: () => void;
  onNavigateToInterviews: () => void;
  openNewJobModal: () => void;
  openNewCandidateModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToJobs,
  onNavigateToCandidates,
  onNavigateToInterviews,
}) => {
  return (
    <MainDashboardView
      onNavigateToJobs={onNavigateToJobs}
      onNavigateToTalentBank={onNavigateToCandidates}
      onNavigateToInterviews={onNavigateToInterviews}
    />
  );
};
