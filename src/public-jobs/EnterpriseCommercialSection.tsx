import React from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Users, 
  ShieldCheck, 
  Bot, 
  TrendingUp,
  BarChart2
} from 'lucide-react';

interface EnterpriseCommercialSectionProps {
  onOpenCompanyModal: () => void;
}

export const EnterpriseCommercialSection: React.FC<EnterpriseCommercialSectionProps> = ({
  onOpenCompanyModal
}) => {
  const benefits = [
    'Publicação ilimitada de vagas no portal oficial',
    'Banco de talentos inteligente com busca avançada',
    'Triagem e ranqueamento automático de currículos por IA',
    'Ranking de candidatos por pontuação de compatibilidade',
    'Organização de entrevistas e lembretes por WhatsApp/E-mail',
    'Gestão completa de recrutamento, admissão e relatórios'
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Building2 className="w-4 h-4 text-amber-400" />
              Solução Corporativa para Empresas & Consultorias
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
              Encontre os melhores talentos para sua empresa
            </h2>

            <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed">
              O RH TRANSFORMA combina inteligência artificial avançada e gestão humana para acelerar seu recrutamento em até 70%, reduzindo o custo por contratação.
            </p>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {benefits.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs text-slate-200 font-bold leading-tight">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenCompanyModal}
                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Cadastrar Minha Empresa Gratuitamente</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Teste grátis de 14 dias • Banco de Talentos não incluso no trial</span>
              </div>
            </div>
          </div>

          {/* Graphical Card Highlight */}
          <div className="lg:col-span-5">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5 relative">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">RH TRANSFORMA AI Analytics</h4>
                    <span className="text-[10px] text-slate-400">Triagem inteligente em tempo real</span>
                  </div>
                </div>
                <span className="text-xs font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  98.4% Assertividade
                </span>
              </div>

              {/* Stat Boxes */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/50 space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Tempo Médio Vaga</span>
                  <p className="text-xl font-black text-amber-400">9 Dias</p>
                  <span className="text-[10px] text-emerald-400 font-semibold">↓ 65% mais rápido</span>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/50 space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Candidatos Qualificados</span>
                  <p className="text-xl font-black text-indigo-300">Base privada</p>
                  <span className="text-[10px] text-slate-400 font-semibold">Somente talentos da própria empresa</span>
                </div>
              </div>

              {/* Sample Candidate Match Preview */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Triagem Automática Exemplo</span>
                  <span className="text-[10px] font-black text-amber-300">Match 95%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full w-[95%]" />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Candidato recomendado pelo algoritmo RH TRANSFORMA IA com base em competências técnicas e aderência cultural.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
