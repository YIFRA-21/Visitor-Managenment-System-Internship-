import { required, email, phone, selectRequired } from '../../../validation/validators';

export const walkInRegistrationSchema = {
  fullName: required('Visitor full name'),
  phone: (val) => required('Phone number')(val) || phone('Phone number')(val),
  email: (val) => required('Email address')(val) || email('Email address')(val),
  hostEmployeeId: selectRequired('Host employee'),
  departmentId: selectRequired('Host department'),
  purpose: required('Visit purpose'),
};

export const badgeIssueSchema = {
  badgeNumber: required('Assigned badge number'),
  accessLevel: selectRequired('Access zone tier'),
  validHours: required('Pass validity hours'),
};
