// components/ui/Card.tsx - Reusable card component

import React, { forwardRef, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', hover = true, selected, onClick }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`
          bg-white rounded-xl border border-slate-200
          p-4 transition-all duration-200
          ${hover ? 'hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5' : ''}
          ${selected ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const CardHeader = ({ title, subtitle, action }: CardHeaderProps) => (
  <div className="flex items-start justify-between mb-3">
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-slate-900 truncate">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="ml-4 flex-shrink-0">{action}</div>}
  </div>
);

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter = ({ children, className = '' }: CardFooterProps) => (
  <div className={`mt-4 pt-3 border-t border-slate-100 flex items-center justify-between ${className}`}>
    {children}
  </div>
);

// Badge component for tags
interface BadgeProps {
  children: ReactNode;
  color?: 'blue' | 'purple' | 'green' | 'emerald' | 'yellow' | 'red' | 'gray';
  size?: 'sm' | 'md';
}

const badgeColors = {
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  green: 'bg-green-100 text-green-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-slate-100 text-slate-600',
};

export const Badge = ({ children, color = 'gray', size = 'sm' }: BadgeProps) => (
  <span className={`
    inline-flex items-center font-medium rounded-full
    ${badgeColors[color]}
    ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}
  `}>
    {children}
  </span>
);
