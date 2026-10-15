import { required, email, phone, code, selectRequired, } from '../../../validation/validators';
export const organizationSchema = {
    name: required('Organization name'),
    code: (val) => required('Organization code')(val) || code('Organization code')(val),
    email: (val) => required('Email address')(val) || email('Email address')(val),
    phone: (val) => required('Phone number')(val) || phone('Phone number')(val),
    country: required('Country'),
    address: required('Address'),
};
export const branchSchema = {
    organizationId: selectRequired('Organization'),
    branchName: required('Branch name'),
    branchCode: (val) => required('Branch code')(val) || code('Branch code')(val),
    city: required('City'),
    address: required('Address'),
};
export const departmentSchema = {
    organizationId: selectRequired('Organization'),
    branchId: selectRequired('Branch'),
    departmentName: required('Department name'),
    departmentCode: (val) => required('Department code')(val) || code('Department code')(val),
};
export const buildingSchema = {
    buildingName: required('Building name'),
    buildingCode: (val) => required('Building code')(val) || code('Building code')(val),
    branchId: selectRequired('Branch'),
};
export const roomSchema = {
    roomName: required('Room name'),
    capacity: required('Room capacity'),
    location: required('Floor / Location'),
};
