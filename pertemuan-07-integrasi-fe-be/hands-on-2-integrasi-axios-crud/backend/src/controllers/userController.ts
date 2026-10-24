import type { Request, Response } from 'express';
import { getUser } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { IdParam } from '../schemas/common.ts';
import type { CreateOwnerInput, UpdateRoleInput, UserQuery } from '../schemas/userSchema.ts';
import { UserService } from '../services/userService.ts';

export class UserController {
  private userService: UserService;

  constructor(userService: UserService = new UserService()) {
    this.userService = userService;
  }

  list = async (_req: Request, res: Response): Promise<void> => {
    const query = getValidated<UserQuery>(res, 'query');
    const data = await this.userService.list(query);

    res.status(200).json({ status: 'success', data });
  };

  createOwner = async (_req: Request, res: Response): Promise<void> => {
    const actor = getUser(_req);
    const input = getValidated<CreateOwnerInput>(res, 'body');
    const data = await this.userService.createOwner(input, actor.id);

    res.status(201).json({ status: 'success', data });
  };

  updateRole = async (_req: Request, res: Response): Promise<void> => {
    const actor = getUser(_req);
    const params = getValidated<IdParam>(res, 'params');
    const input = getValidated<UpdateRoleInput>(res, 'body');
    const data = await this.userService.updateRole(params.id, input.role, actor.id);

    res.status(200).json({ status: 'success', data });
  };
}
