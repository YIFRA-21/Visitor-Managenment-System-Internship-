import { required, email, phone, dateOfBirth, futureDate, selectRequired, fileRequired, minLength, } from '../../../validation/validators';
export const visitorRegistrationSchema = {
    firstName: (val) => required('First name')(val) || minLength(2, 'First name')(val),
    lastName: (val) => required('Last name')(val) || minLength(2, 'Last name')(val),
    gender: selectRequired('Gender'),
    dateOfBirth: dateOfBirth('Date of birth'),
    email: (val) => required('Email address')(val) || email('Email address')(val),
    phone: (val) => required('Phone number')(val) || phone('Phone number')(val),
    country: required('Country'),
    address: required('Address'),
    visitorCategory: selectRequired('Visitor category'),
    photoUrl: fileRequired('Profile photo'),
};
export const visitorAppointmentSchema = {
    hostEmployeeId: selectRequired('Host employee'),
    departmentId: selectRequired('Department'),
    appointmentDate: (val) => required('Appointment date')(val) || futureDate('Appointment date')(val),
    appointmentTime: required('Appointment time'),
    purpose: required('Visit purpose'),
    roomId: selectRequired('Meeting room'),
};
export const visitorCheckInSchema = {
    visitorCode: required('Visitor pass / reference number'),
    identityNumber: required('Identity document number'),
    idType: selectRequired('ID document type'),
};
export const visitorFeedbackSchema = {
    rating: selectRequired('Star rating'),
    comments: required('Feedback comments'),
};
export const visitorSupportSchema = {
    subject: required('Ticket subject'),
    category: selectRequired('Support category'),
    description: (val) => required('Description')(val) || minLength(10, 'Description')(val),
};
