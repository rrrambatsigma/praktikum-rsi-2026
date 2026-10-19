
export type MenuCategory = 'Makanan' | 'Minuman' | 'Camilan'

export interface MenuItem {
  id: number
  name: string
  category: MenuCategory
  price: number
  image: string
  description: string
  tenant: string
  stand: string
  rating?: number
  available: boolean
}

export const menuItems: MenuItem[] = [
  {
    id: 1,
    name: 'Nasi Goreng',
    category: 'Makanan',
    price: 15000,
    image: '/images/nasigoreng.png',
    description:
      'Nasi goreng berbumbu gurih dengan telur, sayuran segar, dan taburan bawang renyah.',
    tenant: 'Kantin Bu Sri',
    stand: 'Stand 03',
    rating: 4.9,
    available: true,
  },
  {
    id: 2,
    name: 'Mie Ayam',
    category: 'Makanan',
    price: 12000,
    image: '/images/mieayam.png',
    description:
      'Mie kenyal dengan potongan ayam berbumbu, sayuran, dan kuah hangat yang nikmat.',
    tenant: 'Mie Mas Dono',
    stand: 'Stand 08',
    rating: 4.8,
    available: true,
  },
  {
    id: 3,
    name: 'Es Teh',
    category: 'Minuman',
    price: 5000,
    image: '/images/esteh.png',
    description:
      'Teh melati dengan rasa manis menyegarkan, disajikan dingin dengan es batu.',
    tenant: 'Depot Barokah',
    stand: 'Stand 01',
    rating: 5.0,
    available: true,
  },
  {
    id: 4,
    name: 'Roti Bakar',
    category: 'Camilan',
    price: 8000,
    image: '/images/rotibakar.png',
    description:
      'Roti panggang dengan olesan mentega, cokelat, dan keju yang lezat.',
    tenant: 'Roti Panggang GKB',
    stand: 'Stand 12',
    available: false,
  },
]
