'use client'
import { Suspense, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [role, setRole] = useState<'client' | 'artist'>('client')
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '' })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const r = params.get('role')
    if (r === 'artist' || r === 'client') setRole(r)
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
        data: { name: form.name, city: form.city, role },
      },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      router.push('/auth/check-email')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
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
            Vytvořit účet
          </h1>
          <p className="text-white/40 text-sm mb-6">Zdarma, bez závazku</p>

          <div className="flex bg-surface2 rounded-xl p-1 mb-6 gap-1">
            {(['client', 'artist'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${
                  role === r ? 'bg-surface text-white shadow' : 'text-white/40'
                }`}
              >
                {r === 'client' ? 'Jsem klient' : 'Jsem tatér'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Celé jméno</label>
              <input
                className="input"
                placeholder="Jana Nováková"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
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
                placeholder="Alespoň 8 znaků"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="label">Město</label>
              <input
                className="input"
                placeholder="Praha"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                required
              />
            </div>
            <label className="flex items-start gap-3 cursor-pointer group mt-2">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 shrink-0 w-4 h-4 rounded border border-white/20 bg-surface2 checked:bg-gold checked:border-gold accent-gold cursor-pointer"
                required
              />
              <span className="text-xs text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">
                Souhlasím s{' '}
                <Link
                  href="/podminky"
                  target="_blank"
                  className="text-gold/70 hover:text-gold underline underline-offset-2 transition-colors"
                >
                  obchodními podmínkami
                </Link>
                {' '}a{' '}
                <Link
                  href="/gdpr"
                  target="_blank"
                  className="text-gold/70 hover:text-gold underline underline-offset-2 transition-colors"
                >
                  zásadami ochrany osobních údajů
                </Link>
                {' '}InkMatch.cz
              </span>
            </label>
            <button
              type="submit"
              disabled={loading || !termsAccepted}
              className="btn-gold w-full py-3 mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Registruji...' : 'Zaregistrovat se'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-5">
            Máte účet?{' '}
            <Link href="/auth/login" className="text-gold hover:text-gold-light transition-colors">
              Přihlásit se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
