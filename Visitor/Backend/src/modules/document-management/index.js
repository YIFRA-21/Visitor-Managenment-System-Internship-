const documentController = require('./controllers/document.controller');
const documentService = require('./services/document.service');
const documentRepository = require('./repositories/document.repository');
const documentRoutes = require('./routes/document.routes');

module.exports = {
  documentController,
  documentService,
  documentRepository,
  documentRoutes,
};
