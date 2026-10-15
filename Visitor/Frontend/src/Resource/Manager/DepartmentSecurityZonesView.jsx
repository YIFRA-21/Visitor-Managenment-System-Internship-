// Frontend/src/Resource/Manager/DepartmentSecurityZonesView.tsx
import React, { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, AlertTriangle, Users, Phone, Radio, CheckCircle2, Eye, ShieldCheck, MapPin, RefreshCw, Siren, Bell } from 'lucide-react';
import { managerApi } from '../../modules/employee-management/api/managerApi';
export default function DepartmentSecurityZonesView() {
    const [departmentName, setDepartmentName] = useState('Department');
    const [zones, setZones] = useState([]);
    const [officer, setOfficer] = useState(null);
    const [alertsCount, setAlertsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [patrolRequested, setPatrolRequested] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);
    const fetchSecurityData = async () => {
        setLoading(true);
        try {
            const data = await managerApi.getSecurityZones();
            setDepartmentName(data.departmentName || 'Department');
            setZones(data.zones || []);
            setOfficer(data.securityOfficerOnDuty || null);
            setAlertsCount(data.activeEscortAlerts || 0);
        }
        catch (err) {
            console.error('Failed to load security zones:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchSecurityData();
    }, []);
    const handleRequestPatrol = (zoneId, zoneName) => {
        setPatrolRequested(zoneId);
        setToastMessage(`Security patrol dispatched to ${zoneName}. Officer notified.`);
        setTimeout(() => {
            setPatrolRequested(null);
        }, 4000);
    };
    const handleToggleLock = (zoneId) => {
        setZones(prev => prev.map(z => {
            if (z.id === zoneId) {
                const newStatus = z.status === 'LOCKED' ? 'SECURE' : 'LOCKED';
                setToastMessage(`Zone "${z.name}" lock status changed to ${newStatus}.`);
                return { ...z, status: newStatus };
            }
            return z;
        }));
    };
    const getRestrictionBadge = (level) => {
        switch (level) {
            case 'PUBLIC':
                return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Public Access</span>;
            case 'STAFF_ONLY':
                return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Staff Only</span>;
            case 'RESTRICTED':
                return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Restricted</span>;
            case 'HIGH_SECURITY':
                return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">High Security</span>;
            default:
                return null;
        }
    };
    return (<div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Shield className="w-5 h-5"/>
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Department Security & Restricted Zones
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              ACCESS CONTROL
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Monitor physical perimeters, escort compliance, and access authorization across {departmentName} spaces.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={fetchSecurityData} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/>
            Refresh Status
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (<div className="flex items-center justify-between p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-cyan-400"/>
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-cyan-400 hover:text-white text-xs underline">
            Dismiss
          </button>
        </div>)}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold">Protected Zones</span>
            <MapPin className="w-4 h-4 text-cyan-400"/>
          </div>
          <div className="text-2xl font-bold text-white">{zones.length} Zones</div>
          <p className="text-xs text-slate-500 mt-1">Department perimeter</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold">Visitors Inside Zones</span>
            <Users className="w-4 h-4 text-indigo-400"/>
          </div>
          <div className="text-2xl font-bold text-white">
            {zones.reduce((acc, z) => acc + (z.activeVisitorsCount || 0), 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Checked-in & badge authorized</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold">Security Violations</span>
            <AlertTriangle className="w-4 h-4 text-emerald-400"/>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{alertsCount} Active</div>
          <p className="text-xs text-slate-500 mt-1">All perimeters compliant</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold">On-Duty Guard</span>
            <ShieldCheck className="w-4 h-4 text-blue-400"/>
          </div>
          <div className="text-lg font-bold text-white truncate">{officer?.name || 'Officer Stationed'}</div>
          <p className="text-xs text-slate-500 mt-1">{officer?.post || 'Post B-2'} • {officer?.phone}</p>
        </div>
      </div>

      {/* Security Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {zones.map(zone => {
            const isLocked = zone.status === 'LOCKED';
            const isPatrolling = patrolRequested === zone.id;
            return (<div key={zone.id} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4 hover:border-slate-700 transition">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{zone.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {zone.zoneCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {getRestrictionBadge(zone.restrictionLevel)}
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${zone.escortRequired
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-slate-800 text-slate-400'}`}>
                      {zone.escortRequired ? 'Escort Required' : 'Self-Guided'}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isLocked
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                  {isLocked ? 'LOCKED' : 'SECURE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block">Active Visitors:</span>
                  <span className="text-slate-200 font-semibold text-sm">
                    {zone.activeVisitorsCount} visitors inside
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Surveillance Status:</span>
                  <span className="text-emerald-400 font-semibold text-sm flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5"/> 24/7 Monitored
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={() => handleToggleLock(zone.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${isLocked
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                    : 'bg-rose-600/10 text-rose-400 border-rose-500/20 hover:bg-rose-600/20'}`}>
                  {isLocked ? <Unlock className="w-3.5 h-3.5"/> : <Lock className="w-3.5 h-3.5"/>}
                  {isLocked ? 'Unlock Perimeter' : 'Lockdown Zone'}
                </button>

                <button type="button" onClick={() => handleRequestPatrol(zone.id, zone.name)} disabled={isPatrolling} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 text-xs font-semibold transition disabled:opacity-50">
                  <Siren className={`w-3.5 h-3.5 ${isPatrolling ? 'animate-spin text-amber-400' : ''}`}/>
                  {isPatrolling ? 'Patrol En Route...' : 'Dispatch Patrol'}
                </button>
              </div>
            </div>);
        })}
      </div>

      {/* On-Duty Guard Quick Dispatch Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Radio className="w-6 h-6"/>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Direct Security Officer Dispatch</h4>
            <p className="text-xs text-slate-400">
              Assigned Post: <strong className="text-slate-200">{officer?.post || 'Security Command Station'}</strong> • Guard: <strong className="text-slate-200">{officer?.name || 'On Duty'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a href={`tel:${officer?.phone || ''}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition">
            <Phone className="w-3.5 h-3.5 text-emerald-400"/>
            {officer?.phone || 'Call Security'}
          </a>
          <button type="button" onClick={() => setToastMessage('Emergency priority broadcast dispatched to security guard station.')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-lg shadow-rose-600/30">
            <Bell className="w-3.5 h-3.5"/>
            Emergency Radio Alert
          </button>
        </div>
      </div>
    </div>);
}
