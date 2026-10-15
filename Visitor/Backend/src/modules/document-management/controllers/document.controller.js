const service = require('../services/document.service');
const path = require('path');
const fs = require('fs');
const { resolveStorageFile } = require('../../../utils/fileStorage');

class VisitorDocumentController {
  // GET /api/documents/dashboard
  async getDashboard(req, res, next) {
    try {
      const data = await service.getDashboardMetrics();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/documents
  async getDocuments(req, res, next) {
    try {
      const data = await service.listDocuments(req.query);
      res.json({ success: true, data: data.documents, total: data.total, page: data.page, limit: data.limit });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/documents/categories
  async getCategories(req, res, next) {
    try {
      const categories = await service.getCategories();
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/documents/categories
  async createCategory(req, res, next) {
    try {
      const category = await service.createCategory(req.body);
      res.status(201).json({ success: true, message: 'Category created successfully', data: category });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/documents/statuses
  async getStatuses(req, res, next) {
    try {
      const statuses = await service.getStatuses();
      res.json({ success: true, data: statuses });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/documents/:id
  async getDocumentById(req, res, next) {
    try {
      const doc = await service.getDocumentById(req.params.id);
      res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/documents/ocr-extract
  async ocrExtract(req, res, next) {
    try {
      const ocrData = await service.extractOcrData(req.file, req.body.document_type || 'Passport');
      res.json({ success: true, data: ocrData });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/documents
  async uploadDocument(req, res, next) {
    try {
      const doc = await service.createDocument(req.file, req.body, req.user);
      res.status(201).json({ success: true, message: 'Document uploaded successfully', data: doc });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/documents/bulk-upload
  async bulkUpload(req, res, next) {
    try {
      const docs = await service.bulkUpload(req.files, req.body, req.user);
      res.status(201).json({ success: true, message: `${docs.length} documents uploaded successfully`, data: docs });
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/documents/:id
  async updateMetadata(req, res, next) {
    try {
      const updated = await service.updateMetadata(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Document metadata updated', data: updated });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/documents/:id/replace
  async replaceDocument(req, res, next) {
    try {
      const replaced = await service.replaceFile(req.params.id, req.file, req.body, req.user);
      res.json({ success: true, message: 'Document replaced successfully with new version', data: replaced });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/documents/:id/verify
  async verifyDocument(req, res, next) {
    try {
      const verified = await service.recordVerification(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Document verification status updated', data: verified });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/documents/:id/approve
  async approveDocument(req, res, next) {
    try {
      const approved = await service.recordApproval(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Document approval status updated', data: approved });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/documents/:id/restore-version/:versionNumber
  async restoreVersion(req, res, next) {
    try {
      const restored = await service.restoreVersion(req.params.id, req.params.versionNumber, req.user);
      res.json({ success: true, message: `Document version restored to v${req.params.versionNumber}`, data: restored });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/documents/:id/download (supports ?inline=true for iframe/image reading)
  async downloadDocument(req, res, next) {
    try {
      const doc = await service.getDocumentById(req.params.id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document record not found' });
      }

      const fileRef = doc.file_path || doc.file_url || doc.document_url;
      if (!fileRef) {
        return res.status(404).json({ success: false, message: 'File path reference missing in record' });
      }

      const resolved = resolveStorageFile(fileRef);

      if (resolved.exists && resolved.fullPath) {
        const isInline = req.query.inline === 'true' || req.query.view === '1';
        const docName = doc.original_file_name || doc.document_name || resolved.filename || 'document.pdf';
        
        res.setHeader('Content-Type', resolved.mimeType || doc.file_type || doc.mime_type || 'application/octet-stream');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (isInline) {
          res.setHeader('Content-Disposition', `inline; filename="${docName}"`);
          return res.sendFile(resolved.fullPath);
        }
        return res.download(resolved.fullPath, docName);
      }

      // If physical file not found on disk:
      return res.status(404).json({
        success: false,
        message: 'Physical document file not found on storage server',
        fileRef
      });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/documents/:id/status
  async updateStatus(req, res, next) {
    try {
      const { status, remarks } = req.body;
      const updated = await service.updateStatus(req.params.id, status, remarks, req.user);
      res.json({ success: true, message: `Document status updated to ${status}`, data: updated });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/documents/:id/archive
  async archiveDocument(req, res, next) {
    try {
      const archived = await service.archiveDocument(req.params.id, req.user);
      res.json({ success: true, message: 'Document archived successfully', data: archived });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/documents/:id/restore
  async restoreDocument(req, res, next) {
    try {
      const restored = await service.restoreDocument(req.params.id, req.user);
      res.json({ success: true, message: 'Document restored successfully', data: restored });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/documents/:id
  async deleteDocument(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      await service.deleteDocument(req.params.id, userId, req.user);
      res.json({ success: true, message: 'Document deleted successfully (Soft Delete)' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VisitorDocumentController();
