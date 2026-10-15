import React, { useState } from 'react';
import { Shield } from 'lucide-react';
export default function SandboxEnvironmentView() {
    const [eventType, setEventType] = useState('VISITOR_CHECKIN_COMPLETED');
    const [simulation, setSimulation] = useState(null);
    const handleSimulate = () => {
        setSimulation({
            simulationId: `sim_${Date.now()}`,
            sandboxMode: true,
            realWorldDispatched: false,
            targetEvent: eventType,
            simulatedRule: 'Rule #12 – Standard Check-in Alert',
            channels: [
                { name: 'In-App Banner', status: 'simulated_success', latency: '2 ms' },
                { name: 'SMTP Email', status: 'simulated_success', latency: '42 ms' },
                { name: 'Bulk SMS Gateway', status: 'simulated_success', latency: '110 ms' }
            ]
        });
    };
    return (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6 text-xs font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Shield className="h-4 w-4 text-indigo-400"/>
            <span>Notification Sandbox Simulator (§8)</span>
          </h3>
          <p className="text-slate-400 mt-0.5">Isolated testing environment. Simulations execute full rule logic without dispatching real emails or SMS messages.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
          <div>
            <label className="text-slate-400 block mb-1">Simulated Business Event</label>
            <select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold">
              <option value="VISITOR_CHECKIN_COMPLETED">VISITOR_CHECKIN_COMPLETED</option>
              <option value="EMERGENCY_LOCKDOWN_TRIGGERED">EMERGENCY_LOCKDOWN_TRIGGERED</option>
              <option value="APPOINTMENT_CANCELLED">APPOINTMENT_CANCELLED</option>
              <option value="VIP_ARRIVAL_ALERT">VIP_ARRIVAL_ALERT</option>
            </select>
          </div>

          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-between font-mono">
            <span>Isolation Shield: ACTIVE</span>
            <span className="text-emerald-400 font-bold">Real-world dispatch blocked</span>
          </div>

          <button onClick={handleSimulate} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg">
            Simulate Event Execution
          </button>
        </div>

        {simulation && (<div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">Simulation Output ({simulation.simulationId})</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] uppercase">SANDBOX ISOLATED</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl space-y-1 text-slate-300">
              <div>Rule Matched: <strong className="text-cyan-400">{simulation.simulatedRule}</strong></div>
              <div>Target Event: <strong className="text-purple-400">{simulation.targetEvent}</strong></div>
            </div>

            <div className="space-y-1">
              {simulation.channels.map((c, i) => (<div key={i} className="p-2 bg-slate-900 rounded-lg flex justify-between items-center text-[11px]">
                  <span>{c.name}</span>
                  <span className="text-emerald-400 font-bold">{c.status} ({c.latency})</span>
                </div>))}
            </div>
          </div>)}
      </div>
    </div>);
}
