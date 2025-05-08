import { Router } from 'express';
import { runScraping } from '../controllers/partidos.scraping.controllers.js';

const router = Router();

router.post('/run', runScraping);

export default router;