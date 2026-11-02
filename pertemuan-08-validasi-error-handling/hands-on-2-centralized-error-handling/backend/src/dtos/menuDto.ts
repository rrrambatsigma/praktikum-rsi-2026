export type MenuCategory = 'makanan' | 'minuman' | 'camilan';

export interface MenuDto {
  id: number;
  stallId: number;
  stallName: string;
  name: string;
  category: MenuCategory | null;
  price: number;
  description: string | null;
  isAvailable: boolean;
}
