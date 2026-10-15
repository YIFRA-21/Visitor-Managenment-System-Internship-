class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id) {
    if (!this.model) return null;
    return await this.model.findByPk(id);
  }

  async findAll(options = {}) {
    if (!this.model) return [];
    return await this.model.findAll(options);
  }

  async create(data) {
    if (!this.model) return { id: Date.now(), ...data };
    return await this.model.create(data);
  }

  async update(id, data) {
    if (!this.model) return { id, ...data };
    const record = await this.findById(id);
    if (!record) return null;
    return await record.update(data);
  }

  async delete(id) {
    if (!this.model) return true;
    const record = await this.findById(id);
    if (!record) return false;
    await record.destroy();
    return true;
  }

  async findWithPagination(page = 1, limit = 10, where = {}, order = [['created_at', 'DESC']]) {
    if (!this.model) return { rows: [], count: 0, page, limit };
    const offset = (page - 1) * limit;
    const { rows, count } = await this.model.findAndCountAll({
      where,
      limit,
      offset,
      order
    });
    return { rows, count, page, totalPages: Math.ceil(count / limit) };
  }
}

module.exports = BaseRepository;
