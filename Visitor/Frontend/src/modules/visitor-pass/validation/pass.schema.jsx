import { required, selectRequired } from '../../../validation/validators';

export const passIssuanceSchema = {
  visitorId: required('Visitor identification'),
  passType: selectRequired('Pass template type'),
  badgeNumber: required('Badge ID'),
  validUntil: required('Pass expiration time'),
  accessZone: selectRequired('Access zone'),
};
