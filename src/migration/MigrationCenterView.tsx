import React, { useMemo, useState } from 'react';
import { Upload, Database, FileSpreadsheet, Cable, CheckCircle2, AlertTriangle, Download, ShieldCheck } from 'lucide-react';

// RH_IMPLANTACAO_MIGRACAO_V1
type Metodo = 'arquivo' | 'api';
type Categoria = 'colaboradores' | 'cargos_setores' | 'documentos' | 'ponto_jornada' | 'beneficios' | 'ferias_afastamentos' | 'folha' | 'rescisoes';
type Row = Record<string, string>;
type Mapping = { nome: string; cpf: string; matricula: string; email: string; telefone: string; cargo: string; setor: string; salario: string; admissao: string; status: string };

const TARGET_FIELDS: { key: keyof Mapping; label: string; aliases: string[] }[] = [
  { key: 'nome', label: 'Nome completo', aliases: ['nome', 'nome completo', 'colaborador', 'funcionario', 'funcionário'] },
  { key: 'cpf', label: 'CPF', aliases: ['cpf', 'documento'] },
  { key: 'matricula', label: 'Matrícula', aliases: ['matricula', 'matrícula', 'registro', 'codigo', 'código'] },
  { key: 'email', label: 'E-mail', aliases: ['email', 'e-mail', 'mail'] },
  { key: 'telefone', label: 'Telefone', aliases: ['telefone', 'celular', 'fone'] },
  { key: 'cargo', label: 'Cargo', aliases: ['cargo', 'funcao', 'função'] },
  { key: 'setor', label: 'Setor/Departamento', aliases: ['setor', 'departamento', 'area', 'área'] },
  { key: 'salario', label: 'Salário', aliases: ['salario', 'salário', 'remuneracao', 'remuneração'] },
  { key: 'admissao', label: 'Data de admissão', aliases: ['admissao', 'admissão', 'data admissao', 'data de admissão'] },
  { key: 'status', label: 'Status', aliases: ['status', 'situacao', 'situação'] },
];

const CATEGORIAS: { id: Categoria; label: string; desc: string }[] = [
  { id: 'colaboradores', label: 'Colaboradores', desc: 'Cadastro, matrícula, contatos e dados funcionais' },
  { id: 'cargos_setores', label: 'Cargos e setores', desc: 'Estrutura organizacional da empresa anterior' },
  { id: 'documentos', label: 'Documentos', desc: 'Contratos, ASOs, recibos e prontuário' },
  { id: 'ponto_jornada', label: 'Ponto e Jornada', desc: 'Marcações, escalas, banco de horas e espelhos' },
  { id: 'beneficios', label: 'Benefícios', desc: 'VT, VA, saúde e benefícios vigentes' },
  { id: 'ferias_afastamentos', label: 'Férias e afastamentos', desc: 'Histórico e saldos' },
  { id: 'folha', label: 'Folha', desc: 'Histórico importado para consulta e conferência' },
  { id: 'rescisoes', label: 'Rescisões', desc: 'Histórico de desligamentos' },
];

function normalize(v: string) { return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
function splitLine(line: string, delimiter: string) {
  const out: string[] = []; let current = ''; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (quoted && line[i + 1] === '"') { current += '"'; i++; } else quoted = !quoted; }
    else if (ch === delimiter && !quoted) { out.push(current.trim()); current = ''; } else current += ch;
  }
  out.push(current.trim()); return out;
}
function parseDelimited(text: string): { headers: string[]; rows: Row[] } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return { headers: [], rows: [] };
  const sample = lines[0]; const delimiters = [';', ',', '\t', '|'];
  const delimiter = delimiters.sort((a, b) => sample.split(b).length - sample.split(a).length)[0];
  const headers = splitLine(lines[0], delimiter).map((h, i) => h || ('coluna_' + (i + 1)));
  const rows = lines.slice(1).map(line => { const values = splitLine(line, delimiter); const row: Row = {}; headers.forEach((h, i) => { row[h] = values[i] || ''; }); return row; });
  return { headers, rows };
}
function autoMap(headers: string[]): Mapping {
  const result = TARGET_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {} as Mapping);
  for (const field of TARGET_FIELDS) { const found = headers.find(h => field.aliases.some(a => normalize(h) === normalize(a) || normalize(h).includes(normalize(a)))); if (found) result[field.key] = found; }
  return result;
}
function onlyDigits(v: string) { return String(v || '').replace(/\D/g, ''); }
function methodClass(active: boolean) { return 'rounded-2xl border p-5 text-left transition ' + (active ? 'border-[#1D4F7A] bg-blue-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'); }
function categoryClass(active: boolean) { return 'rounded-xl border p-4 text-left ' + (active ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'); }

export const MigrationCenterView: React.FC = () => {
  const [metodo, setMetodo] = useState<Metodo>('arquivo');
  const [sistemaOrigem, setSistemaOrigem] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>(['colaboradores']);
  const [fileName, setFileName] = useState(''); const [headers, setHeaders] = useState<string[]>([]); const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Mapping>(() => autoMap([])); const [reading, setReading] = useState(false); const [error, setError] = useState('');
  const toggleCategoria = (id: Categoria) => setCategorias(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const onFile = async (file?: File) => {
    if (!file) return; setError(''); setReading(true); setFileName(file.name);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'txt'].includes(ext || '')) { setRows([]); setHeaders([]); setError('Pré-validação automática disponível para CSV e TXT. XLS/XLSX/PDF serão tratados por importadores específicos.'); return; }
      const parsed = parseDelimited(await file.text()); if (!parsed.headers.length || !parsed.rows.length) throw new Error('Arquivo sem dados reconhecíveis.');
      setHeaders(parsed.headers); setRows(parsed.rows); setMapping(autoMap(parsed.headers));
    } catch (e) { setRows([]); setHeaders([]); setError(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.'); } finally { setReading(false); }
  };
  const validation = useMemo(() => {
    if (!rows.length) return { total: 0, validos: 0, invalidos: 0, duplicados: 0, semIdentificador: 0 };
    const ids = new Set<string>(); let validos = 0, invalidos = 0, duplicados = 0, semIdentificador = 0;
    for (const row of rows) { const cpf = mapping.cpf ? onlyDigits(row[mapping.cpf]) : ''; const matricula = mapping.matricula ? String(row[mapping.matricula] || '').trim() : ''; const nome = mapping.nome ? String(row[mapping.nome] || '').trim() : ''; const key = cpf || matricula; if (!key) semIdentificador++; if (key && ids.has(key)) duplicados++; if (key) ids.add(key); const cpfOk = !cpf || cpf.length === 11; if (nome && key && cpfOk) validos++; else invalidos++; }
    return { total: rows.length, validos, invalidos, duplicados, semIdentificador };
  }, [rows, mapping]);
  const exportPackage = () => {
    const mappedRows = rows.map(row => Object.fromEntries(TARGET_FIELDS.map(f => [f.key, mapping[f.key] ? row[mapping[f.key]] || '' : ''])));
    const payload = { versao: 1, origem: 'sistema_anterior', sistemaOrigem: sistemaOrigem || 'Não informado', criadoEm: new Date().toISOString(), metodo, categorias, arquivoOrigem: fileName, mapeamento: mapping, validacao: validation, registros: mappedRows };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'pacote-migracao-' + Date.now() + '.json'; a.click(); URL.revokeObjectURL(url);
  };
  return <div className='space-y-6'>
    <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'><div className='flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#1D4F7A]'><ShieldCheck className='h-4 w-4'/> Implantação segura</div><h1 className='mt-1 text-2xl font-black text-slate-900'>Implantação e Migração</h1><p className='mt-1 text-sm text-slate-500'>Traga os dados da empresa anterior com origem, mapeamento e validação antes da importação definitiva.</p></div>
    <div className='grid gap-4 md:grid-cols-2'><button onClick={() => setMetodo('arquivo')} className={methodClass(metodo === 'arquivo')}><FileSpreadsheet className='h-6 w-6 text-[#1D4F7A]'/><div className='mt-3 font-black'>Importação por arquivo</div></button><button onClick={() => setMetodo('api')} className={methodClass(metodo === 'api')}><Cable className='h-6 w-6 text-[#1D4F7A]'/><div className='mt-3 font-black'>Migração por API</div></button></div>
    <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5'><label className='block text-xs font-black uppercase text-slate-500'>Sistema de origem<input value={sistemaOrigem} onChange={e => setSistemaOrigem(e.target.value)} className='mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm' placeholder='Ex.: sistema atual do cliente'/></label><div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>{CATEGORIAS.map(c => <button key={c.id} onClick={() => toggleCategoria(c.id)} className={categoryClass(categorias.includes(c.id))}><div className='text-sm font-black'>{c.label}</div><p className='mt-1 text-[11px] text-slate-500'>{c.desc}</p></button>)}</div>
    {metodo === 'api' ? <div className='rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'><Database className='mr-2 inline h-4 w-4'/>Conector por API será habilitado por adaptador do sistema de origem; credenciais ficam somente no backend.</div> : <label className='flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8'><Upload className='h-6 w-6 text-[#1D4F7A]'/><span className='text-sm font-bold'>{reading ? 'Lendo arquivo...' : (fileName || 'Selecionar arquivo da empresa anterior')}</span><input type='file' className='hidden' accept='.csv,.txt,.xls,.xlsx,.pdf' onChange={e => onFile(e.target.files?.[0])}/></label>}
    {error && <div className='rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900'>{error}</div>}</div>
    {rows.length > 0 && <><div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'><h2 className='text-lg font-black'>Mapeamento de campos</h2><div className='mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3'>{TARGET_FIELDS.map(field => <label key={field.key} className='text-xs font-bold text-slate-600'>{field.label}<select value={mapping[field.key]} onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))} className='mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'><option value=''>Não mapear</option>{headers.map(h => <option key={h} value={h}>{h}</option>)}</select></label>)}</div></div>
    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>{[['Registros', validation.total], ['Válidos', validation.validos], ['Inválidos', validation.invalidos], ['Duplicados', validation.duplicados], ['Sem CPF/matrícula', validation.semIdentificador]].map(([label, value]) => <div key={String(label)} className='rounded-xl border border-slate-200 bg-white p-4'><div className='text-[10px] font-black uppercase text-slate-400'>{label}</div><div className='mt-1 text-2xl font-black'>{value}</div></div>)}</div>
    <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'><div className='mb-3 flex items-center justify-between'><h2 className='text-lg font-black'>Prévia</h2>{validation.invalidos === 0 ? <span className='text-xs font-bold text-emerald-700'><CheckCircle2 className='mr-1 inline h-4 w-4'/>Pré-validação aprovada</span> : <span className='text-xs font-bold text-amber-700'><AlertTriangle className='mr-1 inline h-4 w-4'/>Revisão necessária</span>}</div><div className='overflow-x-auto'><table className='min-w-full text-xs'><thead><tr>{headers.slice(0, 8).map(h => <th key={h} className='px-3 py-2 text-left'>{h}</th>)}</tr></thead><tbody>{rows.slice(0, 8).map((r, i) => <tr key={i}>{headers.slice(0, 8).map(h => <td key={h} className='px-3 py-2'>{r[h]}</td>)}</tr>)}</tbody></table></div></div>
    <div className='flex justify-end'><button onClick={exportPackage} className='flex items-center gap-2 rounded-xl bg-[#1D4F7A] px-5 py-3 text-sm font-black text-white'><Download className='h-4 w-4'/> Gerar pacote de migração validado</button></div></>}
  </div>;
};