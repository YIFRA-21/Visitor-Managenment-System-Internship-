const orgService = require('../services/org.service');

class OrganizationController {
  async register(req, res, next) {
    try {
      const operatorId = req.user?.id || req.user?.userId || 1;
      const org = await orgService.registerOrganization(req.body, operatorId);
      res.status(201).json({
        success: true,
        message: 'Organization registered successfully.',
        data: org,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const orgs = await orgService.listOrganizations(req.query);
      res.status(200).json(orgs);
    } catch (err) {
      next(err);
    }
  }

  async getPublicBranding(req, res, next) {
    try {
      const orgs = await orgService.listOrganizations({ status: 'ACTIVE' });
      const org = (orgs && orgs.length > 0) ? orgs[0] : ((await orgService.listOrganizations())[0] || null);
      if (!org) {
        return res.status(200).json({
          name: 'Enterprise VMS',
          shortName: 'VMS',
          logoUrl: '/vms-logo.png',
          email: 'support@vms.com',
          phone: '+251 11 123 4567',
          website: '',
          address: 'Addis Ababa, Ethiopia',
        });
      }
      res.status(200).json({
        id: org.id,
        name: org.name,
        shortName: org.short_name || org.shortName || 'VMS',
        code: org.code,
        email: org.email || '',
        phone: org.phone || '',
        website: org.website || '',
        address: org.address || '',
        country: org.country || '',
        region: org.region || '',
        city: org.city || '',
        subCity: org.sub_city || org.subCity || '',
        woreda: org.woreda || '',
        postalCode: org.postal_code || org.postalCode || '',
        logoUrl: org.logo_url || org.logoUrl || '/vms-logo.png',
        faviconUrl: org.favicon_url || org.faviconUrl || '',
        primaryColor: org.primary_color || org.primaryColor || '#2563eb',
        secondaryColor: org.secondary_color || org.secondaryColor || '#1e40af',
      });
    } catch (err) {
      next(err);
    }
  }

  async get(req, res, next) {
    try {
      const org = await orgService.getOrganization(req.params.id);
      res.status(200).json(org);
    } catch (err) {
      next(err);
    }
  }

  async createBranch(req, res, next) {
    try {
      const operatorId = req.user?.id || req.user?.userId || 1;
      const branch = await orgService.createBranch(req.body, operatorId);
      res.status(201).json({
        success: true,
        message: 'Branch created successfully.',
        data: branch,
      });
    } catch (err) {
      next(err);
    }
  }

  async listBranches(req, res, next) {
    try {
      const branches = await orgService.getBranches(req.params.orgId);
      res.status(200).json(branches);
    } catch (err) {
      next(err);
    }
  }

  async createBuilding(req, res, next) {
    try {
      const operatorId = req.user?.id || req.user?.userId || 1;
      const buildingData = {
        ...req.body,
        branchId: req.body?.branchId || req.body?.branch_id || req.params?.branchId,
      };
      const building = await orgService.createBuilding(buildingData, operatorId);
      res.status(201).json({
        success: true,
        message: 'Building created successfully.',
        data: building,
      });
    } catch (err) {
      next(err);
    }
  }

  async listBuildings(req, res, next) {
    try {
      const buildings = await orgService.getBuildings(req.params.branchId);
      res.status(200).json(buildings);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const operatorId = req.user?.id || req.user?.userId || 1;
      const org = await orgService.updateOrganization(req.params.id, req.body, operatorId);
      res.status(200).json({
        success: true,
        message: 'Organization updated successfully.',
        data: org
      });
    } catch (err) {
      next(err);
    }
  }

  async archive(req, res, next) {
    try {
      const operatorId = req.user?.id || req.user?.userId || 1;
      await orgService.archiveOrganization(req.params.id, operatorId);
      res.status(200).json({
        success: true,
        message: 'Organization archived successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  async restore(req, res, next) {
    try {
      const operatorId = req.user?.id || req.user?.userId || 1;
      const org = await orgService.restoreOrganization(req.params.id, operatorId);
      res.status(200).json({
        success: true,
        message: 'Organization restored successfully.',
        data: org
      });
    } catch (err) {
      next(err);
    }
  }

  async activate(req, res, next) {
    try {
      const operatorId = req.user?.id || req.user?.userId || 1;
      await orgService.activateOrganization(req.params.id, operatorId);
      res.status(200).json({
        success: true,
        message: 'Organization activated successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  async deactivate(req, res, next) {
    try {
      const operatorId = req.user?.id || req.user?.userId || 1;
      await orgService.deactivateOrganization(req.params.id, operatorId);
      res.status(200).json({
        success: true,
        message: 'Organization deactivated successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  async updateBranch(req, res, next) {
    try {
      const operatorId = req.user?.id || req.user?.userId || 1;
      const branch = await orgService.updateBranch(req.params.id, req.body, operatorId);
      res.status(200).json({
        success: true,
        message: 'Branch updated successfully.',
        data: branch
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteBranch(req, res, next) {
    try {
      const operatorId = req.user?.id || req.user?.userId || 1;
      await orgService.deleteBranch(req.params.id, operatorId);
      res.status(200).json({
        success: true,
        message: 'Branch deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrganizationController();
