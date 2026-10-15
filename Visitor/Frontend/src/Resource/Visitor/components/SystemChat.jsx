import React, { useState } from 'react';
import { MessageSquare, Send, User, Shield, PhoneCall } from 'lucide-react';
export default function SystemChat({ onBack }) {
    const [activeThread, setActiveThread] = useState('reception');
    const [messages, setMessages] = useState({
        reception: [
            { sender: 'Reception Desk', text: 'Hello John, your appointment is confirmed. Please arrive at least 10 minutes early.', time: '09:30 AM', isUser: false },
            { sender: 'John Doe', text: 'Thank you! See you tomorrow.', time: '09:31 AM', isUser: true },
            { sender: 'Reception Desk', text: "You're welcome. Have a great day!", time: '09:32 AM', isUser: false }
        ],
        host: [
            { sender: 'Michael Johnson', text: 'Hi John, looking forward to our meeting tomorrow.', time: 'Yesterday', isUser: false }
        ],
        security: [
            { sender: 'Security Team', text: 'ID verification completed successfully.', time: 'May 16', isUser: false }
        ],
        support: [
            { sender: 'Admin Support', text: 'How can we assist you today?', time: 'May 15', isUser: false }
        ]
    });
    const [inputMsg, setInputMsg] = useState('');
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMsg.trim())
            return;
        const newMsg = {
            sender: 'John Doe',
            text: inputMsg,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isUser: true
        };
        setMessages({
            ...messages,
            [activeThread]: [...messages[activeThread], newMsg]
        });
        setInputMsg('');
    };
    const conversations = [
        { key: 'reception', label: 'Reception Desk', sub: 'Online', icon: <MessageSquare className="h-4 w-4 text-emerald-400"/> },
        { key: 'host', label: 'Michael Johnson', sub: 'Host', icon: <User className="h-4 w-4 text-blue-400"/> },
        { key: 'security', label: 'Security Team', sub: 'Online', icon: <Shield className="h-4 w-4 text-amber-400"/> },
        { key: 'support', label: 'Admin Support', sub: 'Online', icon: <PhoneCall className="h-4 w-4 text-purple-400"/> }
    ];
    return (<div className="bg-[#0f172a] border border-slate-800 text-white rounded-2xl p-6 max-w-4xl mx-auto shadow-2xl space-y-4">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 block mb-1">
          Dashboard &gt; System Chat
        </span>
        <h2 className="text-lg font-extrabold text-white mb-0">System Chat & Assistance</h2>
      </div>

      <div className="row g-4 align-items-stretch" style={{ minHeight: '420px' }}>
        {/* Conversations Sidebar */}
        <div className="col-12 col-md-4">
          <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-3 space-y-2 h-100">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 px-2 block mb-2">Conversations</span>
            {conversations.map((c) => {
            const active = activeThread === c.key;
            return (<button key={c.key} onClick={() => setActiveThread(c.key)} className={`w-100 text-start border-0 rounded-xl p-3 transition-all d-flex align-items-center gap-3 ${active ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900/50 hover:bg-slate-800 text-slate-300'}`}>
                  <div className={`p-2 rounded-lg ${active ? 'bg-blue-700' : 'bg-slate-800'}`}>
                    {c.icon}
                  </div>
                  <div>
                    <p className="font-extrabold text-xs mb-0">{c.label}</p>
                    <span className={`text-[10px] font-semibold ${active ? 'text-blue-200' : 'text-emerald-400'}`}>{c.sub}</span>
                  </div>
                </button>);
        })}
          </div>
        </div>

        {/* Message Thread Area */}
        <div className="col-12 col-md-8">
          <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-4 d-flex flex-column justify-content-between h-100 space-y-4">
            {/* Thread Header */}
            <div className="border-bottom border-slate-800 pb-2.5 d-flex justify-content-between align-items-center">
              <div>
                <h3 className="font-extrabold text-xs text-white mb-0 uppercase tracking-wider">
                  {conversations.find(c => c.key === activeThread)?.label}
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold">We're here to help you!</span>
              </div>
              <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            {/* Messages Scroll Panel */}
            <div className="space-y-3 flex-grow-1 overflow-y-auto px-1 max-h-[280px]">
              {(messages[activeThread] || []).map((msg, i) => (<div key={i} className={`d-flex flex-column ${msg.isUser ? 'align-items-end' : 'align-items-start'}`}>
                  <div className={`p-3 rounded-2xl text-xs max-w-[80%] space-y-1 ${msg.isUser
                ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'}`}>
                    <p className="mb-0 leading-normal font-semibold">{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold mt-1 px-1">{msg.time}</span>
                </div>))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="d-flex gap-2 pt-2 border-top border-slate-800">
              <input type="text" className="form-control bg-slate-900 border-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl" placeholder="Type your message..." value={inputMsg} onChange={(e) => setInputMsg(e.target.value)}/>
              <button type="submit" className="btn bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl d-flex align-items-center justify-content-center shrink-0 shadow-md shadow-emerald-600/20">
                <Send className="h-4 w-4"/>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>);
}
