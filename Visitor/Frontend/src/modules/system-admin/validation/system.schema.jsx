import { required, email, selectRequired } from '../../../validation/validators';

export const systemConfigSchema = {
  systemName: required('System organization name'),
  supportEmail: (val) => required('Support contact email')(val) || email('Support contact email')(val),
  sessionTimeoutMinutes: required('Session inactivity timeout (minutes)'),
  timezone: selectRequired('System timezone'),
};

export const feedbackTicketSchema = {
  subject: required('Inquiry subject'),
  category: selectRequired('Feedback category'),
  message: required('Detailed message'),
};
