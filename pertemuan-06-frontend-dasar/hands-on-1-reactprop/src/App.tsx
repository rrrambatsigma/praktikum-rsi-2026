import { useState } from 'react'

import Header from './components/Header'
import Footer from './components/Footer'

function App() {
  const [search, setSearch] = useState('')

  // TODO: tambahkan state kategori aktif, menu terpilih, dan isi keranjang.
  // TODO: saring daftar menu berdasarkan pencarian dan kategori.

  return (
    <div id="top" className="min-h-screen bg-page text-text">
      <Header search={search} onSearchChange={setSearch} />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm text-muted">
          TODO: tampilkan daftar menu dan keranjang di sini.
        </p>
      </main>

      <Footer />
    </div>
  )
}

export default App
