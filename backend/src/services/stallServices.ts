import { StallRepository } from '../repositories/stallRepository';
import type { StallResponseDto } from '../dtos/stallDto';

export class StallService {
  constructor(private stallRepository: StallRepository = new StallRepository()) {}

  async getAllStalls(): Promise<StallResponseDto[]> {
    const stalls = await this.stallRepository.findAll();

    // Logika Bisnis: Menambahkan penanda 'isPopular' jika rating >= 4.7
    return stalls.map(stall => ({
      ...stall,
      isPopular: stall.rating >= 4.7
    }));
  }

  async getStallById(id: number): Promise<StallResponseDto> {
    const stall = await this.stallRepository.findById(id);

    // Logika Bisnis: Jika data warung tidak ditemukan, lempar error khusus
    if (!stall) {
      throw new Error("STALL_NOT_FOUND");
    }

    return {
      ...stall,
      isPopular: stall.rating >= 4.7
    };
  }
}