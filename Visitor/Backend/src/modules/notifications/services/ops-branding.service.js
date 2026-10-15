// src/services/admin/ops/BrandingService.js
// Enterprise Notification Branding Management

const { auditLog } = require('../../../utils/audit');

let brandingStore = {
  organizationName: 'Enterprise Visitor Management Hub',
  logoUrl: 'https://vms-enterprise.com/assets/logo.png',
  iconUrl: 'https://vms-enterprise.com/assets/icon-bell.png',
  primaryColor: '#2563eb',
  secondaryColor: '#0f172a',
  accentColor: '#10b981',
  theme: 'dark',
  typography: 'Inter, sans-serif',
  emailHeaderHtml: '<div style="background:#0f172a; padding:20px; border-bottom:3px solid #2563eb; text-align:center;"><img src="https://vms-enterprise.com/assets/logo.png" height="40" alt="VMS Logo"/></div>',
  emailFooterHtml: '<div style="background:#020617; padding:15px; text-align:center; color:#64748b; font-size:12px;">© 2026 Enterprise Visitor Management System. All rights reserved.</div>',
  smsSignature: '- Sent via VMS Security',
  multiTenantBranding: {
    enabled: true,
    tenants: [
      { tenantId: 'tenant_headquarters', name: 'HQ Corporate', primaryColor: '#2563eb' },
      { tenantId: 'tenant_branch_north', name: 'North Branch', primaryColor: '#059669' }
    ]
  }
};

async function getBranding() {
  return brandingStore;
}

async function updateBranding(newBranding, userId = 'admin') {
  brandingStore = { ...brandingStore, ...newBranding };

  await auditLog({
    userId,
    entity: 'notification_branding',
    action: 'update_branding',
    details: { organizationName: brandingStore.organizationName }
  });

  return brandingStore;
}

async function renderTemplatePreview(templateHtml, sampleVariables = {}) {
  let compiled = templateHtml || brandingStore.emailHeaderHtml + '<h3>Notification Title</h3><p>Dear {{recipientName}}, your visit code is {{visitCode}}.</p>' + brandingStore.emailFooterHtml;

  Object.keys(sampleVariables).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    compiled = compiled.replace(regex, sampleVariables[key]);
  });

  return {
    compiledHtml: compiled,
    smsText: `[VMS Alert] Dear ${sampleVariables.recipientName || 'User'}, visit code: ${sampleVariables.visitCode || 'V-1001'} ${brandingStore.smsSignature}`
  };
}

module.exports = {
  getBranding,
  updateBranding,
  renderTemplatePreview
};
