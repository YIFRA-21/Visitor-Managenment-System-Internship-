class RecipientEngine {
  resolveRecipients(targetScopes, payload) {
    const recipients = [];

    targetScopes.forEach(scope => {
      switch (scope.toLowerCase()) {
        case 'visitor':
          if (payload.visitorEmail) recipients.push({ type: 'Visitor', email: payload.visitorEmail, phone: payload.visitorPhone });
          break;
        case 'employee': case 'host':
          if (payload.hostEmail) recipients.push({ type: 'Host Employee', email: payload.hostEmail, phone: payload.hostPhone });
          break;
        case 'reception':
          recipients.push({ type: 'Reception Officer', email: 'reception@vms.local', phone: '+966500000001' });
          break;
        case 'security':
          recipients.push({ type: 'Security Officer', email: 'security@vms.local', phone: '+966500000002' });
          break;
        case 'manager':
          recipients.push({ type: 'Department Manager', email: 'manager@vms.local' });
          break;
        case 'admin':
          recipients.push({ type: 'System Administrator', email: 'admin@vms.local' });
          break;
        default:
          recipients.push({ type: scope, email: `${scope}@vms.local` });
      }
    });

    // Remove duplicates
    const uniqueMap = new Map();
    recipients.forEach(r => uniqueMap.set(r.email, r));
    return Array.from(uniqueMap.values());
  }
}

module.exports = new RecipientEngine();
