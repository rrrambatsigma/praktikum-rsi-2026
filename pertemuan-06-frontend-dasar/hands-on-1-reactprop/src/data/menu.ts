
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
    rating: 4.7,
    available: false,
  },
  {
    id: 5,
    name: 'Kwetiaw',
    category: 'Makanan',
    price: 14000,
    image: '/images/kwetiaw.png',
    description:
      'Kwetiaw goreng dengan telur, sayuran segar, dan bumbu gurih.',
    tenant: 'Kwetiaw Pak Darto',
    stand: 'Stand 05',
    rating: 4.8,
    available: true,
  },
  {
    id: 6,
    name: 'Ayam Katsu',
    category: 'Makanan',
    price: 18000,
    image: '/images/ayam-katsu.png',
    description:
      'Ayam katsu renyah dengan nasi hangat dan saus gurih.',
    tenant: 'Katsu Corner',
    stand: 'Stand 06',
    rating: 4.9,
    available: true,
  },
  {
    id: 7,
    name: 'Es Jeruk',
    category: 'Minuman',
    price: 6000,
    image: '/images/es-jeruk.png',
    description:
      'Minuman jeruk segar yang disajikan dingin dengan es batu.',
    tenant: 'Depot Barokah',
    stand: 'Stand 01',
    rating: 4.8,
    available: true,
  },
  {
    id: 8,
    name: 'Es Kopi',
    category: 'Minuman',
    price: 10000,
    image: '/images/es-kopi.png',
    description:
      'Kopi dingin dengan perpaduan rasa kopi dan susu yang nikmat.',
    tenant: 'Kopi Sudut Kampus',
    stand: 'Stand 09',
    rating: 4.9,
    available: true,
  },
  {
    id: 9,
    name: 'Roti Aoka',
    category: 'Camilan',
    price: 3000,
    image: '/images/roti-aoka.png',
    description:
      'Roti manis lembut dalam kemasan praktis untuk camilan mahasiswa.',
    tenant: 'Roti Panggang GKB',
    stand: 'Stand 12',
    rating: 4.6,
    available: true,
  },
]
