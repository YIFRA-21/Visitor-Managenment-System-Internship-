import { required, selectRequired } from '../../../validation/validators';

export const meetingRoomSchema = {
  roomName: required('Room name'),
  roomNumber: required('Room number'),
  capacity: required('Seating capacity'),
  buildingId: selectRequired('Building'),
  floorId: selectRequired('Floor'),
};

export const buildingSchema = {
  buildingName: required('Building name'),
  branchId: selectRequired('Branch'),
};
