import { required, email, phone, username, passwordStrength, confirmPassword, checkboxRequired, } from '../../../validation/validators';
export const loginSchema = {
    email: (val) => required('Email address or username')(val) || (val.includes('@') ? email('Email address')(val) : null),
    password: required('Password'),
};
export const signUpSchema = {
    firstName: required('First name'),
    lastName: required('Last name'),
    email: (val) => required('Email address')(val) || email('Email address')(val),
    phone: (val) => required('Phone number')(val) || phone('Phone number')(val),
    username: (val) => required('Username')(val) || username('Username')(val),
    password: (val) => required('Password')(val) || passwordStrength('Password')(val),
    confirmPassword: (val, allVals) => required('Confirm password')(val) || confirmPassword('password', 'Confirm password')(val, allVals),
    acceptTerms: checkboxRequired('terms & conditions'),
};
export const forgotPasswordSchema = {
    email: (val) => required('Email address')(val) || email('Email address')(val),
};
export const resetPasswordSchema = {
    password: (val) => required('New password')(val) || passwordStrength('New password')(val),
    confirmPassword: (val, allVals) => required('Confirm password')(val) || confirmPassword('password', 'Confirm password')(val, allVals),
};
export const changePasswordSchema = {
    currentPassword: required('Current password'),
    newPassword: (val) => required('New password')(val) || passwordStrength('New password')(val),
    confirmNewPassword: (val, allVals) => required('Confirm new password')(val) || confirmPassword('newPassword', 'Confirm new password')(val, allVals),
};
export const otpVerificationSchema = {
    otpCode: required('OTP verification code'),
};
