import { required } from '../../../validation/validators';

export const historyFilterSchema = {
  startDate: required('Filter start date'),
  endDate: required('Filter end date'),
};
