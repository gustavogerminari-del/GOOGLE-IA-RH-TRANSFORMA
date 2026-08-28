import fs from 'node:fs';

const path = 'src/jobs/components/JobCandidatesManagementView.tsx';
const before = fs.readFileSync(path, 'utf8');
const after = before.replace("const novosCount = cands.filter(c => c.status === 'Novos' || c.status === 'Novos').length;", "const novosCount = cands.filter(c => c.status === 'Novos').length;");
if (after === before) throw new Error('Expected duplicate status comparison was not found.');
fs.writeFileSync(path, after, 'utf8');
console.log('Fixed duplicate Novos comparison.');
