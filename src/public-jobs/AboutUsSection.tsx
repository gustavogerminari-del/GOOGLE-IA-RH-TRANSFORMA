import React from 'react';
import { Target, Eye, Heart, Sparkles, Shield, Cpu, Zap, Award } from 'lucide-react';

export const AboutUsSection: React.FC = () => {
  const values = [
    {
      title: 'Inovação',
      desc: 'Buscamos constantemente novas soluções em Inteligência Artificial e automação para elevar o RH estratégico.',
      icon: Cpu,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
      title: 'Transparência',
      desc: 'Comunicação clara, processos auditáveis e conformidade rigorosa com a LGPD em todas as interações.',
      icon: Shield,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      title: 'Pessoas em Primeiro Lugar',
      desc: 'Acreditamos que por trás de cada currículo existe uma história e um potencial único a ser desenvolvido.',
      icon: Heart,
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    },
    {
      title: 'Tecnologia com Propósito',
      desc: 'Desenvolvemos tecnologia humana e acessível para aproximar recrutadores e profissionais.',
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      title: 'Eficiência',
      desc: 'Reduzimos o tempo de contratação com processos fluidos, dados consolidados e triagem ágil.',
      icon: Zap,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    }
  ];

  return (
    <section className="py-16 bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-amber-400 font-extrabold text-xs uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
            Institucional
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Sobre o Grupo RH TRANSFORMA
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium">
            Transformando o ecossistema de contratações no Brasil através de inovação e respeito às pessoas.
          </p>
        </div>

        {/* Mission & Vision Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Missão */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 space-y-4 hover:border-amber-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">Nossa Missão</h3>
            <blockquote className="text-sm text-slate-200 italic font-medium leading-relaxed border-l-2 border-amber-400 pl-4">
              "Conectar pessoas e empresas através da tecnologia, tornando o processo de contratação mais simples, humano e inteligente."
            </blockquote>
          </div>

          {/* Visão */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 space-y-4 hover:border-amber-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">Nossa Visão</h3>
            <blockquote className="text-sm text-slate-200 italic font-medium leading-relaxed border-l-2 border-indigo-400 pl-4">
              "Ser uma das principais plataformas brasileiras de gestão de talentos e recursos humanos."
            </blockquote>
          </div>

        </div>

        {/* Valores */}
        <div className="space-y-6 pt-4">
          <div className="text-center">
            <h3 className="text-xl font-black text-white">Nossos Valores</h3>
            <p className="text-xs text-slate-400 mt-1">Os princípios que guiam cada algoritmo e cada funcionalidade criada no RH TRANSFORMA.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {values.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div key={idx} className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60 space-y-2 hover:bg-slate-800 transition-colors">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${val.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-sm text-white">{val.title}</h4>
                  <p className="text-xs text-slate-400 leading-normal font-medium">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
