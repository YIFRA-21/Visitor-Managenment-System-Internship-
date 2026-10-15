import React from 'react';
import { ArrowUpRight } from 'lucide-react';
export default function InteractiveWidgetCard({ title, value, subtext, icon: Icon, iconBgColor = '#6366f115', iconColor = '#6366f1', badge, badgeColor = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', onClick, className = '', }) {
    return (<div onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={(e) => {
            if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onClick();
            }
        }} className={`group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-indigo-500/30 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="p-3 rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: iconBgColor }}>
          <Icon className="h-6 w-6" style={{ color: iconColor }}/>
        </div>
        {badge ? (<span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${badgeColor}`}>
            {badge}
          </span>) : onClick ? (<span className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors">
            <ArrowUpRight className="h-4 w-4"/>
          </span>) : null}
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {value}
        </p>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        {subtext && (<p className="text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
            {subtext}
          </p>)}
      </div>
    </div>);
}
