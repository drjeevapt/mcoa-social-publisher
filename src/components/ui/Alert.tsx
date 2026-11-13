import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className = '',
  action,
}) => {
  const styles = {
    info: {
      container: 'bg-sky-950/40 border-sky-800/50 text-sky-200',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />,
      titleColor: 'text-sky-300 font-semibold',
    },
    warning: {
      container: 'bg-amber-950/40 border-amber-700/50 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
      titleColor: 'text-amber-300 font-semibold',
    },
    success: {
      container: 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-300 font-semibold',
    },
    error: {
      container: 'bg-rose-950/40 border-rose-800/50 text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
      titleColor: 'text-rose-300 font-semibold',
    },
  };

  const current = styles[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${current.container} ${className}`}>
      {current.icon}
      <div className="flex-1 text-sm">
        {title && <h4 className={`mb-1 ${current.titleColor}`}>{title}</h4>}
        <div className="opacity-90">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
