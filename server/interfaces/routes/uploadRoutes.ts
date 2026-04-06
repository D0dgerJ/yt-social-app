import express from 'express';
import { upload } from '../../application/use-cases/upload/uploadFile.js';
import { handleUpload } from '../controllers/uploadController.js';

const router = express.Router();

router.post(
  '/',
  upload.fields([
    { name: 'files', maxCount: 10 },
    { name: 'file',  maxCount: 1  },
  ]),
  handleUpload
);

export default router;
