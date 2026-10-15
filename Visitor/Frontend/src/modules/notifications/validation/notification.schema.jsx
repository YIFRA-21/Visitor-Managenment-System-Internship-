import { required, selectRequired, minLength } from '../../../validation/validators';

export const notificationComposeSchema = {
  title: (val) => required('Notification title')(val) || minLength(3, 'Notification title')(val),
  recipientType: selectRequired('Target recipient group'),
  channels: required('At least one delivery channel (Email/SMS/Push)'),
  body: (val) => required('Message content')(val) || minLength(5, 'Message content')(val),
  priority: selectRequired('Priority level'),
};

export const notificationTemplateSchema = {
  templateCode: required('Template identifier code'),
  subject: required('Email subject template'),
  bodyTemplate: required('Template message body'),
};
