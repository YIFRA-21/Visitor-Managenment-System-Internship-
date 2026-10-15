import { required, selectRequired, minLength } from '../../../validation/validators';

export const watchlistEntrySchema = {
  visitorName: required('Subject name'),
  idNumber: required('National ID or Passport number'),
  severity: selectRequired('Security risk severity'),
  reason: (val) => required('Restriction reason')(val) || minLength(10, 'Restriction reason')(val),
  matchType: selectRequired('Detection match type'),
};
