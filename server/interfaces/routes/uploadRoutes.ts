import express from 'express';
import { upload } from '../../application/use-cases/upload/uploadFile';
import { handleFileUpload } from '../controllers/uploadController';

const router = express.Router();

router.post('/upload', upload.single('file'), handleFileUpload);

export default router;
