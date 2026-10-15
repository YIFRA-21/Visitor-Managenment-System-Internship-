const repo = require('../repositories/visitor-category.repository');
const pool = require('../../../config/db');

class VisitorCategoryService {
  async getAllCategories(params) {
    return await repo.findAll(params);
  }

  async getCategoryStats() {
    return await repo.getStats();
  }

  async getCategoryById(id) {
    const category = await repo.findById(id);
    if (!category) {
      const err = new Error(`Visitor category with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }
    return category;
  }

  async getCategoryByCode(code) {
    const category = await repo.findByCode(code);
    if (!category) {
      const err = new Error(`Visitor category with code '${code}' not found or inactive.`);
      err.statusCode = 404;
      throw err;
    }
    return category;
  }

  async createCategory(data, user) {
    // 1. Validate mandatory fields
    if (!data.category_name || !data.category_name.trim()) {
      const err = new Error('Category Name is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!data.category_code || !data.category_code.trim()) {
      const err = new Error('Category Code is required.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Validate uniqueness of Name and Code
    const nameExists = await repo.checkNameExists(data.category_name.trim());
    if (nameExists) {
      const err = new Error(`Category Name '${data.category_name}' is already in use.`);
      err.statusCode = 400;
      throw err;
    }

    const codeExists = await repo.checkCodeExists(data.category_code.trim().toUpperCase());
    if (codeExists) {
      const err = new Error(`Category Code '${data.category_code}' is already in use.`);
      err.statusCode = 400;
      throw err;
    }

    const formattedData = {
      ...data,
      category_code: data.category_code.trim().toUpperCase(),
      category_name: data.category_name.trim()
    };

    const newCategory = await repo.create(formattedData, user?.id);

    // Audit Logging
    await this.logAudit({
      user_id: user?.id,
      user_name: user?.full_name || user?.name || 'System Admin',
      action: 'CREATE_VISITOR_CATEGORY',
      entity: 'VISITOR_CATEGORY',
      entity_id: newCategory.id,
      details: `Created visitor category '${newCategory.category_name}' (${newCategory.category_code})`
    });

    return newCategory;
  }

  async updateCategory(id, data, user) {
    const existing = await repo.findById(id);
    if (!existing) {
      const err = new Error(`Visitor category with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (data.category_name && data.category_name.trim() !== existing.category_name) {
      const nameExists = await repo.checkNameExists(data.category_name.trim(), id);
      if (nameExists) {
        const err = new Error(`Category Name '${data.category_name}' is already in use.`);
        err.statusCode = 400;
        throw err;
      }
    }

    if (data.category_code && data.category_code.trim().toUpperCase() !== existing.category_code) {
      const codeExists = await repo.checkCodeExists(data.category_code.trim().toUpperCase(), id);
      if (codeExists) {
        const err = new Error(`Category Code '${data.category_code}' is already in use.`);
        err.statusCode = 400;
        throw err;
      }
    }

    const formattedData = {
      ...existing,
      ...data,
      category_code: (data.category_code || existing.category_code).trim().toUpperCase(),
      category_name: (data.category_name || existing.category_name).trim()
    };

    const updated = await repo.update(id, formattedData, user?.id);

    await this.logAudit({
      user_id: user?.id,
      user_name: user?.full_name || user?.name || 'System Admin',
      action: 'UPDATE_VISITOR_CATEGORY',
      entity: 'VISITOR_CATEGORY',
      entity_id: id,
      details: `Updated visitor category '${updated.category_name}' (${updated.category_code})`
    });

    return updated;
  }

  async archiveCategory(id, user) {
    const category = await repo.archive(id, user?.id);
    await this.logAudit({
      user_id: user?.id,
      user_name: user?.full_name || user?.name || 'System Admin',
      action: 'ARCHIVE_VISITOR_CATEGORY',
      entity: 'VISITOR_CATEGORY',
      entity_id: id,
      details: `Archived visitor category '${category.category_name}'`
    });
    return category;
  }

  async restoreCategory(id, user) {
    const category = await repo.restore(id, user?.id);
    await this.logAudit({
      user_id: user?.id,
      user_name: user?.full_name || user?.name || 'System Admin',
      action: 'RESTORE_VISITOR_CATEGORY',
      entity: 'VISITOR_CATEGORY',
      entity_id: id,
      details: `Restored visitor category '${category.category_name}'`
    });
    return category;
  }

  async deleteCategory(id, user) {
    await repo.softDelete(id, user?.id);
    await this.logAudit({
      user_id: user?.id,
      user_name: user?.full_name || user?.name || 'System Admin',
      action: 'DELETE_VISITOR_CATEGORY',
      entity: 'VISITOR_CATEGORY',
      entity_id: id,
      details: `Soft-deleted visitor category ID ${id}`
    });
    return true;
  }

  async logAudit({ user_id, user_name, action, entity, entity_id, details }) {
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity, record_id, metadata_json, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [user_id || 1, action, entity, entity_id, JSON.stringify({ user_name, details })]
      );
    } catch (e) {
      console.warn('Audit log write error:', e.message);
    }
  }
}

module.exports = new VisitorCategoryService();
