import { required, email, phone, selectRequired, passwordStrength, } from '../../../validation/validators';
export const userCreateStep1Schema = {
    firstName: required('First name'),
    lastName: required('Last name'),
};
export const userCreateStep2Schema = {
    email: (val) => required('Email address')(val) || email('Email address')(val),
    phone: (val) => required('Phone number')(val) || phone('Phone number')(val),
};
export const userCreateStep3Schema = {
    organization: selectRequired('Organization'),
    branch: selectRequired('Branch'),
    role: selectRequired('System role / User type'),
};
export const userCreateStep4Schema = {
    password: (val, allVals) => allVals?.credentialMode === 'manual' ? required('Manual initial password')(val) || passwordStrength('Initial password')(val) : null,
};
export const userCreateSchema = {
    ...userCreateStep1Schema,
    ...userCreateStep2Schema,
    ...userCreateStep3Schema,
    ...userCreateStep4Schema,
};
