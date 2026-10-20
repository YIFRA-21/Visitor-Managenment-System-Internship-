import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { WorkerCard } from './components/OperationsCards';
import { useResponseNavigation } from '../../../../modules/response';
export default function WorkerManagementView() {
    const { toConfirmation } = useResponseNavigation();
    const [workers, setWorkers] = useState([
        { id: 'worker_1', name: 'RabbitMQ Consumer #1 (High Priority)', status: 'active', assignedQueue: 'q_high_priority', processedCount: 1450, failedCount: 2, cpuUsagePct: 4.2 },
        { id: 'worker_2', name: 'RabbitMQ Consumer #2 (Normal Priority)', status: 'active', assignedQueue: 'q_normal_priority', processedCount: 12400, failedCount: 12, cpuUsagePct: 11.5 },
        { id: 'worker_3', name: 'RabbitMQ Consumer #3 (Retry & DLQ)', status: 'idle', assignedQueue: 'q_retry_dlq', processedCount: 380, failedCount: 0, cpuUsagePct: 0.8 }
    ]);
    return (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-5 text-xs font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-purple-400"/>
            <span>Notification Worker Management Console (§6)</span>
          </h3>
          <p className="text-slate-400 mt-0.5">Monitor queue consumers, active worker threads, CPU load, and restart worker processes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workers.map(w => (<WorkerCard key={w.id} {...w} onRestart={() => {
          toConfirmation({
            title: 'Restart Queue Worker',
            message: `Are you sure you want to send a graceful restart signal to "${w.name}"?`,
            actionType: 'RESTART_WORKER',
            targetEntity: w.name,
            consequences: [
              'The worker process will complete pending message acknowledgements.',
              'The consumer connection will reconnect to ' + w.assignedQueue,
              'Processing will resume automatically after thread initialization.'
            ],
            confirmLabel: 'Restart Worker',
            cancelLabel: 'Cancel',
            danger: false,
            onConfirmApi: () => Promise.resolve({ data: { success: true } }),
            successTitle: 'Worker Restart Initiated',
            successMessage: `Restart signal sent to ${w.name}.`,
            returnUrl: window.location.pathname + window.location.search
          });
        }}/>))}
      </div>
    </div>);
}
