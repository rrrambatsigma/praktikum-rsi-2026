
import { useMemo, useState } from 'react'
import { ShoppingCart } from 'lucide-react'

import Header from './components/Header'
import MenuCard from './components/MenuCard'
import MenuDetailModal from './components/MenuDetailModal'
import CartPanel, { type CartItem } from './components/CartPanel'
import Footer from './components/Footer'

import { menuItems, type MenuCategory, type MenuItem } from './data/menu'

function App() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] =
    useState<'Semua' | MenuCategory>('Semua')
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const categories: ('Semua' | MenuCategory)[] = [
    'Semua',
    'Makanan',
    'Minuman',
    'Camilan',
  ]

  const filteredMenus = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return menuItems.filter((menu) => {
      const matchesSearch =
        menu.name.toLowerCase().includes(keyword) ||
        menu.description.toLowerCase().includes(keyword) ||
        menu.tenant.toLowerCase().includes(keyword)

      const matchesCategory =
        activeCategory === 'Semua' ||
        menu.category === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [search, activeCategory])

  const totalCartItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  )

  const addToCart = (menu: MenuItem, quantity: number) => {
    if (!menu.available || quantity < 1) return

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.menu.id === menu.id,
      )

      if (existingItem) {
        return currentItems.map((item) =>
          item.menu.id === menu.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }

      return [...currentItems, { menu, quantity }]
    })
  }

  const changeQuantity = (menuId: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((currentItems) =>
        currentItems.filter((item) => item.menu.id !== menuId),
      )
      return
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.menu.id === menuId
          ? { ...item, quantity }
          : item,
      ),
    )
  }

  const removeFromCart = (menuId: number) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.menu.id !== menuId),
    )
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      window.alert('Keranjang masih kosong. Silakan pilih menu terlebih dahulu.')
      return
    }

    const confirmed = window.confirm(
      'Lanjutkan checkout? Keranjang akan dikosongkan setelah dikonfirmasi.',
    )

    if (!confirmed) return

    setCartItems([])
    window.alert(
      'Checkout demo berhasil. Pesanan belum dikirim ke server.',
    )
  }

  return (
    <div
      id="top"
      className="min-h-screen bg-[#fff8f4] text-[#29231f]"
    >
      <Header
        search={search}
        onSearchChange={setSearch}
      />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Judul halaman */}
        <section className="mb-6">
          <p className="text-sm font-semibold text-[#b84208]">
            MAEM BOLO
          </p>

          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Mau makan apa hari ini?
              </h1>

              <p className="mt-2 text-sm text-[#796a61]">
                Temukan makanan dan minuman favoritmu.
              </p>
            </div>

            <a
              href="#keranjang"
              className="inline-flex items-center gap-2 rounded-xl border border-[#f0e3db] bg-white px-4 py-2.5 text-sm font-bold text-[#b84208] transition hover:bg-orange-50"
            >
              <ShoppingCart size={18} />
              Keranjang
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs">
                {totalCartItems}
              </span>
            </a>
          </div>
        </section>

        {/* Katalog di kiri dan keranjang di kanan */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px]">
          <section
            id="menu"
            className="min-w-0 scroll-mt-24"
          >
            {/* Filter kategori */}
            <div className="mb-5 flex flex-wrap gap-2">
              {categories.map((category) => {
                const isActive = activeCategory === category

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    aria-pressed={isActive}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-[#b84208] text-white'
                        : 'border border-[#f0e3db] bg-white text-[#796a61] hover:border-orange-300 hover:text-[#b84208]'
                    }`}
                  >
                    {category}
                  </button>
                )
              })}
            </div>

            {/* Daftar menu */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold sm:text-xl">
                {activeCategory === 'Semua'
                  ? 'Semua Menu'
                  : `Menu ${activeCategory}`}
              </h2>

              <span className="text-sm text-[#796a61]">
                {filteredMenus.length} menu
              </span>
            </div>

            {filteredMenus.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredMenus.map((menu) => (
                  <MenuCard
                    key={menu.id}
                    menu={menu}
                    onSelect={setSelectedMenu}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#f0e3db] bg-white px-5 py-14 text-center">
                <p className="font-bold">
                  Menu tidak ditemukan
                </p>

                <p className="mt-2 text-sm text-[#796a61]">
                  Coba kata kunci lain atau pilih kategori berbeda.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setActiveCategory('Semua')
                  }}
                  className="mt-4 rounded-xl bg-[#b84208] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#963506]"
                >
                  Reset Pencarian
                </button>
              </div>
            )}
          </section>

          {/* Keranjang belanja */}
          <aside
            className="min-w-0 scroll-mt-24 lg:sticky lg:top-5"
          >
            <CartPanel
              items={cartItems}
              onChangeQuantity={changeQuantity}
              onRemove={removeFromCart}
              onCheckout={handleCheckout}
            />
          </aside>
        </div>
      </main>

      <Footer />

      {/* Popup detail menu */}
      {selectedMenu && (
        <MenuDetailModal
          menu={selectedMenu}
          onClose={() => setSelectedMenu(null)}
          onAddToCart={addToCart}
        />
      )}
    </div>
  )
}

export default App
