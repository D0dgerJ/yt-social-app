import express, { Router } from 'express';
import downloadFile from '../controllers/downloadController.ts';

const router: Router = express.Router();

router.get('/uploads/:filename', downloadFile);

export default router;
