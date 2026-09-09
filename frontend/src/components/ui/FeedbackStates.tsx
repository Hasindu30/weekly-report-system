import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    to?: string;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3 min-w-0 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl shrink-0">
        {icon || '📄'}
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      {action && (
        <div className="pt-2">
          {action.onClick ? (
            <Button
              variant={action.variant || 'primary'}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ) : action.to ? (
            <Button
              variant={action.variant || 'primary'}
              size="sm"
              onClick={() => {
                window.location.href = action.to!;
              }}
            >
              {action.label}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'An error occurred',
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`p-4 sm:p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm min-w-0 ${className}`}
    >
      <div className="space-y-0.5 min-w-0">
        <div className="font-semibold text-rose-900">{title}</div>
        <div className="text-rose-700">{message}</div>
      </div>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry} className="shrink-0">
          Try Again
        </Button>
      )}
    </div>
  );
}

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = 'Loading data...',
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 sm:py-16 space-y-3 min-w-0 ${className}`}
    >
      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
      <span className="text-xs font-medium text-slate-500">{message}</span>
    </div>
  );
}
