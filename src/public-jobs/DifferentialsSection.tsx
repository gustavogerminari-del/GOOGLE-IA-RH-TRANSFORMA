import React from 'react';
import { Bot, Target, Calendar, BarChart3, CheckCircle2 } from 'lucide-react';

export const DifferentialsSection: React.FC = () => {
  const differentials = [
    {
      title: '🤖 Inteligência Artificial',
      subtitle: 'Análise automática de currículos',
      description: 'Extraia palavras-chave, formação, nível de senioridade e calcule o score de compatibilidade com a vaga sem esforço manual.',
      badge: 'IA Integrada'
    },
    {
      title: '🎯 Banco de Talentos',
      subtitle: 'Encontramos candidatos compatíveis',
      description: 'Pesquise e relacione perfis reais cadastrados no banco privado da sua própria empresa.',
      badge: 'Busca Ativa'
    },
    {
      title: '📅 Gestão de Entrevistas',
      subtitle: 'Organize todas as etapas',
      description: 'Agende entrevistas presenciais e online, envie lembretes automáticos e receba pareceres dos gestores em tempo real.',
      badge: 'Agenda Inteligente'
    },
    {
      title: '📊 Indicadores RH',
      subtitle: 'Acompanhe resultados estratégicos',
      description: 'Métricas completas de Time-to-Hire, Custo por Contratação, Taxa de Retenção e Funil do processo seletivo.',
      badge: 'Relatórios RH'
    }
  ];

  return (
    <section className="py-16 bg-slate-50 text-slate-900 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-indigo-600 font-black text-xs uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Diferenciais Competitivos
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Por que escolher o RH TRANSFORMA?
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm font-medium">
            Tecnologia de ponta pensada para otimizar o tempo dos recrutadores e garantir contratações mais assertivas.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {differentials.map((item, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs hover:shadow-xl hover:border-amber-400 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                  {item.badge}
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <h4 className="text-xs font-bold text-indigo-600">
                  {item.subtitle}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{item.title.includes('Banco de Talentos') ? 'Módulo independente, conforme plano contratado' : 'Disponível conforme recursos do plano'}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
