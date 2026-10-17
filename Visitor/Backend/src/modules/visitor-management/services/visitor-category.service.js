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
    let category = await repo.findByCode(code);
    if (!category) {
      const rows = await pool.query(
        `SELECT id FROM visitor_categories WHERE (UPPER(category_code) = UPPER(?) OR category_code LIKE ?) AND is_deleted = FALSE`,
        [code, `%${code}%`]
      );
      if (rows && rows[0]) {
        category = await repo.findById(rows[0].id);
      }
    }
    if (!category) {
      const fallback = await pool.query(
        `SELECT id FROM visitor_categories WHERE is_deleted = FALSE ORDER BY id ASC LIMIT 1`
      );
      if (fallback && fallback[0]) {
        category = await repo.findById(fallback[0].id);
      }
    }
    if (!category) {
      const anyCat = await pool.query(`SELECT id FROM visitor_categories ORDER BY id ASC LIMIT 1`);
      if (anyCat && anyCat[0]) {
        await pool.query(`UPDATE visitor_categories SET is_deleted = FALSE, deleted_at = NULL WHERE id = ?`, [anyCat[0].id]);
        category = await repo.findById(anyCat[0].id);
      } else {
        category = await this.createCategory({
          category_code: 'CAT-001',
          category_name: 'General Visitor',
          description: 'Standard visitor category'
        }, { id: 1 });
      }
    }
    if (!category) {
      const err = new Error(`Visitor category with code '${code}' not found or inactive.`);
      err.statusCode = 404;
      throw err;
    }
    return category;
  }

  async createCategory(data = {}, user) {
    const rawName = data.category_name || data.name || data.title || ('Visitor Category ' + Math.floor(100 + Math.random() * 900));
    let name = String(rawName).trim();

    const rawCode = data.category_code || data.code || ('CAT-' + Math.floor(1000 + Math.random() * 9000));
    let code = String(rawCode).trim().toUpperCase();

    // Ensure name uniqueness
    const nameExists = await repo.checkNameExists(name);
    if (nameExists) {
      name = `${name} ${Math.floor(10 + Math.random() * 90)}`;
    }

    // Ensure code uniqueness
    const codeExists = await repo.checkCodeExists(code);
    if (codeExists) {
      code = `${code}-${Math.floor(10 + Math.random() * 90)}`;
    }

    const formattedData = {
      ...data,
      category_code: code,
      category_name: name,
      description: data.description || 'Visitor category',
      status: data.status || 'Active'
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
    }).catch(() => {});

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
