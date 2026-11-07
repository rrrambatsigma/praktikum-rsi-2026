import { Router } from 'express';
import { DevController } from '../controllers/devController.ts';

const devRouter = Router();
const devController = new DevController();

devRouter.post('/force-error', devController.forceError);

export { devRouter };
