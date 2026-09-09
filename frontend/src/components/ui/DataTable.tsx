import React from 'react';

export interface DataTableProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ children, className = '' }: DataTableProps) {
  return (
    <div className={`w-full overflow-x-auto min-w-0 rounded-xl border border-slate-200 bg-white shadow-xs ${className}`}>
      <table className="w-full text-left text-sm text-slate-600 border-collapse min-w-full">
        {children}
      </table>
    </div>
  );
}

export function TableHead({
  children,
  className = '',
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 ${className}`}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className = '',
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-slate-100 ${className}`}>{children}</tbody>;
}

export function TableRow({
  children,
  className = '',
  onClick,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`transition-colors hover:bg-slate-50/70 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}) {
  const alignClass =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th className={`py-3 px-4 sm:px-5 whitespace-nowrap ${alignClass} ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}) {
  const alignClass =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td className={`py-3.5 px-4 sm:px-5 whitespace-nowrap text-slate-700 ${alignClass} ${className}`}>
      {children}
    </td>
  );
}
