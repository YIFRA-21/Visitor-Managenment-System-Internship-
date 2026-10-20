import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import api from '../../../../../services/api';
import useResponseNavigation from '../../../../../modules/response/useResponseNavigation';
import { RESPONSE_TYPES } from '../../../../../modules/response/responseConfig';

export default function BackupManager({ onNotify, onRefresh }) {
    const { toConfirmation, toSuccess, toError } = useResponseNavigation();
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const fetchBackups = async () => {
        setLoading(true);
        try {
            const res = await api.get('/settings/backups');
            setBackups(res.data || []);
        }
        catch {
            onNotify('Failed to fetch backup lists.', 'danger');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchBackups();
    }, []);
    const handleCreateBackup = async () => {
        setCreating(true);
        try {
            const res = await api.post('/settings/backups');
            if (res.data.success) {
                onNotify('Database settings snapshot backup generated.', 'success');
                fetchBackups();
                onRefresh();
            }
        }
        catch {
            onNotify('Backup creation failed.', 'danger');
        }
        finally {
            setCreating(false);
        }
    };
    const handleRestoreBackup = (id) => {
        toConfirmation({
            title: 'Restore System Configuration Snapshot',
            message: 'WARNING: Restoring will overwrite all active system configurations with this backup snapshot.',
            entityType: 'System Snapshot',
            entityName: `Snapshot #${id}`,
            entityId: id,
            consequences: [
                'Current active configurations will be replaced with snapshot contents.',
                'Active user sessions may experience a momentary connection refresh.'
            ],
            confirmLabel: 'Proceed with System Restore',
            confirmVariant: 'danger',
            apiEndpoint: '/settings/restore',
            apiMethod: 'POST',
            apiPayload: { id },
            returnUrl: window.location.pathname,
            successConfig: {
                type: RESPONSE_TYPES.SYSTEM_BACKUP_RESULT,
                title: 'System Restored Successfully',
                message: 'The system has been restored to the selected snapshot.',
            }
        });
    };
    const handleDeleteBackup = (id) => {
        toConfirmation({
            title: 'Delete Backup Snapshot',
            message: 'Delete this backup snapshot permanently from the archive?',
            entityType: 'Backup Archive',
            entityName: `Snapshot #${id}`,
            entityId: id,
            consequences: [
                'The snapshot archive will be removed permanently.',
                'You will no longer be able to rollback to this point in time.'
            ],
            confirmLabel: 'Delete Snapshot',
            confirmVariant: 'danger',
            apiEndpoint: `/settings/backups/${id}`,
            apiMethod: 'DELETE',
            returnUrl: window.location.pathname,
            successConfig: {
                type: RESPONSE_TYPES.SUCCESS,
                title: 'Snapshot Deleted',
                message: 'The backup snapshot was deleted from disk.',
            }
        });
    };
    return (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center border-bottom pb-3 dark:border-slate-800">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-1">
            System Snapshots & Recovery (Backup & Restore)
          </h3>
          <p className="text-xxs text-slate-400 font-semibold mb-0">Restore active configurations or create local snapshot backups.</p>
        </div>
        <button onClick={handleCreateBackup} disabled={creating} className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 text-xxs font-bold">
          <Plus className="h-4 w-4"/> Create Snapshot
        </button>
      </div>

      {loading ? (<div className="p-16 text-center">
          <div className="spinner-border text-primary" role="status"/>
          <p className="text-slate-400 text-xs fw-semibold mt-3">Fetching snapshots database...</p>
        </div>) : backups.length === 0 ? (<div className="p-16 text-center text-slate-400">
          No system backup snapshots have been created yet.
        </div>) : (<div className="table-responsive">
          <table className="table align-middle text-xs mb-0">
            <thead>
              <tr className="text-slate-500 uppercase font-bold text-[9px] border-bottom dark:border-slate-800">
                <th>Backup Snapshot Date</th>
                <th>Snapshot Size</th>
                <th>Created By</th>
                <th>Operation Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-350">
              {backups.map((b) => (<tr key={b.id}>
                  <td className="font-extrabold text-slate-950 dark:text-white py-3">
                    {new Date(b.date).toLocaleDateString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                  </td>
                  <td>{b.size}</td>
                  <td>{b.createdBy}</td>
                  <td>
                    <span className="badge bg-success-subtle text-success text-[8px] font-bold uppercase px-1.5 py-0.5 rounded">
                      {b.status}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end gap-1.5">
                      <button onClick={() => handleRestoreBackup(b.id)} className="btn btn-xs btn-outline-warning d-flex align-items-center gap-1 font-bold text-xxs px-2 py-1" title="Restore system settings to this state">
                        <RotateCcw className="h-3.5 w-3.5"/> Restore
                      </button>
                      <button onClick={() => handleDeleteBackup(b.id)} className="btn btn-xs btn-outline-danger p-1 rounded">
                        <Trash2 className="h-3.5 w-3.5"/>
                      </button>
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>)}
    </div>);
}
