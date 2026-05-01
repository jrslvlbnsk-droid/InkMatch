'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (error) {
      toast.error('Špatný email nebo heslo')
      setLoading(false)
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    setLoading(false)
    router.push(profile?.role === 'artist' ? '/artist' : '/client')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          style={{ fontFamily: 'Georgia,serif' }}
          className="text-2xl font-semibold block text-center mb-10"
        >
          Ink<span className="text-gold">Match</span>
        </Link>
        <div className="card p-8">
          <h1
            style={{ fontFamily: 'Georgia,serif' }}
            className="text-3xl font-semibold mb-1"
          >
            Přihlásit se
          </h1>
          <p className="text-white/40 text-sm mb-6">Pokračujte ve svém účtu</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="jana@email.cz"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Heslo</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3 mt-2"
            >
              {loading ? 'Přihlašuji...' : 'Přihlásit se'}
            </button>
          </form>
          <p className="text-center text-sm text-white/40 mt-5">
            Nemáte účet?{' '}
            <Link href="/auth/register" className="text-gold hover:text-gold-light transition-colors">
              Zaregistrovat se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
