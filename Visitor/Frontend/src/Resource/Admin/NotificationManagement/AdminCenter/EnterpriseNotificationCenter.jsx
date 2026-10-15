import React, { useState } from 'react';
import { LayoutDashboard, Send, CheckSquare, Cpu, Moon, RotateCcw, Bell } from 'lucide-react';
import NotificationCommandCenterView from './NotificationCommandCenterView';
import BroadcastAndCampaignView from './BroadcastAndCampaignView';
import ApprovalAndTemplateView from './ApprovalAndTemplateView';
import SmartDeliveryAndLifecycleView from './SmartDeliveryAndLifecycleView';
import PreferencesAndGovernanceView from './PreferencesAndGovernanceView';
import RecoveryAndMaintenanceView from './RecoveryAndMaintenanceView';
export default function EnterpriseNotificationCenter() {
    const [activeSection, setActiveSection] = useState('command_center');
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Master Enterprise Title & Section Navigation Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 rounded-2xl shadow-xl text-white">
            <Bell className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Visitor Management System</span>
              <span>/</span>
              <span>Module 13</span>
              <span>/</span>
              <span className="text-blue-400 font-bold">Part 9 – Enterprise Admin Center</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Enterprise Administrator Notification Center</h1>
          </div>
        </div>

        {/* Master Section Tabs */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex-wrap gap-1">
          {[
            { id: 'command_center', label: 'Command Center (§1)', icon: LayoutDashboard },
            { id: 'broadcast_campaign', label: 'Broadcast & Campaigns (§2, §3, §15)', icon: Send },
            { id: 'workflows_templates', label: 'Workflows & Templates (§4, §5, §17, §18)', icon: CheckSquare },
            { id: 'delivery_lifecycle', label: 'Smart Delivery & SLA (§6, §11, §12, §13)', icon: Cpu },
            { id: 'governance_cost', label: 'Quiet Hours, Cost & AI (§7-§10, §14, §16, §19-§21, §25)', icon: Moon },
            { id: 'recovery_maintenance', label: 'Recovery & Maintenance (§22-§24)', icon: RotateCcw }
        ].map(t => (<button key={t.id} onClick={() => setActiveSection(t.id)} className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${activeSection === t.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200'}`}>
              <t.icon className="h-4 w-4"/>
              <span>{t.label}</span>
            </button>))}
        </div>
      </div>

      {/* Render Active View */}
      {activeSection === 'command_center' && <NotificationCommandCenterView />}
      {activeSection === 'broadcast_campaign' && <BroadcastAndCampaignView />}
      {activeSection === 'workflows_templates' && <ApprovalAndTemplateView />}
      {activeSection === 'delivery_lifecycle' && <SmartDeliveryAndLifecycleView />}
      {activeSection === 'governance_cost' && <PreferencesAndGovernanceView />}
      {activeSection === 'recovery_maintenance' && <RecoveryAndMaintenanceView />}
    </div>);
}
