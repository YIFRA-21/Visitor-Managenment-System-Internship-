import React, { useState } from 'react';
import { Save, RefreshCw, BellRing } from 'lucide-react';
export default function NotificationPreferencesForm({ initialData, onSave, isSaving }) {
    const [notifications, setNotifications] = useState(initialData?.notifications || {
        email: { visitorRegistration: true, appointmentApproval: true, checkIn: true, checkOut: true, passExpiration: true, emergencyAlerts: true },
        sms: { visitorRegistration: false, appointmentApproval: true, checkIn: true, checkOut: false, passExpiration: false, emergencyAlerts: true },
        push: { visitorRegistration: true, appointmentApproval: true, checkIn: true, checkOut: true, passExpiration: true, emergencyAlerts: true },
        inApp: { visitorRegistration: true, appointmentApproval: true, checkIn: true, checkOut: true, passExpiration: true, emergencyAlerts: true }
    });
    const handleCellToggle = (channel, event) => {
        setNotifications({
            ...notifications,
            [channel]: {
                ...notifications[channel],
                [event]: !notifications[channel][event]
            }
        });
    };
    const handleReset = () => {
        setNotifications(initialData?.notifications || {
            email: { visitorRegistration: true, appointmentApproval: true, checkIn: true, checkOut: true, passExpiration: true, emergencyAlerts: true },
            sms: { visitorRegistration: false, appointmentApproval: true, checkIn: true, checkOut: false, passExpiration: false, emergencyAlerts: true },
            push: { visitorRegistration: true, appointmentApproval: true, checkIn: true, checkOut: true, passExpiration: true, emergencyAlerts: true },
            inApp: { visitorRegistration: true, appointmentApproval: true, checkIn: true, checkOut: true, passExpiration: true, emergencyAlerts: true }
        });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ notifications });
    };
    const events = [
        { key: 'visitorRegistration', label: 'Visitor Registration' },
        { key: 'appointmentApproval', label: 'Appointment Approval' },
        { key: 'checkIn', label: 'Check-In Event' },
        { key: 'checkOut', label: 'Check-Out Event' },
        { key: 'passExpiration', label: 'Pass Expiration Alert' },
        { key: 'emergencyAlerts', label: 'Emergency Alert Closure' }
    ];
    const channels = [
        { key: 'email', label: '✉ Email Alerts' },
        { key: 'sms', label: '📱 SMS Alerts' },
        { key: 'push', label: '🔔 Push Notify' },
        { key: 'inApp', label: '💻 In-App Log' }
    ];
    return (<form onSubmit={handleSubmit} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="d-flex align-items-center gap-2 border-bottom pb-2 dark:border-slate-800">
        <BellRing className="text-blue-500 h-5 w-5"/>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
          Notification Channel Routing Matrix
        </h3>
      </div>

      <div className="table-responsive">
        <table className="table align-middle text-xs mb-0">
          <thead>
            <tr className="text-slate-500 uppercase font-bold text-[9px] border-bottom dark:border-slate-800">
              <th>Target System Event</th>
              {channels.map((chan) => (<th key={chan.key} className="text-center">{chan.label}</th>))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-350">
            {events.map((evt) => (<tr key={evt.key}>
                <td className="font-extrabold text-slate-950 dark:text-white py-3">{evt.label}</td>
                {channels.map((chan) => {
                const val = notifications[chan.key]?.[evt.key] ?? false;
                return (<td key={chan.key} className="text-center">
                      <input type="checkbox" className="form-check-input" checked={val} style={{ cursor: 'pointer' }} onChange={() => handleCellToggle(chan.key, evt.key)}/>
                    </td>);
            })}
              </tr>))}
          </tbody>
        </table>
      </div>

      <div className="d-flex gap-2 pt-3 border-top dark:border-slate-800">
        <button type="submit" disabled={isSaving} className="btn btn-sm btn-success d-flex align-items-center gap-1.5 font-bold">
          <Save className="h-4 w-4"/> Save Mappings
        </button>
        <button type="button" onClick={handleReset} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 font-bold">
          <RefreshCw className="h-4 w-4"/> Reset
        </button>
      </div>
    </form>);
}
