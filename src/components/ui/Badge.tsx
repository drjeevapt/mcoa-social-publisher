import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'green' | 'amber' | 'red' | 'blue' | 'zinc';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'zinc',
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    gold: 'bg-gold-400/10 text-gold-300 border-gold-400/30',
    green: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
    red: 'bg-rose-950/60 text-rose-300 border-rose-850/40',
    blue: 'bg-sky-950/60 text-sky-300 border-sky-800/40',
    zinc: 'bg-zinc-800/70 text-zinc-300 border-zinc-700/50',
  };

  const dotColors = {
    gold: 'bg-gold-400',
    green: 'bg-emerald-400',
    amber: 'bg-amber-400',
    red: 'bg-rose-400',
    blue: 'bg-sky-400',
    zinc: 'bg-zinc-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
