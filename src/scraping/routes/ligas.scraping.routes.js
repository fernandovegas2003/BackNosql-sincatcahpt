import { Router } from 'express';
import { runScrapingLigas } from '../controllers/ligas.scraping.controllers.js';

const router = Router();

router.post('/run-ligas', runScrapingLigas);

export default router;