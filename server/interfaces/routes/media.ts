import { Router } from "express";
import { downloadMedia } from "../controllers/downloadMedia.ts";

const router = Router();

router.get("/media/:key", downloadMedia);

export default router;
