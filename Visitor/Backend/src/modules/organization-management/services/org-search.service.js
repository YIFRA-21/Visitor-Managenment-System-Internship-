const orgRepository = require('../repositories/org.repository');

class OrganizationSearchService {
  /**
   * Search organizations with multi-field filtering, pagination, and sorting.
   * @param {Object} filters - Search criteria
   * @param {string} [filters.name] - Organization name (partial match)
   * @param {string} [filters.code] - Organization code (partial match)
   * @param {string} [filters.registrationNumber] - Registration number (partial match)
   * @param {string} [filters.status] - Status filter (ACTIVE, INACTIVE, SUSPENDED, ARCHIVED)
   * @param {string} [filters.type] - Organization type filter
   * @param {string} [filters.dateFrom] - Created date from (ISO string)
   * @param {string} [filters.dateTo] - Created date to (ISO string)
   * @param {number} [page=1] - Page number
   * @param {number} [limit=10] - Page size
   * @param {string} [sortBy='name'] - Sort column
   * @param {string} [sortOrder='ASC'] - Sort direction
   */
  async searchOrganizations({ name, code, registrationNumber, status, type, dateFrom, dateTo }, page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC') {
    // Sanitize sort params
    const allowedSortFields = ['name', 'code', 'status', 'created_at', 'registration_number', 'email'];
    const sanitizedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const sanitizedSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const filters = {};
    if (name && name.trim()) filters.name = name.trim();
    if (code && code.trim()) filters.code = code.trim();
    if (registrationNumber && registrationNumber.trim()) filters.registrationNumber = registrationNumber.trim();
    if (status && status.trim()) filters.status = status.trim();
    if (type && type.trim()) filters.type = type.trim();
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    const pagination = {
      page: Math.max(1, parseInt(page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit) || 10)),
    };

    const sort = {
      sortBy: sanitizedSortBy,
      sortOrder: sanitizedSortOrder,
    };

    const [results, totalCount] = await Promise.all([
      orgRepository.searchOrgs(filters, pagination, sort),
      orgRepository.countOrgs(filters),
    ]);

    return {
      data: results,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / pagination.limit),
      },
    };
  }

  /**
   * Check if an organization code is already in use.
   * @param {string} code - Code to check
   * @param {number} [excludeId] - Organization ID to exclude (for edits)
   * @returns {boolean} true if code is already taken
   */
  async isCodeTaken(code, excludeId = null) {
    const existing = await orgRepository.findOrgByCode(code);
    if (!existing) return false;
    if (excludeId && existing.id === parseInt(excludeId)) return false;
    return true;
  }
}

module.exports = new OrganizationSearchService();
