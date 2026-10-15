import { required, email, phone, dateOfBirth, selectRequired, minLength, } from '../../../validation/validators';
export const employeeRegistrationSchema = {
    firstName: (val) => required('First name')(val) || minLength(2, 'First name')(val),
    lastName: (val) => required('Last name')(val) || minLength(2, 'Last name')(val),
    gender: selectRequired('Gender'),
    dateOfBirth: dateOfBirth('Date of birth'),
    email: (val) => required('Email address')(val) || email('Email address')(val),
    phone: (val) => required('Phone number')(val) || phone('Phone number')(val),
    jobTitle: required('Job title / Position'),
    organizationId: selectRequired('Organization'),
    branchId: selectRequired('Branch'),
    departmentId: selectRequired('Department'),
};
