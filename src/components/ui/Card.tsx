import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`bg-surface-card border border-border rounded-xl p-5 ${
        hoverEffect ? 'hover:border-gold-400/30 transition-colors duration-200' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
