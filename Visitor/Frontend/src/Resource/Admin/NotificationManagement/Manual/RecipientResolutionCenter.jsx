import React, { useState, useCallback } from 'react';
import { Search, Users, UserPlus, UserMinus, AlertTriangle, CheckCircle2, Building2, Shield, Mail, Phone, Globe, Filter } from 'lucide-react';
import { manualNotificationApi } from '../../../../services/api';
export default function RecipientResolutionCenter({ selectedRecipients, onRecipientsChange }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [validationWarnings, setValidationWarnings] = useState([]);
    // Filters
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    // Scope selection
    const [scopeMode, setScopeMode] = useState('individual');
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim() && !roleFilter)
            return;
        setSearching(true);
        try {
            const res = await manualNotificationApi.searchRecipients({
                q: searchQuery,
                role: roleFilter || undefined,
                status: statusFilter || undefined
            });
            setSearchResults(res.data?.data || res.data || []);
        }
        catch (err) {
            // Mock fallback
            setSearchResults([
                { id: 1, full_name: 'Sarah Johnson', email: 'sarah.johnson@company.com', phone: '+1-555-0101', role: 'employee', department_id: 1, status: 'active' },
                { id: 2, full_name: 'Michael Chen', email: 'michael.chen@company.com', phone: '+1-555-0102', role: 'manager', department_id: 2, status: 'active' },
                { id: 3, full_name: 'Emily Roberts', email: 'emily.roberts@company.com', phone: '+1-555-0103', role: 'receptionist', department_id: 1, status: 'active' },
                { id: 4, full_name: 'James Wilson', email: 'james.wilson@company.com', phone: '+1-555-0104', role: 'security', department_id: 3, status: 'active' },
                { id: 5, full_name: 'Admin User', email: 'admin@company.com', phone: '+1-555-0105', role: 'admin', department_id: 1, status: 'active' },
                { id: 6, full_name: 'Diana Taylor', email: 'diana.taylor@company.com', phone: '+1-555-0106', role: 'employee', department_id: 2, status: 'inactive' }
            ].filter(u => (!searchQuery || u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
                (!roleFilter || u.role === roleFilter)));
        }
        finally {
            setSearching(false);
        }
    }, [searchQuery, roleFilter, statusFilter]);
    const addRecipient = (user) => {
        if (selectedRecipients.find(r => r.id === user.id))
            return;
        if (user.status === 'inactive' || user.status === 'disabled') {
            setValidationWarnings(prev => [...prev, { userId: user.id, name: user.full_name, reason: `Account is ${user.status}` }]);
        }
        onRecipientsChange([...selectedRecipients, user]);
    };
    const removeRecipient = (userId) => {
        onRecipientsChange(selectedRecipients.filter(r => r.id !== userId));
        setValidationWarnings(prev => prev.filter(w => w.userId !== userId));
    };
    const removeAll = () => {
        onRecipientsChange([]);
        setValidationWarnings([]);
    };
    const addAllResults = () => {
        const newRecipients = searchResults.filter(sr => !selectedRecipients.find(r => r.id === sr.id));
        onRecipientsChange([...selectedRecipients, ...newRecipients]);
    };
    const getRoleBadgeColor = (role) => {
        switch (role.toLowerCase()) {
            case 'admin': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            case 'manager': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'security': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'receptionist': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
            default: return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
        }
    };
    return (<div className="space-y-4">
      {/* Scope Mode Selector */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-2">
          <Users className="h-4 w-4 text-indigo-400"/>
          <span>Recipient Targeting Scope</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'individual', label: 'Individual Users', icon: UserPlus },
            { id: 'role', label: 'Entire Role Group', icon: Shield },
            { id: 'department', label: 'Entire Department', icon: Building2 },
            { id: 'organization', label: 'Entire Organization', icon: Globe }
        ].map(s => {
            const Icon = s.icon;
            return (<button key={s.id} onClick={() => setScopeMode(s.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${scopeMode === s.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-950 text-slate-400 border-slate-700 hover:bg-slate-800'}`}>
                <Icon className="h-3.5 w-3.5"/>
                <span>{s.label}</span>
              </button>);
        })}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400"/>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search by name, email, user ID, employee ID, phone..." className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500"/>
          </div>
          <button onClick={handleSearch} disabled={searching} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md">
            {searching ? 'Searching...' : 'Search'}
          </button>
          <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-xl border text-xs ${showFilters ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-700'}`}>
            <Filter className="h-4 w-4"/>
          </button>
        </div>

        {showFilters && (<div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Role</label>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                <option value="">All Roles</option>
                <option value="admin">Administrator</option>
                <option value="manager">Department Manager</option>
                <option value="employee">Employee</option>
                <option value="receptionist">Receptionist</option>
                <option value="security">Security Officer</option>
                <option value="visitor">Visitor</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Account Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Organization</label>
              <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                <option value="">All Organizations</option>
                <option value="1">HQ Organization</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Department</label>
              <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                <option value="">All Departments</option>
                <option value="1">Human Resources</option>
                <option value="2">Engineering</option>
                <option value="3">Security</option>
              </select>
            </div>
          </div>)}
      </div>

      {/* Results & Selected Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Search Results Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              Search Results ({searchResults.length})
            </span>
            {searchResults.length > 0 && (<button onClick={addAllResults} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold">
                + Add All
              </button>)}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
            {searchResults.length === 0 ? (<div className="p-6 text-center text-xs text-slate-500">
                Search for recipients using the search bar above.
              </div>) : (searchResults.map(user => {
            const isSelected = selectedRecipients.find(r => r.id === user.id);
            const isInactive = user.status === 'inactive' || user.status === 'disabled';
            return (<div key={user.id} className={`p-3 flex items-center justify-between hover:bg-slate-800/50 transition-all ${isSelected ? 'opacity-50' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black">
                        {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">{user.full_name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                          {isInactive && (<span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[9px] font-bold">
                              {user.status}
                            </span>)}
                        </div>
                        <div className="flex items-center space-x-3 mt-0.5">
                          <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                            <Mail className="h-2.5 w-2.5"/> <span>{user.email}</span>
                          </span>
                          {user.phone && (<span className="text-[10px] text-slate-500 flex items-center space-x-1">
                              <Phone className="h-2.5 w-2.5"/> <span>{user.phone}</span>
                            </span>)}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => addRecipient(user)} disabled={!!isSelected} className={`p-1.5 rounded-lg text-xs font-bold ${isSelected
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'}`}>
                      <UserPlus className="h-3.5 w-3.5"/>
                    </button>
                  </div>);
        }))}
          </div>
        </div>

        {/* Selected Recipients Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Selected Recipients
              </span>
              <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-black">
                {selectedRecipients.length}
              </span>
            </div>
            {selectedRecipients.length > 0 && (<button onClick={removeAll} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold">
                Remove All
              </button>)}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
            {selectedRecipients.length === 0 ? (<div className="p-6 text-center text-xs text-slate-500">
                No recipients selected. Search and add users above.
              </div>) : (selectedRecipients.map(user => (<div key={user.id} className="p-3 flex items-center justify-between hover:bg-slate-800/50">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-black">
                      {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white">{user.full_name}</span>
                      <div className="text-[10px] text-slate-400">{user.email}</div>
                    </div>
                  </div>
                  <button onClick={() => removeRecipient(user.id)} className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-all">
                    <UserMinus className="h-3.5 w-3.5"/>
                  </button>
                </div>)))}
          </div>

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (<div className="p-3 border-t border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center space-x-1.5 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400"/>
                <span className="text-[10px] font-bold text-amber-400 uppercase">Validation Warnings</span>
              </div>
              {validationWarnings.map((w, i) => (<div key={i} className="text-[10px] text-amber-300 ml-5">
                  • {w.name}: {w.reason}
                </div>))}
            </div>)}

          {/* Summary Bar */}
          {selectedRecipients.length > 0 && (<div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400"/>
                <span className="text-[10px] font-bold text-slate-300">
                  {selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Est. delivery: {selectedRecipients.length} in-app
              </span>
            </div>)}
        </div>
      </div>
    </div>);
}
