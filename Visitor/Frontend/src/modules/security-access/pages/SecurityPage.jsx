import { useEffect, useState } from 'react';
import { Shield, Ban, Search, Trash2 } from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';
import { securityApi } from '../../../services/api';
export default function SecurityPage() {
    const [blacklist, setBlacklist] = useState([]);
    const [verifyCode, setVerifyCode] = useState('');
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifyError, setVerifyError] = useState('');
    useEffect(() => {
        securityApi.blacklist().then((res) => setBlacklist(res.data));
    }, []);
    const handleVerify = async () => {
        setVerifyError('');
        setVerifyResult(null);
        try {
            const res = await securityApi.verify(verifyCode);
            setVerifyResult(res.data);
        }
        catch {
            setVerifyError('Appointment not found');
        }
    };
    const handleRemove = async (id) => {
        await securityApi.removeBlacklist(id);
        const res = await securityApi.blacklist();
        setBlacklist(res.data);
    };
    return (<DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Security & Access Control</h1>
        <p className="text-slate-500">Verify visitors and manage blacklist</p>
      </div>

      <div className="card mb-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <Search className="h-5 w-5 text-brand-600"/>
          Verify Authorization
        </h3>
        <div className="flex gap-3">
          <input className="input flex-1" placeholder="Enter reference code" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}/>
          <button onClick={handleVerify} className="btn-primary">Verify</button>
        </div>
        {verifyError && <p className="mt-2 text-sm text-red-600">{verifyError}</p>}
        {verifyResult && (<div className={`mt-4 rounded-xl p-4 ${Number(verifyResult.is_blacklisted) ? 'bg-red-50' : 'bg-emerald-50'}`}>
            <p className="font-semibold">{verifyResult.full_name}</p>
            <p className="text-sm text-slate-600">Status: {verifyResult.status} · Host: {verifyResult.host_name}</p>
            {Number(verifyResult.is_blacklisted) > 0 && (<p className="mt-1 text-sm font-medium text-red-700">⚠ Visitor is BLACKLISTED</p>)}
          </div>)}
      </div>

      <div className="card">
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <Ban className="h-5 w-5 text-red-600"/>
          Blacklisted Visitors ({blacklist.length})
        </h3>
        {blacklist.length === 0 ? (<div className="py-8 text-center text-slate-400">
            <Shield className="mx-auto h-10 w-10 mb-2 opacity-30"/>
            <p>No blacklisted visitors</p>
          </div>) : (<div className="space-y-3">
            {blacklist.map((b) => (<div key={b.id} className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 p-4">
                <div>
                  <p className="font-semibold text-red-900">{b.full_name}</p>
                  <p className="text-sm text-red-700/70">{b.email} · {b.company}</p>
                  <p className="text-xs text-red-600 mt-1">Reason: {b.reason}</p>
                </div>
                <button onClick={() => handleRemove(parseInt(b.id))} className="rounded-lg p-2 text-red-600 hover:bg-red-100 transition" title="Remove from blacklist">
                  <Trash2 className="h-4 w-4"/>
                </button>
              </div>))}
          </div>)}
      </div>
    </DashboardLayout>);
}
