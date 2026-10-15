import { required, selectRequired, minLength } from '../../../validation/validators';

export const securityIncidentSchema = {
  incidentType: selectRequired('Incident classification'),
  severity: selectRequired('Severity level'),
  location: required('Incident location'),
  description: (val) => required('Incident report details')(val) || minLength(10, 'Incident report details')(val),
};

export const accessControlCheckpointSchema = {
  checkpointName: required('Checkpoint name'),
  zoneType: selectRequired('Security zone type'),
  requiresEscort: required('Escort policy'),
};
