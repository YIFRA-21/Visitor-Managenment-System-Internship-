import React, { useState } from 'react';
import { PackageCheck, Plus, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AssetReturnVerification() {
    const { t } = useLanguage();
    const [visitorCode, setVisitorCode] = useState('');
    const [assets, setAssets] = useState([
        { id: '1', name: 'Visitor Pass Badge #104', serialNumber: 'BDG-104', condition: 'GOOD', returned: true, remarks: '' },
        { id: '2', name: 'Lobby Access Card', serialNumber: 'ACC-882', condition: 'GOOD', returned: true, remarks: '' },
        { id: '3', name: 'Temporary Laptop Sticker', serialNumber: 'TAG-990', condition: 'GOOD', returned: true, remarks: '' },
    ]);
    const [newAsset, setNewAsset] = useState({ name: '', serialNumber: '' });
    const [submitted, setSubmitted] = useState(false);
    const addAsset = () => {
        if (!newAsset.name.trim())
            return;
        setAssets(prev => [...prev, {
                id: Date.now().toString(),
                name: newAsset.name,
                serialNumber: newAsset.serialNumber || 'N/A',
                condition: 'GOOD',
                returned: true,
                remarks: '',
            }]);
        setNewAsset({ name: '', serialNumber: '' });
    };
    const removeAsset = (id) => {
        setAssets(prev => prev.filter(a => a.id !== id));
    };
    const updateAsset = (id, key, value) => {
        setAssets(prev => prev.map(a => a.id === id ? { ...a, [key]: value } : a));
    };
    const handleSave = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <PackageCheck className="h-6 w-6 text-emerald-500"/> {t('receptionist.assetReturnTitle', 'Asset & Equipment Return Verification')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('receptionist.assetReturnDesc', 'Verify returned organization property, badges, and temporary access equipment')}
          </p>
        </div>

        {submitted ? (<div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto"/>
            <p className="text-xl font-black text-slate-800 dark:text-white">{t('receptionist.assetSaved', 'Asset Verification Saved')}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {assets.filter(a => a.returned).length} of {assets.length} assets confirmed returned cleanly.
            </p>
            <button onClick={() => setSubmitted(false)} className="mt-2 px-5 py-2 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition shadow">
              {t('btn.verifyNextAssets', 'Verify Next Visitor Assets')}
            </button>
          </div>) : (<form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                {t('form.badgeOrCode', 'Visitor Badge / Reference Code')}
              </label>
              <input type="text" value={visitorCode} onChange={e => setVisitorCode(e.target.value)} placeholder={t('placeholder.badgeOrCode', 'VMS-XXXX or Badge #...')} required className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"/>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  {t('form.issuedEquipmentChecklist', 'Issued Equipment Checklist')}
                </label>
                <span className="text-xs text-slate-400">{assets.length} item(s) tracked</span>
              </div>

              {assets.map(item => (<div key={item.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white text-sm">{item.name}</p>
                      <p className="text-[11px] font-mono text-slate-400">S/N: {item.serialNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateAsset(item.id, 'returned', !item.returned)} className={`px-3 py-1 text-xs font-bold rounded-lg transition ${item.returned ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                        {item.returned ? t('status.returned', 'Returned ✓') : t('status.missing', 'Missing ✗')}
                      </button>
                      <button type="button" onClick={() => removeAsset(item.id)} className="text-slate-400 hover:text-red-500 p-1">
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400">{t('form.condition', 'Condition')}</label>
                      <select value={item.condition} onChange={e => updateAsset(item.id, 'condition', e.target.value)} className="w-full mt-0.5 p-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-lg">
                        <option value="GOOD">{t('condition.good', 'Good Condition')}</option>
                        <option value="DAMAGED">{t('condition.damaged', 'Damaged')}</option>
                        <option value="MISSING">{t('condition.missing', 'Missing / Lost')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">{t('form.remarks', 'Remarks')}</label>
                      <input type="text" value={item.remarks} onChange={e => updateAsset(item.id, 'remarks', e.target.value)} placeholder={t('placeholder.remarks', 'Scratch on back...')} className="w-full mt-0.5 p-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-lg"/>
                    </div>
                  </div>
                </div>))}
            </div>

            {/* Add Custom Item */}
            <div className="p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t('form.addExtraItem', 'Add Extra Loaned Item')}</p>
              <div className="flex gap-2">
                <input type="text" value={newAsset.name} onChange={e => setNewAsset(a => ({ ...a, name: e.target.value }))} placeholder={t('placeholder.itemName', 'Item name (e.g. Projector Remote)')} className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-lg"/>
                <input type="text" value={newAsset.serialNumber} onChange={e => setNewAsset(a => ({ ...a, serialNumber: e.target.value }))} placeholder={t('placeholder.serialTag', 'Tag / Serial #')} className="w-32 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-lg"/>
                <button type="button" onClick={addAsset} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition">
                  <Plus className="h-4 w-4"/>
                </button>
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4"/> {t('btn.confirmAssetReturn', 'Confirm Asset Return')}
            </button>
          </form>)}
      </div>
    </div>);
}
