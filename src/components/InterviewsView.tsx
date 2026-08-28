import React from 'react';
import { InterviewsManagementView } from '../interviews';
import { Interview } from '../types/rh';

interface InterviewsViewProps {
  interviews: Interview[];
  openScheduleInterviewModal: () => void;
  onEditInterview: (interview: Interview) => void;
  onCancelInterview: (interview: Interview) => Promise<void>;
  onUpdateInterviewFeedback: (
    interviewId: string,
    feedback: NonNullable<Interview['feedback']>
  ) => Promise<void>;
}

class InterviewModuleErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error('[INTERVIEWS_VIEW_RENDER_FAILED]', { message: error.message, stack: error.stack });
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center space-y-3">
          <h2 className="font-black text-slate-900">Não foi possível exibir as entrevistas</h2>
          <p className="text-sm text-slate-600">Um registro antigo possui informações incompletas. Atualize a tela para tentar novamente.</p>
          <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold">Atualizar tela</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const InterviewsView: React.FC<InterviewsViewProps> = ({
  interviews,
  openScheduleInterviewModal,
  onEditInterview,
  onCancelInterview,
  onUpdateInterviewFeedback,
}) => {
  return (
    <InterviewModuleErrorBoundary>
      <InterviewsManagementView
        initialInterviewsList={interviews as any}
        onScheduleInterviewExternal={openScheduleInterviewModal}
        onEditInterviewExternal={onEditInterview as any}
        onCancelInterviewExternal={onCancelInterview as any}
        onUpdateFeedbackExternal={onUpdateInterviewFeedback as any}
      />
    </InterviewModuleErrorBoundary>
  );
};
