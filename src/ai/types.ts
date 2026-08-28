export interface IaAnalise {
  id: string;
  empresaId: string;
  vagaId: string;
  candidatoId: string;
  candidatoNome?: string;
  vagaTitulo?: string;
  pontuacao: number; // 0 a 100
  analise: string;
  parecer: string;
  pontosFortes: string[];
  pontosAtencao: string[];
  recomendacao: 'Altamente Recomendado' | 'Recomendado' | 'Em Avaliação' | 'Não Aprovado';
  dataCriacao: string;
}

export interface JobAiGenerationResult {
  title: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
}

export interface InterviewAssistantResult {
  perguntas?: Array<{
    pergunta: string;
    foco: string;
    dicaAvaliacao: string;
  }>;
  resumo?: string;
  avaliacao?: string;
  pontosPositivos?: string[];
  pontosNegativos?: string[];
  parecerFinal?: string;
}

export interface CandidateRanked {
  candidatoId: string;
  nome: string;
  cargoAtual: string;
  pontuacao: number;
  recomendacao: string;
  pontosFortes: string[];
  pontosAtencao: string[];
  parecer: string;
}
