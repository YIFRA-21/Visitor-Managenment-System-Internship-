import { required, selectRequired, futureDate, minLength } from '../../../validation/validators';

export const bookAppointmentSchema = {
  hostEmployeeId: selectRequired('Host employee'),
  departmentId: selectRequired('Department'),
  appointmentDate: (val) => required('Appointment date')(val) || futureDate('Appointment date')(val),
  appointmentTime: required('Appointment time'),
  purpose: (val) => required('Visit purpose')(val) || minLength(3, 'Visit purpose')(val),
  meetingRoomId: selectRequired('Meeting room'),
};

export const rescheduleAppointmentSchema = {
  appointmentDate: (val) => required('New date')(val) || futureDate('New date')(val),
  appointmentTime: required('New time'),
  reason: required('Reschedule reason'),
};

export const cancelAppointmentSchema = {
  cancellationReason: (val) => required('Cancellation reason')(val) || minLength(5, 'Cancellation reason')(val),
};
