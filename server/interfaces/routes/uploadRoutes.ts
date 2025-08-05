import express from 'express';
import { upload } from '../../application/use-cases/upload/uploadFile.ts';
import { handleFileUpload } from '../controllers/uploadController.ts';

const router = express.Router();

router.post('/', upload.single('file'), handleFileUpload);

export default router;
