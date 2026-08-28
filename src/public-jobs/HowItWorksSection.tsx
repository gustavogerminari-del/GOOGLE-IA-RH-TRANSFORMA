import React from 'react';
import { Building2, FileText, Bot, Trophy, ArrowRight } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Empresa cria uma vaga',
      desc: 'Com poucos cliques, a empresa descreve os requisitos, salário e benefícios para publicar no portal.',
      icon: Building2,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    },
    {
      num: '02',
      title: 'Candidatos enviam currículo',
      desc: 'Profissionais de todo o Brasil se candidatam diretamente pelo site ou cadastram seus currículos.',
      icon: FileText,
      color: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    {
      num: '03',
      title: 'RH TRANSFORMA IA analisa os perfis',
      desc: 'Nossa Inteligência Artificial realiza a leitura dos arquivos e faz o ranking de compatibilidade.',
      icon: Bot,
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    },
    {
      num: '04',
      title: 'Empresa encontra os melhores talentos',
      desc: 'Recrutadores organizam entrevistas e contratam os candidatos mais qualificados com agilidade.',
      icon: Trophy,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    }
  ];

  return (
    <section className="py-16 bg-slate-900 text-white border-b border-slate-800 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-amber-400 font-extrabold text-xs uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
            Processo Simples & Eficiente
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Como Funciona o RH TRANSFORMA
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium">
            Conectamos contratações de ponta a ponta em 4 etapas estruturadas e inteligentes.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={idx} 
                className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 relative hover:border-amber-500/50 transition-all hover:-translate-y-1 group"
              >
                {/* Step Number Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-amber-400 tracking-wider">
                    ETAPA {step.num}
                  </span>
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${step.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-white mb-2 group-hover:text-amber-300 transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
