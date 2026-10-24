import type { StallDto } from '../dtos/stallDto.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { StallRepository } from '../repositories/stallRepository.ts';

export class StallService {
  private stallRepository: StallRepository;

  constructor(stallRepository: StallRepository = new StallRepository()) {
    this.stallRepository = stallRepository;
  }

  async getAllStalls(): Promise<StallDto[]> {
    return this.stallRepository.findAll();
  }

  async getStallById(id: number): Promise<StallDto> {
    const stall = await this.stallRepository.findById(id);

    if (!stall) {
      throw new NotFoundError('Warung tidak ditemukan');
    }

    return stall;
  }
}
