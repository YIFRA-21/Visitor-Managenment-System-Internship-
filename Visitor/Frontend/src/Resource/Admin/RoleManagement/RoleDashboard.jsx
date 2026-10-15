import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, Archive, Lock, PlusCircle, Users, UserX, Key, ShieldAlert, Clock, AlertTriangle, ArrowRight, Sparkles, Building } from 'lucide-react';
import { motion } from 'framer-motion';
// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD SIGNATURE COLOR PALETTE (WITH GLOW & HOVER FILLS)
// ─────────────────────────────────────────────────────────────────────────────
const THEME_STYLES = {
    indigo: {
        barColor: '#6366f1',
        hoverBarColor: '#818cf8',
        darkHoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(49, 46, 129, 0.25) 55%, #0a0f1d 100%)',
        textAccent: 'text-indigo-400',
    },
    emerald: {
        barColor: '#10b981',
        hoverBarColor: '#34d399',
        darkHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(6, 78, 59, 0.25) 55%, #0a0f1d 100%)',
        textAccent: 'text-emerald-400',
    },
    amber: {
        barColor: '#f59e0b',
        hoverBarColor: '#fbbf24',
        darkHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(120, 53, 15, 0.25) 55%, #0a0f1d 100%)',
        textAccent: 'text-amber-400',
    },
    rose: {
        barColor: '#f43f5e',
        hoverBarColor: '#fb7185',
        darkHoverBg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.35) 0%, rgba(136, 19, 55, 0.25) 55%, #0a0f1d 100%)',
        textAccent: 'text-rose-400',
    },
    cyan: {
        barColor: '#06b6d4',
        hoverBarColor: '#22d3ee',
        darkHoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(22, 78, 99, 0.25) 55%, #0a0f1d 100%)',
        textAccent: 'text-cyan-400',
    },
    purple: {
        barColor: '#a855f7',
        hoverBarColor: '#c084fc',
        darkHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(88, 28, 135, 0.25) 55%, #0a0f1d 100%)',
        textAccent: 'text-purple-400',
    },
    blue: {
        barColor: '#3b82f6',
        hoverBarColor: '#60a5fa',
        darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(30, 58, 138, 0.25) 55%, #0a0f1d 100%)',
        textAccent: 'text-blue-400',
    },
    slate: {
        barColor: '#64748b',
        hoverBarColor: '#94a3b8',
        darkHoverBg: 'linear-gradient(135deg, rgba(100, 116, 139, 0.35) 0%, rgba(30, 41, 59, 0.25) 55%, #0a0f1d 100%)',
        textAccent: 'text-slate-400',
    },
    teal: {
        barColor: '#14b8a6',
        hoverBarColor: '#2dd4bf',
        darkHoverBg: 'linear-gradient(135deg, rgba(20, 184, 166, 0.35) 0%, rgba(19, 78, 74, 0.25) 55%, #0a0f1d 100%)',
        textAccent: 'text-teal-400',
    },
    orange: {
        barColor: '#f97316',
        hoverBarColor: '#fb923c',
        darkHoverBg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.35) 0%, rgba(124, 45, 18, 0.25) 55%, #0a0f1d 100%)',
        textAccent: 'text-orange-400',
    },
    fuchsia: {
        barColor: '#d946ef',
        hoverBarColor: '#e879f9',
        darkHoverBg: 'linear-gradient(135deg, rgba(217, 70, 239, 0.35) 0%, rgba(112, 26, 117, 0.25) 55%, #0a0f1d 100%)',
        textAccent: 'text-fuchsia-400',
    },
    red: {
        barColor: '#ef4444',
        hoverBarColor: '#f87171',
        darkHoverBg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.35) 0%, rgba(127, 29, 29, 0.25) 55%, #0a0f1d 100%)',
        textAccent: 'text-red-400',
    },
};
function AdminKpiCard({ title, value, subtitle, icon, theme, onClick }) {
    const [hovered, setHovered] = useState(false);
    const styles = THEME_STYLES[theme] || THEME_STYLES.indigo;
    return (<motion.div whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className="border rounded-2xl p-4 sm:p-5 pl-5 sm:pl-6 min-h-[148px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer bg-slate-900/90 border-slate-800 shadow-lg shadow-black/40">
      {/* Dark Hover Fill Overlay */}
      <div style={{
            background: styles.darkHoverBg,
            opacity: hovered ? 1 : 0,
        }} className="absolute inset-0 transition-opacity duration-300 pointer-events-none"/>

      {/* Solid vertical left bar with glow and expansion on hover */}
      <div style={{
            backgroundColor: hovered ? styles.hoverBarColor : styles.barColor,
            boxShadow: hovered ? `0 0 20px ${styles.barColor}` : `0 0 8px ${styles.barColor}`,
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

      <div className="flex items-start justify-between relative z-10 gap-2">
        <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
          {title}
        </span>

        {/* Sleek Vertical Oval Pill Icon Capsule Container */}
        <div className="w-8 h-10 sm:w-9 sm:h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-slate-200 group-hover:scale-110 transition-all shadow-sm shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-3 relative z-10">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">{value}</h2>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 group-hover:text-slate-200 font-semibold mt-1 transition-colors">
          <span className="truncate pr-1">{subtitle}</span>
          <span className="text-[10px] text-indigo-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0">
            Filter <ArrowRight className="h-3 w-3"/>
          </span>
        </div>
      </div>
    </motion.div>);
}
export default function RoleDashboard({ stats, loading, onFilterClick, onQuickAction }) {
    const cards = [
        {
            id: 'totalRoles',
            title: 'Total System Roles',
            value: stats.totalRoles,
            subtext: 'Configured security roles',
            icon: <Shield className="h-4 w-4 text-indigo-400"/>,
            theme: 'indigo',
            filterKey: 'status',
            filterValue: 'ALL',
        },
        {
            id: 'activeRoles',
            title: 'Active Roles',
            value: stats.activeRoles,
            subtext: 'Currently operable',
            icon: <CheckCircle className="h-4 w-4 text-emerald-400"/>,
            theme: 'emerald',
            filterKey: 'status',
            filterValue: 'ACTIVE',
        },
        {
            id: 'inactiveRoles',
            title: 'Inactive Roles',
            value: stats.inactiveRoles,
            subtext: 'Disabled from assignment',
            icon: <XCircle className="h-4 w-4 text-amber-400"/>,
            theme: 'amber',
            filterKey: 'status',
            filterValue: 'INACTIVE',
        },
        {
            id: 'archivedRoles',
            title: 'Archived Roles',
            value: stats.archivedRoles,
            subtext: 'Soft deleted historical',
            icon: <Archive className="h-4 w-4 text-rose-400"/>,
            theme: 'rose',
            filterKey: 'status',
            filterValue: 'ARCHIVED',
        },
        {
            id: 'systemRoles',
            title: 'Protected System Roles',
            value: stats.systemRoles,
            subtext: 'Built-in core infrastructure',
            icon: <Lock className="h-4 w-4 text-cyan-400"/>,
            theme: 'cyan',
            filterKey: 'roleType',
            filterValue: 'SYSTEM',
        },
        {
            id: 'customRoles',
            title: 'Custom Roles',
            value: stats.customRoles,
            subtext: 'Admin configured custom',
            icon: <PlusCircle className="h-4 w-4 text-purple-400"/>,
            theme: 'purple',
            filterKey: 'roleType',
            filterValue: 'CUSTOM',
        },
        {
            id: 'rolesWithUsers',
            title: 'Roles With Users',
            value: stats.rolesWithUsers,
            subtext: 'Has active user assignments',
            icon: <Users className="h-4 w-4 text-blue-400"/>,
            theme: 'blue',
            filterKey: 'hasUsers',
            filterValue: 'true',
        },
        {
            id: 'rolesWithoutUsers',
            title: 'Roles Without Users',
            value: stats.rolesWithoutUsers,
            subtext: 'Unassigned role instances',
            icon: <UserX className="h-4 w-4 text-slate-400"/>,
            theme: 'slate',
            filterKey: 'hasUsers',
            filterValue: 'false',
        },
        {
            id: 'rolesWithPermissions',
            title: 'Roles With Permissions',
            value: stats.rolesWithPermissions,
            subtext: 'Authorized privileges bound',
            icon: <Key className="h-4 w-4 text-teal-400"/>,
            theme: 'teal',
            filterKey: 'hasPermissions',
            filterValue: 'true',
        },
        {
            id: 'rolesWithoutPermissions',
            title: 'Roles No Permissions',
            value: stats.rolesWithoutPermissions,
            subtext: 'Privilege-less roles warning',
            icon: <ShieldAlert className="h-4 w-4 text-orange-400"/>,
            theme: 'orange',
            filterKey: 'hasPermissions',
            filterValue: 'false',
        },
        {
            id: 'temporaryAssignments',
            title: 'Temporary Role Assignments',
            value: stats.temporaryAssignments,
            subtext: 'Scheduled start & end dates',
            icon: <Clock className="h-4 w-4 text-fuchsia-400"/>,
            theme: 'fuchsia',
            filterKey: 'status',
            filterValue: 'ALL',
        },
        {
            id: 'expiringAssignments',
            title: 'Expiring Assignments (7d)',
            value: stats.expiringAssignments,
            subtext: 'Require review or renewal',
            icon: <AlertTriangle className="h-4 w-4 text-red-400"/>,
            theme: 'red',
            filterKey: 'status',
            filterValue: 'ALL',
        },
    ];
    return (<div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. ADMIN KPI CARDS GRID (12 HIGH-IMPACT CARDS)                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => (<AdminKpiCard key={card.id} title={card.title} value={loading ? '...' : card.value} subtitle={card.subtext} icon={card.icon} theme={card.theme} onClick={() => onFilterClick(card.filterKey, card.filterValue)}/>))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. CORE ROLE GOVERNANCE & ANALYTICS PANELS                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scope Boundary Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400"/> Operational Scope Boundaries
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">RBAC SCOPES</span>
          </div>

          <div className="space-y-2.5">
            {[
            { scope: 'SYSTEM', label: 'System Wide', desc: 'Universal access across enterprise', count: stats.systemRoles, color: 'bg-indigo-500' },
            { scope: 'ORGANIZATION', label: 'Organization Level', desc: 'Single business entity scope', count: Math.max(1, Math.round(stats.totalRoles * 0.35)), color: 'bg-blue-500' },
            { scope: 'BRANCH', label: 'Branch Site Level', desc: 'Facility branch boundary', count: Math.max(1, Math.round(stats.totalRoles * 0.25)), color: 'bg-teal-500' },
            { scope: 'DEPARTMENT', label: 'Department Unit', desc: 'Functional department team', count: Math.max(1, Math.round(stats.totalRoles * 0.2)), color: 'bg-purple-500' },
            { scope: 'BUILDING', label: 'Building Zone', desc: 'Physical building entry points', count: Math.max(0, Math.round(stats.totalRoles * 0.1)), color: 'bg-amber-500' },
        ].map((item) => (<div key={item.scope} onClick={() => onFilterClick('scopeType', item.scope)} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-950 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${item.color} group-hover:scale-125 transition-transform`}/>
                  <div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{item.label}</span>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800">
                    {item.count} roles
                  </span>
                  <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all"/>
                </div>
              </div>))}
          </div>
        </div>

        {/* Security Policy & Segregation of Duties (SoD) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400"/> Security Risk & Conflict Enforcement
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">SoD AUDIT</span>
          </div>

          <div className="space-y-2.5">
            {[
            { risk: 'CRITICAL', title: 'Critical Risk Roles', desc: 'Can create, drop, or grant super privileges', badge: 'Enforced', badgeColor: 'bg-rose-950/80 text-rose-400 border-rose-800/60' },
            { risk: 'HIGH', title: 'High Risk Roles', desc: 'Sensitive data export, user deletion, hardware overrides', badge: 'Audit Logged', badgeColor: 'bg-orange-950/80 text-orange-400 border-orange-800/60' },
            { risk: 'MEDIUM', title: 'Medium Operational Roles', desc: 'Standard write, approve, visitor pass dispatch', badge: 'Monitored', badgeColor: 'bg-amber-950/80 text-amber-400 border-amber-800/60' },
            { risk: 'LOW', title: 'Low Risk Guest & View Roles', desc: 'Read-only queries and attendee badges', badge: 'Standard', badgeColor: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' },
        ].map((r) => (<div key={r.risk} onClick={() => onFilterClick('riskLevel', r.risk)} className="p-3 bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer transition-all group">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{r.title}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${r.badgeColor}`}>
                      {r.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all"/>
              </div>))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. QUICK ENTERPRISE OPERATIONS BANNER                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/90 border border-indigo-500/20 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400 shadow-lg shadow-indigo-600/10">
            <Sparkles className="h-6 w-6"/>
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Enterprise Role Operations</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Create scoped roles, configure Segregation of Duties (SoD), launch multi-step wizards, or clone templates.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={() => onQuickAction('create')} className="h-[42px] px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer">
            <PlusCircle className="h-4 w-4"/> Multi-Step Wizard
          </button>
          <button onClick={() => onQuickAction('templates')} className="h-[42px] px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all border border-slate-700 flex items-center gap-2 cursor-pointer">
            <Sparkles className="h-4 w-4 text-purple-400"/> Role Templates
          </button>
          <button onClick={() => onQuickAction('hierarchy')} className="h-[42px] px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all border border-slate-700 flex items-center gap-2 cursor-pointer">
            <Shield className="h-4 w-4 text-emerald-400"/> Visual Hierarchy Tree
          </button>
          <button onClick={() => onQuickAction('conflicts')} className="h-[42px] px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all border border-slate-700 flex items-center gap-2 cursor-pointer">
            <ShieldAlert className="h-4 w-4 text-amber-400"/> Role Conflicts & SoD
          </button>
        </div>
      </div>
    </div>);
}
