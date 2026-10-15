import { required, code, selectRequired, } from '../../../validation/validators';
export const roleSchema = {
    roleName: required('Role name'),
    roleCode: (val) => required('Role code')(val) || code('Role code')(val),
    description: required('Role description'),
};
export const permissionSchema = {
    permissionName: required('Permission name'),
    permissionCode: (val) => required('Permission code')(val) || code('Permission code')(val),
    module: selectRequired('Module'),
    resource: required('Resource name'),
    action: selectRequired('Action'),
};
