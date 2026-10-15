import { required } from '../../../validation/validators';

export const auditFilterSchema = {
  dateRange: required('Audit timeframe range'),
};
