import { required, selectRequired } from '../../../validation/validators';

export const checkInSchema = {
  visitorPassNumber: required('Visitor pass or reference code'),
  badgeId: required('Assigned physical badge number'),
  temperature: required('Body temperature verification'),
  belongingsCount: required('Belongings count'),
};

export const checkOutSchema = {
  badgeId: required('Returned badge number'),
  remarks: selectRequired('Checkout status verification'),
};
