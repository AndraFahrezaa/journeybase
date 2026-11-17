
import { useState } from 'react'
import { LockKeyhole, ArrowRight } from 'lucide-react'
import { adminLogin } from '../lib/adminAuth'

type AdminLoginProps = {
  onLogin: (token: string) => void
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await adminLogin(code)
      sessionStorage.setItem('journeybase_admin_token', result.token)
      onLogin(result.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-[#e9e5da] bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#244C3A] text-white">
          <LockKeyhole size={25} />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A9B85]">
          JOURNEYBASE
        </p>

        <h1 className="mt-3 font-heading text-2xl font-bold text-[#244C3A]">
          Admin Login
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Masukkan kode admin untuk mengelola destinasi.
        </p>

        <label className="mt-7 mb-2 block text-sm font-semibold">
          Kode Admin
        </label>

        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Masukkan kode admin"
          required
          className="w-full rounded-xl border border-[#e9e5da] px-4 py-3 outline-none focus:border-[#244C3A]"
        />

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#244C3A] px-5 py-3 font-semibold text-white hover:bg-[#193729] disabled:opacity-60"
        >
          {loading ? 'Memproses...' : 'Masuk sebagai Admin'}
          {!loading && <ArrowRight size={18} />}
        </button>
      </form>
    </div>
  )
}
