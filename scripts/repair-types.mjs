import fs from 'node:fs';

const edits = [];
function patch(path, transform) {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(path, after, 'utf8');
    edits.push(path);
  }
}
function replaceAll(source, from, to) {
  return source.split(from).join(to);
}

patch('src/dashboard/components/MainDashboardView.tsx', (s) => {
  s = replaceAll(s, 'metrics.totalOpenJobs', 'metrics.activeJobsCount');
  s = replaceAll(s, 'metrics.activeProcesses', 'metrics.candidatesInProcessCount');
  s = replaceAll(s, 'metrics.scheduledInterviews', 'metrics.interviewsScheduledCount');
  s = replaceAll(s, 'metrics.slaAvgDays', 'metrics.avgTimeToHireDays');
  if (!s.includes('offerAcceptanceRate: 0')) {
    s = s.replace('    slaTargetDays: 30,\n  });', '    slaTargetDays: 30,\n    offerAcceptanceRate: 0,\n  });');
  }
  if (!s.includes('offerAcceptanceRate: proposta > 0')) {
    s = s.replace('        slaTargetDays: 30,\n      });', "        slaTargetDays: 30,\n        offerAcceptanceRate: proposta > 0 ? Math.min(100, Math.round((candidates.filter(c => String((c as any).status || '').toLowerCase() === 'contratado').length / proposta) * 100)) : 0,\n      });");
  }
  return s;
});

patch('src/departamento-pessoal/components/CadastroColaboradores.tsx', (s) =>
  replaceAll(s, "setProfileTab('dados')", "setProfileTab('cadastrais')")
);

patch('src/departamento-pessoal/components/admissao/OfficialAdmissaoFlowModal.tsx', (s) => {
  if (!s.includes('const efetivadoId =')) {
    s = s.replace(
      "      const efetivado = await onEfetivarAdmissao(finalAdmission, {\n        gestor: formData.gestor,\n        escala: formData.jornada,\n        bancoAgencia: `${formData.dadosBancarios?.banco} | Ag ${formData.dadosBancarios?.agencia} | C/C ${formData.dadosBancarios?.conta}`,\n        rg: formData.rg\n      });",
      "      const efetivado = await onEfetivarAdmissao(finalAdmission, {\n        gestor: formData.gestor,\n        escala: formData.jornada,\n        bancoAgencia: `${formData.dadosBancarios?.banco} | Ag ${formData.dadosBancarios?.agencia} | C/C ${formData.dadosBancarios?.conta}`,\n        rg: formData.rg\n      });\n      const efetivadoId = efetivado && typeof efetivado === 'object' && 'id' in efetivado\n        ? String((efetivado as { id?: unknown }).id || '')\n        : '';"
    );
  }
  s = replaceAll(s, 'efetivado?.id', 'efetivadoId');
  return s;
});

patch('src/departamento-pessoal/components/rescisao/DocumentosAssinaturaTab.tsx', (s) =>
  s.replace("const renderDocumentText = (type: 'TRCT' | 'AVISO' | 'QUITACAO') =>", "const renderDocumentText = (type: 'TRCT' | 'AVISO' | 'QUITACAO' | 'ASO') =>")
);

patch('src/ai/components/ContextualAiModal.tsx', (s) => {
  s = s.replace('  onExecute: () => Promise<any>;\n', '  onExecute?: () => Promise<any>;\n  getAnalysis?: () => Promise<any>;\n  contextType?: string;\n');
  s = s.replace('  onExecute,\n  onApply,', '  onExecute,\n  getAnalysis,\n  onApply,');
  s = s.replace('      const res = await onExecute();', "      const executor = onExecute || getAnalysis;\n      if (!executor) throw new Error('Nenhuma função de análise foi informada.');\n      const res = await executor();");
  return s;
});

patch('src/headhunter/HeadhunterView.tsx', (s) => {
  if (!s.includes("  | 'projetos'\n")) s = s.replace("  | 'apresentacoes';", "  | 'apresentacoes'\n  | 'projetos';");
  s = s.replace("job={jobs[0] || { id: 'vaga-0', titulo: 'Vaga Selecionada', origemProcesso: 'headhunter' }}", "job={jobs[0] || ({ id: 'vaga-0', titulo: 'Vaga Selecionada', origemProcesso: 'headhunter' } as UnifiedJob)}");
  return s;
});

patch('src/headhunter/components/HeadhunterCandidatos.tsx', (s) =>
  s.replace('    const updated = { \n      ...cand, \n      convertidoCandidatoOficial: true,', '    const updated: HeadhunterCandidate = { \n      ...cand, \n      convertidoCandidatoOficial: true,')
);

patch('src/headhunter/components/HeadhunterComercial.tsx', (s) =>
  s.replace("l.etapa === stage || (stage === 'Novo lead' && (!l.etapa || l.etapa === 'Lead'))", "l.etapa === stage || (stage === 'Novo lead' && !l.etapa)")
);

patch('src/interviews/components/InterviewScheduleModal.tsx', (s) =>
  s.replace('const [stageName, setStageName] = useState(INTERVIEW_STAGE_OPTIONS[1]);', 'const [stageName, setStageName] = useState<string>(INTERVIEW_STAGE_OPTIONS[1]);')
);

patch('src/jobs/components/JobCandidatesManagementView.tsx', (s) =>
  replaceAll(s, "c.status === 'Novo'", "c.status === 'Novos'")
);

patch('src/jobs/components/JobFormModal.tsx', (s) => {
  if (!s.includes('comissaoNegociadaPercent?: number;')) {
    s = s.replace('  empresaId?: string;\n}', '  empresaId?: string;\n  comissaoNegociadaPercent?: number;\n  valorPadraoVaga?: number;\n  prazoPagamentoDias?: number;\n  formaCobranca?: string;\n}');
  }
  return s;
});

patch('src/jobs/components/JobsManagementView.tsx', (s) =>
  s.replace('<JobCandidatesManagementView jobId={selectedJobForCandidates.id} jobTitle={selectedJobForCandidates.title} />', '<JobCandidatesManagementView job={selectedJobForCandidates} />')
);

patch('src/jobs/components/ScheduleInterviewModal.tsx', (s) =>
  s.replace("setStatus(initialData?.status || (initialData?.date ? 'Reagendada' : 'Agendada'));", "setStatus((initialData?.status as 'Agendada' | 'Reagendada' | 'Realizada' | 'Cancelada' | undefined) || (initialData?.date ? 'Reagendada' : 'Agendada'));" )
);

patch('src/organization/components/OrganizationManagementView.tsx', (s) => {
  const oldBlock = `      id: user?.empresaId || 'emp-default',\n      name: 'Sua Empresa',\n      legalName: 'Razão Social',\n      cnpj: '00.000.000/0001-00',\n      industry: 'Tecnologia',\n      headquarters: 'Brasil',\n      website: '',\n      employeeCountTotal: 0,\n      activeDepartmentsCount: 0,\n      totalMonthlyBudget: 0,\n      currency: 'BRL',\n      updatedAt: new Date().toISOString()`;
  const newBlock = `      id: user?.empresaId || 'emp-default',\n      name: 'Sua Empresa',\n      tradingName: 'Sua Empresa',\n      cnpj: '00.000.000/0001-00',\n      isVerified: false,\n      address: { street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '' },\n      contact: { email: user?.email || '', phone: '', website: '' },\n      industryCategory: 'Não informado'`;
  return s.replace(oldBlock, newBlock);
});

patch('src/types/rh.ts', (s) =>
  s.replace("export type StageId = 'inscritos' | 'triagem' | 'entrevista_rh' | 'teste_tecnico' | 'entrevista_gestor' | 'proposta' | 'contratado';", "export type StageId = 'inscritos' | 'triagem' | 'entrevista_rh' | 'teste_tecnico' | 'entrevista_gestor' | 'proposta' | 'contratado' | 'banco-talentos';")
);

patch('src/services/JobCandidateService.ts', (s) => {
  if (!s.includes('  avatar?: string;\n')) s = s.replace('  photo?: string;\n', '  photo?: string;\n  avatar?: string;\n');
  s = s.replace("      compatibilityLevel: appData.compatibilityLevel || '',", "      compatibilityLevel: appData.compatibilityLevel || ((Number(appData.compatibilityScore ?? 0) >= 85) ? 'Muito compatível' : (Number(appData.compatibilityScore ?? 0) >= 65) ? 'Compatível' : 'Baixa compatibilidade'),");
  return s;
});

patch('src/services/JobService.ts', (s) =>
  s.replace('normalizeJobData({ ...d.data(), id: d.id })', 'normalizeJobData({ ...(d.data() as Record<string, unknown>), id: d.id })')
);

patch('src/subscriptions/SubscriptionsView.tsx', (s) =>
  s.replace('        siteVagasPersonalizado: true\n      },', '        siteVagasPersonalizado: true,\n        implantacaoMigracao: true\n      },')
);

patch('src/talent-bank/components/CandidateClassificationBadge.tsx', (s) => {
  if (!s.includes("'Alto potencial':")) s = s.replace("    'Alto Potencial': 'bg-indigo-50 text-indigo-800 border-indigo-200',", "    'Alto Potencial': 'bg-indigo-50 text-indigo-800 border-indigo-200',\n    'Alto potencial': 'bg-indigo-50 text-indigo-800 border-indigo-200',");
  if (!s.includes("'Indisponível':")) s = s.replace("    'Desqualificado': 'bg-rose-50 text-rose-700 border-rose-200',", "    'Desqualificado': 'bg-rose-50 text-rose-700 border-rose-200',\n    'Indisponível': 'bg-slate-100 text-slate-600 border-slate-200',");
  return s;
});

console.log(`Updated ${edits.length} files`);
for (const file of edits) console.log(`- ${file}`);
