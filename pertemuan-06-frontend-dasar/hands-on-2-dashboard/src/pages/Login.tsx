import { useState, type FormEvent } from 'react'
import { LockKeyhole, Store, UserRound } from 'lucide-react'

interface LoginProps {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('pemilik')
  const [password, setPassword] = useState('maembolo')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (username.trim() === 'pemilik' && password === 'maembolo') {
      setError('')
      onLogin()
      return
    }

    setError('Username atau password salah. Coba gunakan akun demo di bawah.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff8f4] px-4 py-10 font-[var(--font-body)] text-[#29231f]">
      <section className="w-full max-w-md rounded-2xl border border-[#f0e3db] bg-white p-6 shadow-[0_2px_8px_rgb(74_37_18_/_5%)] sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b84208] text-white">
            <Store size={27} strokeWidth={1.8} aria-hidden="true" />
          </span>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#b84208]">
            Maem Bolo
          </p>

          <h1 className="mt-2 font-[var(--font-heading)] text-2xl font-bold tracking-[-0.025em] text-[#29231f]">
            Login Pemilik Kantin
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#796a61]">
            Masuk untuk memantau antrean dan mengelola pesanan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-semibold text-[#29231f]"
            >
              Username
            </label>

            <div className="flex min-h-12 items-center gap-3 rounded-xl border border-[#f0e3db] bg-white px-3 transition-colors focus-within:border-[#b84208] focus-within:ring-2 focus-within:ring-[#b84208]/10">
              <UserRound
                size={18}
                className="shrink-0 text-[#796a61]"
                aria-hidden="true"
              />

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  setError('')
                }}
                autoComplete="username"
                required
                className="min-h-11 w-full min-w-0 bg-transparent py-2 text-sm text-[#29231f] outline-none"
                placeholder="Masukkan username"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-[#29231f]"
            >
              Password
            </label>

            <div className="flex min-h-12 items-center gap-3 rounded-xl border border-[#f0e3db] bg-white px-3 transition-colors focus-within:border-[#b84208] focus-within:ring-2 focus-within:ring-[#b84208]/10">
              <LockKeyhole
                size={18}
                className="shrink-0 text-[#796a61]"
                aria-hidden="true"
              />

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError('')
                }}
                autoComplete="current-password"
                required
                className="min-h-11 w-full min-w-0 bg-transparent py-2 text-sm text-[#29231f] outline-none"
                placeholder="Masukkan password"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-[#f0caca] bg-[#fff0f0] px-3 py-2.5 text-sm leading-5 text-[#b93838]"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#b84208] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#963506] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b84208] focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            Masuk ke Dashboard
          </button>
        </form>

        <div className="mt-5 rounded-xl border border-[#f0e3db] bg-[#fff8f4] p-4 text-sm text-[#796a61]">
          <p className="font-semibold text-[#29231f]">Akun demo</p>

          <p className="mt-2">
            Username:{' '}
            <code className="rounded bg-white px-1.5 py-0.5 font-semibold text-[#b84208]">
              pemilik
            </code>
          </p>

          <p className="mt-1">
            Password:{' '}
            <code className="rounded bg-white px-1.5 py-0.5 font-semibold text-[#b84208]">
              maembolo
            </code>
          </p>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-[#796a61]">
          Demo frontend untuk praktikum. Login ini belum menggunakan backend.
        </p>
      </section>
    </main>
  )
}