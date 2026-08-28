import { Candidate } from '../../types/rh';
import { Job } from '../../jobs/types/job';

export interface TalentMatchResult {
  candidateId: string;
  candidate: Candidate & Record<string, any>;
  objectiveScore: number;
  score: number;
  strengths: string[];
  attentionPoints: string[];
  matchedTerms: string[];
  provider?: 'openai' | 'gemini' | 'objective';
  model?: string;
  alreadyLinked?: boolean;
}

const normalize = (value: unknown): string => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9+#.]+/g, ' ')
  .trim();

const tokens = (value: unknown): string[] => normalize(value)
  .split(/\s+/)
  .filter(term => term.length >= 2);

const asList = (...values: unknown[]): string[] => values.flatMap(value => {
  if (Array.isArray(value)) return value.flatMap(item => asList(item));
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).flatMap(item => asList(item));
  return String(value || '').split(/[,;|\n]/).map(item => item.trim()).filter(Boolean);
});

const overlap = (left: string[], right: string[]) => {
  const leftTokens = new Set(left.flatMap(tokens));
  const rightTokens = new Set(right.flatMap(tokens));
  const matches = [...leftTokens].filter(term => rightTokens.has(term));
  return {
    ratio: leftTokens.size ? matches.length / leftTokens.size : 0,
    matches,
  };
};

const parseMoney = (value: unknown): number | null => {
  const text = String(value || '').replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const seniorityYears = (job: Job & Record<string, any>): number | null => {
  const source = normalize([job.senioridade, job.title, job.titulo, job.description, job.descricao].join(' '));
  if (/senior|especialista|coordenador|gerente/.test(source)) return 5;
  if (/pleno/.test(source)) return 3;
  if (/junior|auxiliar|assistente/.test(source)) return 1;
  return null;
};

export function calculateObjectiveTalentMatch(
  jobInput: Job & Record<string, any>,
  candidateInput: Candidate & Record<string, any>,
): TalentMatchResult {
  const job = jobInput;
  const candidate = candidateInput;
  let earned = 0;
  let possible = 0;
  const strengths: string[] = [];
  const attentionPoints: string[] = [];
  const matchedTerms = new Set<string>();

  const jobRole = asList(job.title, job.titulo, job.cargo, job.department, job.area);
  const candidateRole = asList(candidate.role, candidate.cargo, candidate.departmentArea, candidate.area, candidate.objective);
  if (jobRole.length && candidateRole.length) {
    possible += 22;
    const roleMatch = overlap(jobRole, candidateRole);
    const roleScore = Math.min(1, roleMatch.ratio * 2.5);
    earned += 22 * roleScore;
    roleMatch.matches.forEach(term => matchedTerms.add(term));
    if (roleScore >= 0.45) strengths.push('Cargo ou área profissional compatível com a vaga');
    else attentionPoints.push('Cargo ou área com baixa correspondência objetiva');
  }

  const jobSkills = asList(
    job.requirements, job.requisitos, job.requisitosObrigatorios, job.requisitosDesejaveis,
    job.competencias, job.conhecimentosTecnicos, job.description, job.descricao,
  );
  const candidateSkills = asList(
    candidate.skills, candidate.competencias, candidate.conhecimentosTecnicos,
    candidate.certificacoes, candidate.resumeKeywords, candidate.notes,
    candidate.workHistory, candidate.curriculoTexto,
  );
  if (jobSkills.length && candidateSkills.length) {
    possible += 32;
    const skillMatch = overlap(jobSkills, candidateSkills);
    earned += 32 * Math.min(1, skillMatch.ratio * 2.2);
    skillMatch.matches.forEach(term => matchedTerms.add(term));
    if (skillMatch.matches.length) {
      strengths.push(`Competências aderentes: ${skillMatch.matches.slice(0, 5).join(', ')}`);
    } else {
      attentionPoints.push('Competências obrigatórias não identificadas nos dados cadastrados');
    }
  }

  const requiredYears = Number(job.experienceYears || job.experienciaMinima || seniorityYears(job));
  const candidateYears = Number(candidate.experienceYears || candidate.anosExperiencia || 0);
  if (requiredYears > 0 || candidateYears > 0) {
    possible += 14;
    const expRatio = requiredYears > 0 ? Math.min(1, candidateYears / requiredYears) : Math.min(1, candidateYears / 3);
    earned += 14 * expRatio;
    if (candidateYears >= (requiredYears || 1)) strengths.push(`${candidateYears} ano(s) de experiência informada`);
    else attentionPoints.push(`Experiência informada abaixo dos ${requiredYears} ano(s) esperados`);
  }

  const jobEducation = asList(job.formacao, job.escolaridade, job.certificacoes, job.idiomas);
  const candidateEducation = asList(candidate.education, candidate.educationHistory, candidate.formacao, candidate.certificacoes, candidate.idiomas);
  if (jobEducation.length && candidateEducation.length) {
    possible += 10;
    const educationMatch = overlap(jobEducation, candidateEducation);
    earned += 10 * Math.min(1, educationMatch.ratio * 2.5);
    educationMatch.matches.forEach(term => matchedTerms.add(term));
    if (educationMatch.matches.length) strengths.push('Formação, certificação ou idioma compatível');
    else attentionPoints.push('Formação, certificações ou idiomas precisam ser validados');
  }

  const jobLocation = normalize([job.location, job.cidade, job.estado].join(' '));
  const candidateLocation = normalize([candidate.location, candidate.city, candidate.state].join(' '));
  const remote = normalize([job.locationType, job.modalidade].join(' ')).includes('remoto');
  if (jobLocation && candidateLocation) {
    possible += 8;
    const locationMatches = remote || overlap([jobLocation], [candidateLocation]).matches.length > 0;
    earned += locationMatches ? 8 : 0;
    if (locationMatches) strengths.push(remote ? 'Modalidade remota compatível' : 'Localização compatível');
    else attentionPoints.push('Localização diferente da vaga');
  }

  const availability = normalize(candidate.availability || candidate.disponibilidade);
  if (availability) {
    possible += 5;
    const available = !/indisponivel|nao disponivel/.test(availability);
    earned += available ? 5 : 0;
    if (available) strengths.push(`Disponibilidade informada: ${candidate.availability || candidate.disponibilidade}`);
    else attentionPoints.push('Disponibilidade incompatível');
  }

  const salary = parseMoney(candidate.salaryExpectation || candidate.pretensaoSalarial);
  const jobSalary = parseMoney(job.salaryRange || job.salario || job.faixaSalarialMax);
  if (salary && jobSalary) {
    possible += 9;
    const compatible = salary <= jobSalary * 1.1;
    earned += compatible ? 9 : Math.max(0, 9 * (jobSalary / salary));
    if (compatible) strengths.push('Pretensão salarial compatível com a faixa informada');
    else attentionPoints.push('Pretensão salarial acima da faixa da vaga');
  }

  const score = possible > 0 ? Math.max(0, Math.min(100, Math.round((earned / possible) * 100))) : 0;
  if (!attentionPoints.length && possible < 40) attentionPoints.push('Cadastro possui poucos dados para uma comparação mais completa');

  return {
    candidateId: candidate.id,
    candidate,
    objectiveScore: score,
    score,
    strengths: [...new Set(strengths)].slice(0, 5),
    attentionPoints: [...new Set(attentionPoints)].slice(0, 4),
    matchedTerms: [...matchedTerms].slice(0, 12),
    provider: 'objective',
  };
}

export function rankTalentBankCandidates(
  job: Job & Record<string, any>,
  candidates: Array<Candidate & Record<string, any>>,
  companyId: string,
  linkedCandidateIds: Set<string> = new Set(),
): TalentMatchResult[] {
  if (!companyId) throw new Error('empresaId é obrigatório para calcular matches.');
  const jobCompanyId = String(job.empresaId || job.companyId || '');
  if (!jobCompanyId || jobCompanyId !== companyId) throw new Error('A vaga não pertence à empresa autenticada.');

  return candidates
    .filter(candidate => String(candidate.companyId || candidate.empresaId || '') === companyId)
    .filter(candidate => !['Contratado', 'Indisponível'].includes(String(candidate.status || '')))
    .map(candidate => ({
      ...calculateObjectiveTalentMatch(job, candidate),
      alreadyLinked: linkedCandidateIds.has(candidate.id),
    }))
    .filter(result => result.score >= 35)
    .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name, 'pt-BR'));
}

