import { required, selectRequired } from '../../../validation/validators';

export const calendarSlotSchema = {
  slotDay: selectRequired('Day of the week'),
  startTime: required('Start time'),
  endTime: required('End time'),
  capacityPerSlot: required('Maximum visitors per slot'),
};

export const holidaySchema = {
  holidayName: required('Holiday title'),
  holidayDate: required('Holiday calendar date'),
};
