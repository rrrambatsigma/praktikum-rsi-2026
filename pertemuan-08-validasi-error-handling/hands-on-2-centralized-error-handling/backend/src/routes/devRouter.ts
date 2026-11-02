import { Router } from 'express';
import { DevController } from '../controllers/devController.ts';

const devRouter = Router();
const devController = new DevController();

devRouter.post('/force-error', devController.forceError);
devRouter.get('/slow', devController.slow);

export { devRouter };
