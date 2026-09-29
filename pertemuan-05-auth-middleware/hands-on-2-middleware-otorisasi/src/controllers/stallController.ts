import type { Request, Response } from 'express';
import { StallService } from '../services/stallService.ts';
import { getUser } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import type {
  CreateStallInput,
  IdParam,
  StallQuery,
  UpdateStallInput,
} from '../schemas/stallSchema.ts';
import type { AuthUser } from '../services/tokenService.ts';

/**
 * Handler tanpa try/catch: data sudah divalidasi middleware `validate`
 * (diambil lewat `getValidated`), dan error apa pun yang dilempar akan
 * diteruskan Express ke `errorHandler` (Express 5 menangkap promise-reject
 * dari async handler secara otomatis).
 */
export class StallController {
  private stallService: StallService;

  constructor(stallService: StallService = new StallService()) {
    this.stallService = stallService;
  }

  getStalls = async (_req: Request, res: Response): Promise<void> => {
    const query = getValidated<StallQuery>(res, 'query');
    const { data, total } = await this.stallService.getAllStalls({
      search: query.search,
      category: query.category,
      page: query.page,
      limit: query.limit,
    });
    res.status(200).json({
      status: 'success',
      meta: { page: query.page, limit: query.limit, total },
      data,
    });
  };

  getStallById = async (_req: Request, res: Response): Promise<void> => {
    const { id } = getValidated<IdParam>(res, 'params');
    const stall = await this.stallService.getStallById(id);
    res.status(200).json({ status: 'success', data: stall });
  };

  getStallMenus = async (_req: Request, res: Response): Promise<void> => {
    const { id } = getValidated<IdParam>(res, 'params');
    const menus = await this.stallService.getStallMenus(id);
    res.status(200).json({ status: 'success', data: menus });
  };

  createStall = async (req: Request, res: Response): Promise<void> => {
    const body = getValidated<CreateStallInput>(res, 'body');
    const { id: ownerId } = getUser(req);

    // `ownerId` tidak pernah datang dari body — pemilik selalu user dari token.
    const stall = await this.stallService.createStall(body, ownerId);
    res.status(201).json({ status: 'success', data: stall });
  };

  updateStall = async (req: Request, res: Response): Promise<void> => {
    const { id } = getValidated<IdParam>(res, 'params');
    const body = getValidated<UpdateStallInput>(res, 'body');
    const user = getUser(req);

    // Service juga mengecek warung ini milik user tersebut atau bukan.
    const stall = await this.stallService.updateStall(id, body, user);
    res.status(200).json({ status: 'success', data: stall });
  };

  deleteStall = async (_req: Request, res: Response): Promise<void> => {
    const { id } = getValidated<IdParam>(res, 'params');
    const stall = await this.stallService.deleteStall(id);
    res.status(200).json({ status: 'success', data: stall });
  };
}