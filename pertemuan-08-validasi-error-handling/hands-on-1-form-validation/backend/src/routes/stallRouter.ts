import { Router } from 'express';
import { StallController } from '../controllers/stallController.ts';

const stallRouter = Router();
const stallController = new StallController();

stallRouter.get('/', stallController.getStalls);

export { stallRouter };
