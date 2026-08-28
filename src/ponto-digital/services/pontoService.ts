import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where 
} from '../../firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { sanitizeFirestoreData } from '../../lib/firestoreUtils';
import { 
  RegistroPontoDoc, 
  EscalaTrabalhoDoc, 
  AjustePontoDoc, 
  BancoHorasDoc, 
  FuncionarioPontoInfo, 
  ConfiguracoesPonto,
  StatusPonto
} from '../types/ponto';

const COLLECTIONS = {
  REGISTROS: 'registros_ponto',
  ESCALAS: 'escalas',
  AJUSTES: 'ajustes_ponto',
  BANCO: 'banco_horas',
  FUNCIONARIOS: 'funcionarios',
  CONFIG: 'configuracoes_ponto',
  COMPROVANTES: 'comprovantes_ponto',
  LOGS_AUDITORIA: 'logs_ponto',
  HORAS_EXTRAS: 'solicitacoes_horas_extras',
  CERCAS_VIRTUAIS: 'cercas_virtuais',
  TROCAS_ESCALA: 'trocas_escala',
  FERIADOS: 'feriados_ponto',
  FECHAMENTOS: 'fechamentos_ponto'
} as const;

// Helper to wrap firestore errors gracefully
function handleFirestoreError(error: unknown, op: string, path: string) {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('offline') || msg.includes('unavailable') || msg.includes('permission-denied')) {
    console.warn(`[Firestore Ponto - ${op} - ${path}]: Firestore indisponível ou acesso negado.`);
  } else {
    console.warn(`[Firestore Ponto - ${op} - ${path}]:`, error);
  }
}

// Default configuration template
export const DEFAULT_CONFIG: ConfiguracoesPonto = {
  empresaId: '',
  modoLocalizacao: 'perimetro',
  geofencingAtivo: false,
  latitudeCentro: -23.55052,
  longitudeCentro: -46.633308,
  raioPermitidoMetros: 500,
  exigirFoto: false,
  toleranciaAtrasoMinutos: 10,
  inicioAdicionalNoturno: '22:00',
  fimAdicionalNoturno: '05:00',
  sincronizarComFolha: true,
  dispositivosPermitidosTipo: 'qualquer',
  bancoHorasAtivo: true,
  validadeBancoHorasMeses: 6
};

// ----------------------------------------------------------------------------
// REGISTROS DE PONTO
// ----------------------------------------------------------------------------
export async function fetchRegistrosPonto(empresaId: string, dataFiltro?: string): Promise<RegistroPontoDoc[]> {
  try {
    const q = dataFiltro 
      ? query(collection(db, COLLECTIONS.REGISTROS), where('empresaId', '==', empresaId), where('data', '==', dataFiltro))
      : query(collection(db, COLLECTIONS.REGISTROS), where('empresaId', '==', empresaId));
      
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: RegistroPontoDoc[] = [];
      snap.forEach(d => list.push(d.data() as RegistroPontoDoc));
      return list;
    }
  } catch (err) {
    handleFirestoreError(err, 'get', COLLECTIONS.REGISTROS);
  }

  return [];
}

export async function salvarRegistroPonto(_registro: RegistroPontoDoc): Promise<void> {
  // RH_PONTO_API_V2
  throw new Error('PONTO_SOURCE_OF_TRUTH_EXTERNAL: marcações oficiais só podem ser criadas no sistema de Ponto independente.');
}

// ----------------------------------------------------------------------------
// ESCALAS DE TRABALHO
// ----------------------------------------------------------------------------
export async function fetchEscalasPonto(empresaId: string): Promise<EscalaTrabalhoDoc[]> {
  try {
    const q = query(collection(db, COLLECTIONS.ESCALAS), where('empresaId', '==', empresaId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: EscalaTrabalhoDoc[] = [];
      snap.forEach(d => list.push(d.data() as EscalaTrabalhoDoc));
      return list;
    }
  } catch (err) {
    handleFirestoreError(err, 'get', COLLECTIONS.ESCALAS);
  }

  return [];
}

export async function salvarEscalaPonto(escala: EscalaTrabalhoDoc): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ESCALAS, escala.id);
    await setDoc(docRef, sanitizeFirestoreData(escala), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'write', COLLECTIONS.ESCALAS);
    throw err;
  }

}

// ----------------------------------------------------------------------------
// AJUSTES DE PONTO
// ----------------------------------------------------------------------------
export async function fetchAjustesPonto(empresaId: string): Promise<AjustePontoDoc[]> {
  try {
    const q = query(collection(db, COLLECTIONS.AJUSTES), where('empresaId', '==', empresaId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: AjustePontoDoc[] = [];
      snap.forEach(d => list.push(d.data() as AjustePontoDoc));
      return list;
    }
  } catch (err) {
    handleFirestoreError(err, 'get', COLLECTIONS.AJUSTES);
  }

  return [];
}

export async function salvarAjustePonto(ajuste: AjustePontoDoc): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.AJUSTES, ajuste.id);
    await setDoc(docRef, sanitizeFirestoreData(ajuste), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'write', COLLECTIONS.AJUSTES);
    throw err;
  }

}

// ----------------------------------------------------------------------------
// BANCO DE HORAS
// ----------------------------------------------------------------------------
export async function fetchBancoHoras(empresaId: string): Promise<BancoHorasDoc[]> {
  try {
    const q = query(collection(db, COLLECTIONS.BANCO), where('empresaId', '==', empresaId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: BancoHorasDoc[] = [];
      snap.forEach(d => list.push(d.data() as BancoHorasDoc));
      return list;
    }
  } catch (err) {
    handleFirestoreError(err, 'get', COLLECTIONS.BANCO);
  }

  return [];
}

export async function salvarBancoHoras(banco: BancoHorasDoc): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.BANCO, banco.id);
    await setDoc(docRef, sanitizeFirestoreData(banco), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'write', COLLECTIONS.BANCO);
    throw err;
  }

}

// ----------------------------------------------------------------------------
// FUNCIONÁRIOS PONTO
// ----------------------------------------------------------------------------
export async function fetchFuncionariosPonto(empresaId: string): Promise<FuncionarioPontoInfo[]> {
  try {
    const q = query(collection(db, COLLECTIONS.FUNCIONARIOS), where('empresaId', '==', empresaId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: FuncionarioPontoInfo[] = [];
      snap.forEach(d => list.push(d.data() as FuncionarioPontoInfo));
      return list;
    }
  } catch (err) {
    handleFirestoreError(err, 'get', COLLECTIONS.FUNCIONARIOS);
  }

  return [];
}

export async function salvarFuncionarioPonto(func: FuncionarioPontoInfo): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.FUNCIONARIOS, func.id);
    await setDoc(docRef, sanitizeFirestoreData(func), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'write', COLLECTIONS.FUNCIONARIOS);
    throw err;
  }

}

// ----------------------------------------------------------------------------
// CONFIGURAÇÕES PONTO
// ----------------------------------------------------------------------------
export async function fetchConfiguracoesPonto(empresaId: string): Promise<ConfiguracoesPonto> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, empresaId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ConfiguracoesPonto;
    }
  } catch (err) {
    handleFirestoreError(err, 'get', COLLECTIONS.CONFIG);
  }

  return { ...DEFAULT_CONFIG, empresaId };
}

export async function salvarConfiguracoesPonto(config: ConfiguracoesPonto): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, config.empresaId);
    await setDoc(docRef, sanitizeFirestoreData(config), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'write', COLLECTIONS.CONFIG);
    throw err;
  }

}

// ----------------------------------------------------------------------------
// UTILS & CÁLCULOS AUTOMÁTICOS
// ----------------------------------------------------------------------------
export function calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

export function formatarMinutosEmHoras(minutos: number): string {
  const absMin = Math.abs(minutos);
  const h = Math.floor(absMin / 60);
  const m = absMin % 60;
  const signal = minutos < 0 ? '-' : '';
  return `${signal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}h`;
}

// ----------------------------------------------------------------------------
// VALIDATION & SEQUÊNCIA DAS MARCAÇÕES
// ----------------------------------------------------------------------------
export function validarSequenciaMarcacao(
  tipoSolicitado: 'entrada' | 'inicio_intervalo' | 'fim_intervalo' | 'saida' | 'entrada_extra' | 'saida_extra',
  marcacoesAnteriores: { type: string; timestamp: string }[]
): { valido: boolean; mensagem?: string } {
  if (!marcacoesAnteriores || marcacoesAnteriores.length === 0) {
    if (tipoSolicitado !== 'entrada' && tipoSolicitado !== 'entrada_extra') {
      return { valido: false, mensagem: 'A primeira marcação do dia deve ser de ENTRADA.' };
    }
    return { valido: true };
  }

  const ultima = marcacoesAnteriores[marcacoesAnteriores.length - 1];
  const agora = new Date().getTime();
  const ultimaTime = new Date(ultima.timestamp).getTime();

  // Impedir marcações duplicadas em menos de 30 segundos
  if (Math.abs(agora - ultimaTime) < 30000) {
    return { valido: false, mensagem: 'Aguarde pelo menos 30 segundos entre registros de ponto.' };
  }

  // Sequência padrão: entrada -> inicio_intervalo -> fim_intervalo -> saida
  if (tipoSolicitado === 'entrada' && ultima.type === 'entrada') {
    return { valido: false, mensagem: 'Já existe um registro de ENTRADA ativo.' };
  }
  if (tipoSolicitado === 'saida' && ultima.type === 'saida') {
    return { valido: false, mensagem: 'A jornada já foi FINALIZADA.' };
  }
  if (tipoSolicitado === 'inicio_intervalo' && ultima.type !== 'entrada' && ultima.type !== 'fim_intervalo') {
    return { valido: false, mensagem: 'Não é possível iniciar o intervalo sem um registro de ENTRADA.' };
  }
  if (tipoSolicitado === 'fim_intervalo' && ultima.type !== 'inicio_intervalo') {
    return { valido: false, mensagem: 'Não é possível finalizar o intervalo sem antes ter INICIADO o intervalo.' };
  }
  if (tipoSolicitado === 'saida' && ultima.type === 'inicio_intervalo') {
    return { valido: false, mensagem: 'Finalize o intervalo antes de registrar a SAÍDA.' };
  }

  return { valido: true };
}

// ----------------------------------------------------------------------------
// COMPROVANTE E LOGS DE AUDITORIA
// ----------------------------------------------------------------------------
export async function gerarComprovantePonto(_dados: {
  funcionarioNome: string; matricula: string; empresaNome: string; cnpjEmpresa?: string;
  data: string; horario: string; tipoMarcacao: any; origem: string; localizacaoStr?: string;
}): Promise<string> {
  // RH_PONTO_API_V2
  throw new Error('PONTO_RECEIPT_EXTERNAL: o comprovante oficial deve ser emitido pelo sistema de Ponto que registrou a marcação.');
}

export async function registrarLogAuditoriaPonto(log: {
  companyId: string;
  empresaId: string;
  usuarioId: string;
  usuarioNome: string;
  acao: string;
  detalhes: string;
  ip?: string;
}): Promise<void> {
  const idLog = `log-${Date.now()}`;
  const fullLog = {
    id: idLog,
    ...log,
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, COLLECTIONS.LOGS_AUDITORIA, idLog);
    await setDoc(docRef, sanitizeFirestoreData(fullLog));
  } catch (err) {
    handleFirestoreError(err, 'write', COLLECTIONS.LOGS_AUDITORIA);
    throw err;
  }
}

// ----------------------------------------------------------------------------
// SERVIÇO CENTRAL DE APURAÇÃO AUTOMÁTICA
// ----------------------------------------------------------------------------
export function apurarJornadaDiaria(registro: RegistroPontoDoc, escala?: EscalaTrabalhoDoc) {
  const horaParaMinutos = (h?: string) => {
    if (!h || !h.includes(':')) return 0;
    const [hrs, mins] = h.split(':').map(Number);
    return hrs * 60 + mins;
  };

  const entrada = horaParaMinutos(registro.horaEntrada);
  const inicioInt = horaParaMinutos(registro.inicioIntervalo);
  const fimInt = horaParaMinutos(registro.retornoIntervalo);
  const saida = horaParaMinutos(registro.horaSaida);

  let minutosTrabalhados = 0;
  let minutosIntervalo = 0;

  if (entrada > 0 && saida > 0) {
    minutosTrabalhados = (saida - entrada);
    if (inicioInt > 0 && fimInt > 0 && fimInt > inicioInt) {
      minutosIntervalo = (fimInt - inicioInt);
      minutosTrabalhados -= minutosIntervalo;
    }
  }

  const cargaPrevista = escala?.cargaDiariaMinutos || 480; // 8h por padrão
  const tolerancia = escala?.toleranciaMinutos || 10;

  let atrasoMinutos = 0;
  let horasExtrasMinutos = 0;

  const diferenca = minutosTrabalhados - cargaPrevista;
  if (diferenca > tolerancia) {
    horasExtrasMinutos = diferenca;
  } else if (diferenca < -tolerancia) {
    atrasoMinutos = Math.abs(diferenca);
  }

  // Adicional noturno (entre 22:00 e 05:00 -> 1320 e 300 mins)
  let adicionalNoturnoMinutos = 0;
  if (saida >= 1320 || entrada <= 300) {
    adicionalNoturnoMinutos = 60; // Exemplo de cálculo parcial
  }

  return {
    horasTrabalhadasMinutos: Math.max(0, minutosTrabalhados),
    horasExtrasMinutos,
    atrasoMinutos,
    adicionalNoturnoMinutos
  };
}

// ----------------------------------------------------------------------------
// HORAS EXTRAS, SOLICITAÇÕES E FECHAMENTO
// ----------------------------------------------------------------------------
export async function salvarSolicitacaoHoraExtra(solicitacao: any): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.HORAS_EXTRAS, solicitacao.id);
    await setDoc(docRef, sanitizeFirestoreData(solicitacao), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'write', COLLECTIONS.HORAS_EXTRAS);
    throw err;
  }
}

export async function fetchFechamentosPonto(empresaId: string): Promise<any[]> {
  try {
    const q = query(collection(db, COLLECTIONS.FECHAMENTOS), where('empresaId', '==', empresaId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: any[] = [];
      snap.forEach(d => list.push(d.data()));
      return list;
    }
  } catch (err) {
    handleFirestoreError(err, 'get', COLLECTIONS.FECHAMENTOS);
  }
  return [];
}

export async function fecharPeriodoPontoService(fechamento: any): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.FECHAMENTOS, fechamento.id);
    await setDoc(docRef, sanitizeFirestoreData(fechamento), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'write', COLLECTIONS.FECHAMENTOS);
    throw err;
  }
}


// RH_PONTO_API_V2 — Gateway seguro RH-MIL -> Sistema de Ponto independente.
async function pontoApiRequest<T>(pathName: string, init?: RequestInit): Promise<T> {
  const current = auth.currentUser;
  if (!current) throw new Error('Sessão expirada. Entre novamente para acessar o Ponto.');
  const token = await current.getIdToken();
  const response = await fetch(pathName, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + token,
      ...(init?.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.message || body?.error || 'Falha na integração com o sistema de Ponto.');
  return body as T;
}

export async function fetchPontoApiStatus(companyId: string) {
  const id = String(companyId || '').trim();
  if (!id) throw new Error('Empresa não identificada para a integração de Ponto.');
  return pontoApiRequest<any>('/api/ponto/status?companyId=' + encodeURIComponent(id));
}

export async function syncPontoApiSummary(companyId: string, competence: string) {
  const id = String(companyId || '').trim();
  if (!id) throw new Error('Empresa não identificada para sincronização do Ponto.');
  if (!/^\d{4}-\d{2}$/.test(competence)) throw new Error('Competência inválida para sincronização do Ponto.');
  return pontoApiRequest<any>('/api/ponto/sync', {
    method: 'POST',
    body: JSON.stringify({ companyId: id, competence }),
  });
}

export async function enviarAjustePontoApi(companyId: string, adjustment: Record<string, unknown>) {
  const id = String(companyId || '').trim();
  if (!id) throw new Error('Empresa não identificada para ajuste do Ponto.');
  return pontoApiRequest<any>('/api/ponto/adjustments', {
    method: 'POST',
    body: JSON.stringify({ companyId: id, adjustment }),
  });
}


// RH_PRONTO_RH_SSO_V4 — SSO oficial. O navegador recebe apenas a URL com código de troca curto.
export async function abrirPontoEletronicoSso(companyId: string) {
  const id = String(companyId || '').trim();
  if (!id) throw new Error('Empresa não identificada para abrir o Ponto Eletrônico.');
  return pontoApiRequest<{ success: boolean; redirectUrl: string; expiresIn?: number }>('/api/ponto/sso', {
    method: 'POST',
    body: JSON.stringify({ companyId: id }),
  });
}
