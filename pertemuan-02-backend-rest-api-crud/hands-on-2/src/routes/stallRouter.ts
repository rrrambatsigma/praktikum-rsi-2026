import { Router } from 'express';
import { StallController } from '../controllers/stallController.ts';

const stallRouter = Router();
const stallController = new StallController();

// Memetakan endpoint ke metode controller
stallRouter.get('/', stallController.getStalls);
stallRouter.get('/:id', stallController.getStallById);

export { stallRouter };
