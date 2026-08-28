import React from 'react';
import { Check, Sparkles, Zap, Building2, ArrowRight } from 'lucide-react';

interface PricingPlansSectionProps {
  onSelectPlan: (planName: string) => void;
}

export const PricingPlansSection: React.FC<PricingPlansSectionProps> = ({
  onSelectPlan
}) => {
  const plans = [
    {
      name: 'Plano Inicial',
      price: 'R$ 290',
      period: '/mês',
      description: 'Ideal para pequenas empresas ou recrutamento pontual com controle simples.',
      badge: null,
      features: [
        'Até 3 vagas ativas simultâneas',
        '1 Usuário Recrutador',
        'Banco de Talentos disponível como módulo contratado após o trial',
        'Recebimento direto de currículos',
        'Triagem automática simples',
        'Suporte por e-mail'
      ],
      cta: 'Começar com Plano Inicial',
      highlight: false
    },
    {
      name: 'Plano Profissional',
      price: 'R$ 690',
      period: '/mês',
      description: 'Perfeito para empresas em crescimento que precisam de tração e inteligência artificial.',
      badge: 'MAIS POPULAR',
      features: [
        'Até 15 vagas ativas simultâneas',
        'Até 5 Usuários Recrutadores',
        'Banco de Talentos Inteligente após o período de trial',
        'Triagem & Ranking por RH TRANSFORMA IA',
        'Gestão de Entrevistas com Lembrete',
        'Disparo de mensagens WhatsApp',
        'Relatórios e Indicadores de RH',
        'Suporte Prioritário'
      ],
      cta: 'Começar Agora — 14 Dias Grátis',
      highlight: true
    },
    {
      name: 'Plano Premium',
      price: 'R$ 1.490',
      period: '/mês',
      description: 'Para grandes corporações e consultorias de RH que exigem poder total.',
      badge: 'COMPLETO / CORPORATIVO',
      features: [
        'Vagas ativas ilimitadas',
        'Usuários e Recrutadores ilimitados',
        'RH TRANSFORMA IA Avançado com Análise Preditiva',
        'Página de Trabalhe Conosco personalizada',
        'Módulo de Folha, Ponto e Benefícios',
        'Integrações via API REST',
        'Gerente de Conta Dedicado'
      ],
      cta: 'Contratar Plano Premium',
      highlight: false
    }
  ];

  return (
    <section className="py-16 bg-white text-slate-900 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-amber-600 font-black text-xs uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Planos & Investimento
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Escolha o plano ideal para o seu RH
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm font-medium">
            Sem fidelidade contratual. No trial de 14 dias, Banco de Talentos e Match Talentos permanecem bloqueados.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-7 border transition-all flex flex-col justify-between relative ${
                plan.highlight
                  ? 'bg-slate-900 text-white border-amber-500 shadow-2xl ring-4 ring-amber-500/20 scale-102'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-md tracking-wider">
                  ★ {plan.badge}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <h3 className={`text-xl font-black ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed ${plan.highlight ? 'text-slate-300' : 'text-slate-500'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tight">{plan.price}</span>
                  <span className={`text-xs font-semibold ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-2.5 pt-2 text-xs border-t border-slate-100/20">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        plan.highlight ? 'bg-amber-500 text-slate-950' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className={`font-medium ${plan.highlight ? 'text-slate-200' : 'text-slate-700'}`}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100/20">
                <button
                  onClick={() => onSelectPlan(plan.name)}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    plan.highlight
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
