import { required, selectRequired, fileRequired } from '../../../validation/validators';

export const documentUploadSchema = {
  documentType: selectRequired('Document category type'),
  documentFile: fileRequired('Uploaded document scan or PDF'),
};

export const documentVerificationSchema = {
  verificationStatus: selectRequired('Verification outcome'),
  comments: required('Verification comments and findings'),
};
