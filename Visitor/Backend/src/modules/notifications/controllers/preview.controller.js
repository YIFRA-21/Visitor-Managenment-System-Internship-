// src/controllers/admin/PreviewController.js
// Handles Notification Preview (Desktop, Browser, Mobile, Email, SMS, localization, dynamic variables)

async function renderPreview(req, res) {
  try {
    const { template, variables, channel, device, locale, theme } = req.body;

    let compiledTitle = template?.title || 'Notification Title';
    let compiledBody = template?.body || 'Notification content body goes here.';

    if (variables) {
      Object.keys(variables).forEach(k => {
        const regex = new RegExp(`\\{\\{${k}\\}\\}`, 'g');
        compiledTitle = compiledTitle.replace(regex, variables[k]);
        compiledBody = compiledBody.replace(regex, variables[k]);
      });
    }

    res.json({
      success: true,
      data: {
        channel: channel || 'email',
        device: device || 'desktop',
        locale: locale || 'en',
        theme: theme || 'dark',
        rendered: {
          title: compiledTitle,
          body: compiledBody,
          htmlPreview: `<div style="padding:16px; background:#0f172a; color:#f8fafc; font-family:sans-serif;"><h3>${compiledTitle}</h3><p>${compiledBody}</p></div>`
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  renderPreview
};
