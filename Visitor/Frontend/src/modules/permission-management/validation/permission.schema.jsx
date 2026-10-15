import { required, code, selectRequired } from '../../../validation/validators';

export const permissionSchema = {
  permissionCode: (val) => required('Permission code')(val) || code('Permission code')(val),
  permissionName: required('Permission name'),
  module: selectRequired('Target system module'),
};
