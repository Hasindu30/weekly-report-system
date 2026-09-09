import React from 'react';

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string | React.ReactNode;
  tone?: 'neutral' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  tone = 'neutral',
  icon,
  className = '',
}: MetricCardProps) {
  const toneStyles = {
    neutral: {
      card: 'bg-white border-slate-200 text-slate-900',
      label: 'text-slate-500',
      value: 'text-slate-900',
    },
    indigo: {
      card: 'bg-white border-slate-200 text-slate-900',
      label: 'text-indigo-600',
      value: 'text-indigo-600',
    },
    emerald: {
      card: 'bg-white border-slate-200 text-slate-900',
      label: 'text-emerald-600',
      value: 'text-emerald-600',
    },
    amber: {
      card: 'bg-white border-slate-200 text-slate-900',
      label: 'text-amber-600',
      value: 'text-amber-600',
    },
    rose: {
      card: 'bg-white border-slate-200 text-slate-900',
      label: 'text-rose-600',
      value: 'text-rose-600',
    },
    sky: {
      card: 'bg-white border-slate-200 text-slate-900',
      label: 'text-sky-600',
      value: 'text-sky-600',
    },
  };

  const currentTone = toneStyles[tone];

  return (
    <div
      className={`bg-white rounded-xl border p-4 sm:p-5 shadow-xs min-w-0 transition-all flex flex-col justify-between ${currentTone.card} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs font-semibold uppercase tracking-wider truncate ${currentTone.label}`}
        >
          {label}
        </span>
        {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
      </div>

      <div className="my-2 min-w-0">
        <div className={`text-2xl sm:text-3xl font-bold tracking-tight truncate ${currentTone.value}`}>
          {value}
        </div>
      </div>

      {subtext && (
        <div className="text-xs text-slate-500 truncate mt-auto">
          {subtext}
        </div>
      )}
    </div>
  );
}
