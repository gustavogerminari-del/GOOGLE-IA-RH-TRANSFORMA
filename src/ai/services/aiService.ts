import { AuditService } from '../../services/AuditService';
import { AIService } from './centralAiService';

interface AiActionRequest {
  action: string;
  module: string;
  data: any;
  companyId?: string;
  userEmail?: string;
}

export interface AiActionResponse<T = any> {
  success: boolean;
  module: string;
  action: string;
  result: string;
  structuredData?: T;
}

// Centralized execution helper
async function callAiAction<T = any>(params: AiActionRequest): Promise<AiActionResponse<T>> {
  try {
    if (!params.companyId) throw new Error('Empresa não identificada para utilizar a IA.');
    const response = await AIService.execute<T>(params.action, params.companyId, params.data);

    // Log use of AI in Audit Trail safely
    try {
      await AuditService.log({
        action: 'UPDATE',
        moduleName: `IA:${params.module.toUpperCase()}` as any,
        description: `Ação de IA executada: "${params.action}" no contexto ${params.module}`,
        targetEntity: 'Inteligência Artificial',
        companyId: params.companyId,
      });
    } catch (e) {
      console.warn('Audit log error for AI action:', e);
    }

    return {
      success: true,
      module: params.module,
      action: params.action,
      result: JSON.stringify(response.data),
      structuredData: response.data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível concluir a análise por IA no momento. Tente novamente.';
    return {
      success: false,
      module: params.module,
      action: params.action,
      result: message,
    };
  }
}

// 1. RECRUTAMENTO E SELEÇÃO (VAGAS)
export const recruitmentAiService = {
  async generateJobDescription(data: { cargo: string; departamento?: string; nivel?: string; prompt?: string; requisitosExistentes?: string[]; companyId?: string }) {
    return callAiAction({ action: 'gerar_descricao_vaga', module: 'recrutamento', data, companyId: data.companyId });
  },

  async improveJobDescription(data: { title: string; summary?: string; requirements?: string[]; companyId?: string }) {
    return callAiAction({ action: 'melhorar_descricao_vaga', module: 'recrutamento', data, companyId: data.companyId });
  },

  async generateRequirements(data: { cargo: string; departamento?: string; companyId?: string }) {
    return callAiAction({ action: 'gerar_requisitos', module: 'recrutamento', data, companyId: data.companyId });
  },

  async generateSkills(data: { cargo: string; departamento?: string; companyId?: string }) {
    return callAiAction({ action: 'gerar_competencias', module: 'recrutamento', data, companyId: data.companyId });
  },

  async suggestSalaryAndProfile(data: { cargo: string; departamento?: string; companyId?: string }) {
    return callAiAction({ action: 'sugerir_faixa_perfil', module: 'recrutamento', data, companyId: data.companyId });
  },

  async generateScreeningQuestions(data: { cargo: string; departamento?: string; companyId?: string }) {
    return callAiAction({ action: 'criar_perguntas_triagem', module: 'recrutamento', data, companyId: data.companyId });
  },
};

// 2. CANDIDATOS
export const candidateAiService = {
  async analyzeResume(data: { vagaTitle: string; vagaRequisitos?: string[]; candidatoNome: string; curriculoTexto: string; companyId?: string }) {
    return callAiAction({ action: 'analisar_curriculo', module: 'candidatos', data, companyId: data.companyId });
  },

  async summarizeCandidate(data: { candidatoNome: string; resumo?: string; skills?: string[]; companyId?: string }) {
    return callAiAction({ action: 'resumir_candidato', module: 'candidatos', data, companyId: data.companyId });
  },

  async calculateMatch(data: { candidateName: string; jobTitle: string; requirements?: string[]; companyId?: string }) {
    return callAiAction({ action: 'calcular_compatibilidade', module: 'candidatos', data, companyId: data.companyId });
  },

  async identifySkills(data: { candidateName: string; resumeText?: string; companyId?: string }) {
    return callAiAction({ action: 'identificar_competencias', module: 'candidatos', data, companyId: data.companyId });
  },

  async identifyStrengthsAndPoints(data: { candidateName: string; jobTitle: string; companyId?: string }) {
    return callAiAction({ action: 'identificar_pontos_fortes_atencao', module: 'candidatos', data, companyId: data.companyId });
  },

  async generateScreeningOpinion(data: { candidateName: string; jobTitle: string; score?: number; companyId?: string }) {
    return callAiAction({ action: 'gerar_parecer_triagem', module: 'candidatos', data, companyId: data.companyId });
  },
};

// 3. ENTREVISTAS
export const interviewAiService = {
  async createInterviewGuide(data: { cargo: string; candidatoNome?: string; tipo?: string; companyId?: string }) {
    return callAiAction({ action: 'criar_roteiro_entrevista', module: 'entrevistas', data, companyId: data.companyId });
  },

  async suggestQuestions(data: { cargo: string; departamento?: string; companyId?: string }) {
    return callAiAction({ action: 'sugerir_perguntas_entrevista', module: 'entrevistas', data, companyId: data.companyId });
  },

  async summarizeInterview(data: { candidatoNome: string; cargo: string; resumoEntrevista: string; companyId?: string }) {
    return callAiAction({ action: 'resumir_conversa_entrevista', module: 'entrevistas', data, companyId: data.companyId });
  },

  async generateFeedbackAndOpinion(data: { candidatoNome: string; cargo: string; notas?: string; companyId?: string }) {
    return callAiAction({ action: 'gerar_feedback_parecer', module: 'entrevistas', data, companyId: data.companyId });
  },

  async compareCandidates(data: { candidatos: any[]; vagaTitle: string; companyId?: string }) {
    return callAiAction({ action: 'comparar_candidatos', module: 'entrevistas', data, companyId: data.companyId });
  },
};

// 4. BANCO DE TALENTOS
export const talentBankAiService = {
  async findMatchingCandidates(data: { job: any; candidates: any[]; companyId?: string }) {
    return callAiAction({ action: 'encontrar_candidatos_compativeis', module: 'banco-talentos', data, companyId: data.companyId });
  },

  async suggestJobsForCandidate(data: { candidate: any; jobs: any[]; companyId?: string }) {
    return callAiAction({ action: 'sugerir_vagas_candidato', module: 'banco-talentos', data, companyId: data.companyId });
  },

  async summarizeResume(data: { candidateName: string; resumeText?: string; companyId?: string }) {
    return callAiAction({ action: 'resumir_curriculo', module: 'banco-talentos', data, companyId: data.companyId });
  },

  async extractSkills(data: { candidateName: string; resumeText?: string; companyId?: string }) {
    return callAiAction({ action: 'extrair_competencias', module: 'banco-talentos', data, companyId: data.companyId });
  },

  async classifyProfile(data: { candidate: any; companyId?: string }) {
    return callAiAction({ action: 'classificar_perfil', module: 'banco-talentos', data, companyId: data.companyId });
  },

  async detectDuplicates(data: { candidate: any; existingCandidates: any[]; companyId?: string }) {
    return callAiAction({ action: 'detectar_duplicidades', module: 'banco-talentos', data, companyId: data.companyId });
  },
};

// 5. COLABORADORES
export const employeeAiService = {
  async summarizeEmployeeHistory(data: { employee: any; companyId?: string }) {
    return callAiAction({ action: 'resumir_historico_colaborador', module: 'colaboradores', data, companyId: data.companyId });
  },

  async identifyPendingDocuments(data: { employee: any; companyId?: string }) {
    return callAiAction({ action: 'identificar_documentos_pendentes', module: 'colaboradores', data, companyId: data.companyId });
  },

  async suggestTrainings(data: { employee: any; roleName?: string; companyId?: string }) {
    return callAiAction({ action: 'sugerir_treinamentos', module: 'colaboradores', data, companyId: data.companyId });
  },

  async generateAnnouncement(data: { topic: string; targetAudience?: string; companyName?: string; companyId?: string }) {
    return callAiAction({ action: 'gerar_comunicado', module: 'colaboradores', data, companyId: data.companyId });
  },

  async generateJobDescription(data: { roleName: string; department?: string; companyId?: string }) {
    return callAiAction({ action: 'gerar_descricao_cargo', module: 'colaboradores', data, companyId: data.companyId });
  },

  async suggestDevelopmentPlan(data: { employee: any; goal?: string; companyId?: string }) {
    return callAiAction({ action: 'sugerir_pdi', module: 'colaboradores', data, companyId: data.companyId });
  },
};

// 6. PONTO DIGITAL
export const timeTrackingAiService = {
  async analyzeDelays(data: { records: any[]; companyId?: string }) {
    return callAiAction({ action: 'analisar_atrasos', module: 'ponto-digital', data, companyId: data.companyId });
  },

  async identifyAbsences(data: { records: any[]; companyId?: string }) {
    return callAiAction({ action: 'identificar_faltas', module: 'ponto-digital', data, companyId: data.companyId });
  },

  async detectInconsistencies(data: { records: any[]; companyId?: string }) {
    return callAiAction({ action: 'detectar_inconsistencias_ponto', module: 'ponto-digital', data, companyId: data.companyId });
  },

  async calculateOvertimeImpact(data: { records: any[]; hourlyRate?: number; companyId?: string }) {
    return callAiAction({ action: 'calcular_horas_extras_impacto', module: 'ponto-digital', data, companyId: data.companyId });
  },

  async suggestCorrections(data: { record: any; companyId?: string }) {
    return callAiAction({ action: 'sugerir_correcoes_ponto', module: 'ponto-digital', data, companyId: data.companyId });
  },

  async explainDivergences(data: { record: any; companyId?: string }) {
    return callAiAction({ action: 'explicar_divergencias_ponto', module: 'ponto-digital', data, companyId: data.companyId });
  },
};

// 7. DEPARTAMENTO PESSOAL, ADMISSÃO & RESCISÃO
export const dpAiService = {
  async checkAdmissionForm(data: { candidateOrEmployee: any; companyId?: string }) {
    return callAiAction({ action: 'conferir_cadastro_admissao', module: 'departamento-pessoal', data, companyId: data.companyId });
  },

  async createAdmissionChecklist(data: { roleName: string; department?: string; companyId?: string }) {
    return callAiAction({ action: 'criar_checklist_admissao', module: 'departamento-pessoal', data, companyId: data.companyId });
  },

  async generateProcessSummary(data: { processName: string; details: any; companyId?: string }) {
    return callAiAction({ action: 'gerar_resumo_processo_dp', module: 'departamento-pessoal', data, companyId: data.companyId });
  },

  async createTerminationChecklist(data: { employeeName: string; roleName?: string; reason?: string; companyId?: string }) {
    return callAiAction({ action: 'criar_checklist_rescisao', module: 'rescisao', data, companyId: data.companyId });
  },

  async checkTerminationData(data: { employeeName: string; details: any; companyId?: string }) {
    return callAiAction({ action: 'conferir_dados_rescisao_pendencias', module: 'rescisao', data, companyId: data.companyId });
  },
};

// 8. BENEFÍCIOS
export const benefitsAiService = {
  async checkEligibility(data: { employeeName: string; benefitName: string; companyId?: string }) {
    return callAiAction({ action: 'conferir_elegibilidade_beneficio', module: 'beneficios', data, companyId: data.companyId });
  },

  async detectUnregisteredBenefits(data: { employees: any[]; benefits: any[]; companyId?: string }) {
    return callAiAction({ action: 'detectar_beneficio_nao_cadastrado', module: 'beneficios', data, companyId: data.companyId });
  },

  async suggestBenefits(data: { companySize?: number; segment?: string; companyId?: string }) {
    return callAiAction({ action: 'sugerir_beneficios', module: 'beneficios', data, companyId: data.companyId });
  },

  async generateUsageReport(data: { benefitsData: any[]; companyId?: string }) {
    return callAiAction({ action: 'gerar_relatorio_utilizacao_beneficios', module: 'beneficios', data, companyId: data.companyId });
  },
};

// 9. FÉRIAS
export const vacationAiService = {
  async alertExpiredVacations(data: { employees: any[]; companyId?: string }) {
    return callAiAction({ action: 'alertar_ferias_vencidas', module: 'ferias', data, companyId: data.companyId });
  },

  async suggestVacationPeriods(data: { employeeName: string; department?: string; companyId?: string }) {
    return callAiAction({ action: 'sugerir_periodos_ferias', module: 'ferias', data, companyId: data.companyId });
  },

  async detectTeamConflicts(data: { teamVacations: any[]; department: string; companyId?: string }) {
    return callAiAction({ action: 'identificar_conflito_ferias_equipe', module: 'ferias', data, companyId: data.companyId });
  },

  async generateVacationAnnouncement(data: { employeeName: string; period: string; companyId?: string }) {
    return callAiAction({ action: 'criar_comunicado_ferias', module: 'ferias', data, companyId: data.companyId });
  },
};

// 10. DOCUMENTOS
export const documentsAiService = {
  async classifyDocument(data: { fileName: string; textContent?: string; companyId?: string }) {
    return callAiAction({ action: 'classificar_documento', module: 'documentos', data, companyId: data.companyId });
  },

  async summarizeDocument(data: { documentName: string; textContent?: string; companyId?: string }) {
    return callAiAction({ action: 'resumir_documento', module: 'documentos', data, companyId: data.companyId });
  },

  async extractInfo(data: { documentName: string; textContent?: string; companyId?: string }) {
    return callAiAction({ action: 'extrair_informacoes_documento', module: 'documentos', data, companyId: data.companyId });
  },

  async identifyExpiration(data: { documents: any[]; companyId?: string }) {
    return callAiAction({ action: 'identificar_vencimento_documentos', module: 'documentos', data, companyId: data.companyId });
  },

  async detectMissingDocuments(data: { employeeName: string; uploadedDocs: string[]; companyId?: string }) {
    return callAiAction({ action: 'detectar_documento_ausente', module: 'documentos', data, companyId: data.companyId });
  },

  async suggestNameAndCategory(data: { fileName: string; snippet?: string; companyId?: string }) {
    return callAiAction({ action: 'sugerir_nome_categoria_documento', module: 'documentos', data, companyId: data.companyId });
  },
};

// 11. RELATÓRIOS
export const reportsAiService = {
  async interpretIndicators(data: { metrics: any; companyId?: string }) {
    return callAiAction({ action: 'interpretar_indicadores', module: 'relatorios', data, companyId: data.companyId });
  },

  async explainCharts(data: { chartName: string; chartValues: any; companyId?: string }) {
    return callAiAction({ action: 'explicar_grafico', module: 'relatorios', data, companyId: data.companyId });
  },

  async identifyTrends(data: { historicalMetrics: any; companyId?: string }) {
    return callAiAction({ action: 'identificar_tendencias', module: 'relatorios', data, companyId: data.companyId });
  },

  async detectChanges(data: { currentData: any; previousData: any; companyId?: string }) {
    return callAiAction({ action: 'detectar_alteracoes_importantes', module: 'relatorios', data, companyId: data.companyId });
  },

  async generateExecutiveSummary(data: { period: string; metrics: any; companyId?: string }) {
    return callAiAction({ action: 'gerar_resumo_executivo', module: 'relatorios', data, companyId: data.companyId });
  },

  async createRecommendations(data: { hrMetrics: any; companyId?: string }) {
    return callAiAction({ action: 'criar_recomendacoes_estrategicas', module: 'relatorios', data, companyId: data.companyId });
  },
};

// 12. CONFIGURAÇÕES E CONSUMO
export const settingsAndUsageAiService = {
  async getSettings(companyId: string) {
    try {
      const res = await fetch(`/api/ai/company-settings/${companyId}`);
      return await res.json();
    } catch (err) {
      console.error('Error fetching AI settings:', err);
      return { success: false, data: null };
    }
  },

  async updateSettings(companyId: string, settings: any) {
    try {
      const res = await fetch(`/api/ai/company-settings/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      return await res.json();
    } catch (err) {
      console.error('Error updating AI settings:', err);
      return { success: false, error: 'Falha ao atualizar configurações de IA' };
    }
  },

  async getUsageDashboard(companyId?: string) {
    try {
      const url = companyId ? `/api/ai/usage-dashboard?companyId=${companyId}` : '/api/ai/usage-dashboard';
      const res = await fetch(url);
      return await res.json();
    } catch (err) {
      console.error('Error fetching AI usage dashboard:', err);
      return { success: false, data: null };
    }
  }
};

export const aiService = {
  recruitment: recruitmentAiService,
  candidate: candidateAiService,
  interview: interviewAiService,
  talentBank: talentBankAiService,
  employee: employeeAiService,
  timeTracking: timeTrackingAiService,
  dp: dpAiService,
  benefits: benefitsAiService,
  vacation: vacationAiService,
  documents: documentsAiService,
  reports: reportsAiService,
  settingsAndUsage: settingsAndUsageAiService,
};

export default aiService;
