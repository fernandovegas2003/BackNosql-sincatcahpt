import { Router } from 'express';
import { googleLogin } from '../controllers/auth.controller.js';

const router = Router();

// Endpoint para login con Google desde el frontend (token JWT de Google)
router.post('/google-login', googleLogin);

export default router;