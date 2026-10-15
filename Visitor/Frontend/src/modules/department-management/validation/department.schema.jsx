import { required, code, minLength } from '../../../validation/validators';

export const departmentSchema = {
  departmentName: (val) => required('Department name')(val) || minLength(2, 'Department name')(val),
  departmentCode: (val) => required('Department code')(val) || code('Department code')(val),
  floorNumber: required('Floor location'),
  headOfDepartment: required('Department head'),
};
