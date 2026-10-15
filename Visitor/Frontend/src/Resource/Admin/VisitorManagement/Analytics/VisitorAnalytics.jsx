import React from 'react';
export default function VisitorAnalytics() {
    return (<div className="vms-visitor-analytics space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="bi bi-pie-chart-fill text-indigo-400"></i> Visitor Traffic Analytics & Insights
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            System-wide statistics on visitor volume, peak check-in hours, departmental distribution, and compliance rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge bg-indigo-950 text-indigo-400 border border-indigo-800 px-3 py-1.5 text-xs font-mono">
            Month: July 2026
          </span>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Visits This Month</div>
          <div className="text-3xl font-black text-white">1,482</div>
          <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
            <i className="bi bi-arrow-up-right"></i> +14.2% from last month
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="text-xs text-slate-400 font-semibold uppercase">Average Daily Traffic</div>
          <div className="text-3xl font-black text-indigo-400">68</div>
          <div className="text-[11px] text-slate-400">Peak day: Tuesday (94 visitors)</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="text-xs text-slate-400 font-semibold uppercase">Avg Stay Duration</div>
          <div className="text-3xl font-black text-purple-400">2.4 hrs</div>
          <div className="text-[11px] text-slate-400">Compliance score: 98.6%</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="text-xs text-slate-400 font-semibold uppercase">Identity Verification Rate</div>
          <div className="text-3xl font-black text-emerald-400">99.1%</div>
          <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
            <i className="bi bi-shield-check"></i> 1,468 ID Verified
          </div>
        </div>
      </div>

      {/* Traffic Breakdown Visual Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
            <span><i className="bi bi-clock text-amber-400 me-2"></i> Visitor Arrival Peak Hours</span>
            <span className="text-xs text-slate-500 font-normal">Based on 24-hr gate scans</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">08:00 AM - 10:00 AM (Morning Rush)</span>
                <span className="font-bold text-amber-400">42% (622 visitors)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">10:00 AM - 01:00 PM (Midday Meetings)</span>
                <span className="font-bold text-indigo-400">33% (489 visitors)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '33%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">01:00 PM - 04:00 PM (Afternoon Business)</span>
                <span className="font-bold text-purple-400">18% (266 bg-purple)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '18%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">04:00 PM - 07:00 PM (Evening Departure)</span>
                <span className="font-bold text-emerald-400">7% (105 visitors)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '7%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
            <span><i className="bi bi-tag text-indigo-400 me-2"></i> Visitor Category Distribution</span>
            <span className="text-xs text-slate-500 font-normal">Active categories</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block mb-1">Standard / Business</span>
              <span className="text-xl font-bold text-white">58%</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block mb-1">Vendors & Suppliers</span>
              <span className="text-xl font-bold text-indigo-400">22%</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block mb-1">Contractors & IT</span>
              <span className="text-xl font-bold text-purple-400">12%</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block mb-1">VIP & Executives</span>
              <span className="text-xl font-bold text-emerald-400">8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
