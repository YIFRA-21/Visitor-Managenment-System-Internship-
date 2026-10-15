import { selectRequired } from '../../../validation/validators';

export const dashboardFilterSchema = {
  timeframe: selectRequired('Dashboard timeframe'),
};
