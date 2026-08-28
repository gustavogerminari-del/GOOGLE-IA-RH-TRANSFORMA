import React from 'react';
import { Card } from '../../shared';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    neutral?: boolean;
  };
  accentColor?: 'indigo' | 'purple' | 'emerald' | 'amber' | 'rose' | 'blue';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'indigo',
  onClick,
}) => {
  const colorBgMap = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
  };

  return (
    <Card
      onClick={onClick}
      hoverable={!!onClick}
      className="p-5 flex flex-col justify-between space-y-3 relative overflow-hidden group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</p>
          <h4 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 leading-none">
            {value}
          </h4>
        </div>

        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${colorBgMap[accentColor]}`}>
          {icon}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100/80">
        {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}

        {trend && (
          <span
            className={`font-extrabold px-2 py-0.5 rounded-full text-[10px] ${
              trend.neutral
                ? 'bg-slate-100 text-slate-600'
                : trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </Card>
  );
};
