import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ size = 'md', color = 'blue', text }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    white: 'text-white',
    slate: 'text-slate-400',
    emerald: 'text-emerald-500'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`animate-spin ${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.blue}`}>
        <Loader2 size="100%" />
      </div>
      {text && <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{text}</span>}
    </div>
  );
};

export default Loader;
