class TemplateEngine {
  renderTemplate(templateString, variables = {}) {
    if (!templateString) return '';
    return templateString.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }
}

module.exports = new TemplateEngine();
