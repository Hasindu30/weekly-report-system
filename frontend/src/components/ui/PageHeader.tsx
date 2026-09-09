import React from 'react';
import { Link } from 'react-router-dom';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  backLink?: {
    to: string;
    label: string;
  };
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  backLink,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`space-y-2 pb-2 min-w-0 ${className}`}>
      {backLink && (
        <div>
          <Link
            to={backLink.to}
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors gap-1 mb-1.5"
          >
            <span>←</span>
            <span>{backLink.label}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            {badge && <span className="shrink-0">{badge}</span>}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
