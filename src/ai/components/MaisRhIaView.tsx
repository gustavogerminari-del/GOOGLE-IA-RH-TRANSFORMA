import React, { useState } from 'react';
import { 
  Sparkles, 
  BarChart2, 
  Users, 
  UserCheck, 
  Bot, 
  FileText, 
  Trophy, 
  Wand2, 
  MessageSquare 
} from 'lucide-react';

import { AiDashboardView } from './AiDashboardView';
import { CandidateAnalysisView } from './CandidateAnalysisView';
import { AiScreeningByJobView } from './AiScreeningByJobView';
import { AiAssistantChatView } from './AiAssistantChatView';
import { AiReportsView } from './AiReportsView';
import { CandidateRankingView } from './CandidateRankingView';
import { AiSettingsAndUsageView } from './AiSettingsAndUsageView';
import { Sliders } from 'lucide-react';

import { JobGeneratorModal } from './JobGeneratorModal';
import { InterviewAssistantModal } from './InterviewAssistantModal';

export const MaisRhIaView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'analise_candidatos' | 'triagem_vaga' | 'assistente_ia' | 'relatorios' | 'ranking' | 'configuracoes'
  >('dashboard');

  // Modals state
  const [showJobGenModal, setShowJobGenModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Module Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800/40 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Módulo Oficial RH TRANSFORMA IA
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px]">
                SAAS RH PREDITIVO
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              🤖 RH TRANSFORMA IA
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Plataforma de inteligência artificial preditiva para atração, recrutamento, triagem de currículos, ranqueamento e assistente de entrevistas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('assistente_ia')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4 text-amber-300" />
              <span>Abrir Chat IA</span>
            </button>

            <button
              onClick={() => setShowJobGenModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-amber-300" />
              <span>Criar Vaga IA</span>
            </button>

            <button
              onClick={() => setShowInterviewModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" />
              <span>Roteiro Entrevista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 6 Module Section Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-2 pb-1">
        
        {/* Tab 1: Dashboard IA */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>1. Dashboard IA</span>
        </button>

        {/* Tab 2: Análise de Candidatos */}
        <button
          onClick={() => setActiveTab('analise_candidatos')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'analise_candidatos'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Análise de Candidatos</span>
        </button>

        {/* Tab 3: Triagem IA por Vaga */}
        <button
          onClick={() => setActiveTab('triagem_vaga')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'triagem_vaga'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>3. Triagem IA por Vaga</span>
        </button>

        {/* Tab 4: Assistente IA */}
        <button
          onClick={() => setActiveTab('assistente_ia')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'assistente_ia'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Bot className="w-4 h-4 text-amber-300" />
          <span>5. Assistente IA</span>
        </button>

        {/* Tab 5: Relatórios IA */}
        <button
          onClick={() => setActiveTab('relatorios')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'relatorios'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>6. Relatórios IA</span>
        </button>

        {/* Tab 6: Ranking IA */}
        <button
          onClick={() => setActiveTab('ranking')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'ranking'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-300" />
          <span>Ranking IA</span>
        </button>

        {/* Tab 7: Configurações & Consumo IA */}
        <button
          onClick={() => setActiveTab('configuracoes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'configuracoes'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-blue-300" />
          <span>7. Configurações & Consumo</span>
        </button>

      </div>

      {/* Tab Render Switch */}
      {activeTab === 'dashboard' && (
        <AiDashboardView
          onNavigateToScreening={() => setActiveTab('triagem_vaga')}
          onNavigateToCandidates={() => setActiveTab('analise_candidatos')}
          onOpenJobGenModal={() => setShowJobGenModal(true)}
          onOpenChatModal={() => setActiveTab('assistente_ia')}
          onOpenInterviewModal={() => setShowInterviewModal(true)}
        />
      )}

      {activeTab === 'analise_candidatos' && <CandidateAnalysisView />}

      {activeTab === 'triagem_vaga' && <AiScreeningByJobView />}

      {activeTab === 'assistente_ia' && <AiAssistantChatView />}

      {activeTab === 'relatorios' && <AiReportsView />}

      {activeTab === 'ranking' && <CandidateRankingView />}

      {activeTab === 'configuracoes' && <AiSettingsAndUsageView />}

      {/* Modals */}
      <JobGeneratorModal
        isOpen={showJobGenModal}
        onClose={() => setShowJobGenModal(false)}
      />

      <InterviewAssistantModal
        isOpen={showInterviewModal}
        onClose={() => setShowInterviewModal(false)}
      />

    </div>
  );
};
