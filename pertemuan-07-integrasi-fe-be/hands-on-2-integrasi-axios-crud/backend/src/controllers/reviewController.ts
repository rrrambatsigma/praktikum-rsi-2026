import type { Request, Response } from 'express';
import { getUser } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { IdParam } from '../schemas/common.ts';
import type { CreateReviewInput, UpdateReviewInput } from '../schemas/reviewSchema.ts';
import { ReviewService } from '../services/reviewService.ts';

export class ReviewController {
  private reviewService: ReviewService;

  constructor(reviewService: ReviewService = new ReviewService()) {
    this.reviewService = reviewService;
  }

  listByStall = async (req: Request, res: Response): Promise<void> => {
    const params = getValidated<IdParam>(res, 'params');
    const data = await this.reviewService.listByStall(params.id, req.user?.id);

    res.status(200).json({ status: 'success', data });
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const data = await this.reviewService.listMine(user);

    res.status(200).json({ status: 'success', data });
  };

  listManaged = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const data = await this.reviewService.listManaged(user);

    res.status(200).json({ status: 'success', data });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const params = getValidated<IdParam>(res, 'params');
    const input = getValidated<CreateReviewInput>(res, 'body');
    const data = await this.reviewService.create(params.id, input, user);

    res.status(201).json({ status: 'success', data });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const params = getValidated<IdParam>(res, 'params');
    const input = getValidated<UpdateReviewInput>(res, 'body');
    const data = await this.reviewService.update(params.id, input, user);

    res.status(200).json({ status: 'success', data });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const params = getValidated<IdParam>(res, 'params');

    await this.reviewService.delete(params.id, user);
    res.status(204).send();
  };
}
