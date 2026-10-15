import React from 'react';
import { HelpCircle, Code } from 'lucide-react';
const PlatformHelpSupportView = () => {
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400"/> Platform Architecture & Integration SDK Guides
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Developer guides for publishing business events from any new or existing VMS module.</p>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Code className="w-4 h-4 text-amber-400"/> How to Publish a Business Event (Node.js SDK)
        </h3>
        <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-amber-300 font-mono text-[11px] overflow-x-auto">
        {`const BusinessEventEngine = require('../engines/BusinessEventEngine');

await BusinessEventEngine.publishEvent('visitor.checked.in', {
  visitorId: 9901,
  visitorName: 'Elena Rostova',
  hostId: 104
}, {
  userId: req.user.id,
  buildingId: 'bldg_hq'
});`}
        </pre>
      </div>
    </div>);
};
export default PlatformHelpSupportView;
