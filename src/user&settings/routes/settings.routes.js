import { Router } from 'express';
import { updateUsername, changePassword } from '../controllers/settings.controller.js';
import { authRequired } from '../middlewares/validateToken.js';
import {validateSchema} from '../middlewares/validator.middleware.js'
import {updateUsernameSchema, changePasswordSchema} from '../schemas/settings.schema.js';

const router = Router();

router.put('/username', authRequired, validateSchema(updateUsernameSchema), updateUsername);  
router.put('/password', authRequired, validateSchema(changePasswordSchema), changePassword);

export default router;