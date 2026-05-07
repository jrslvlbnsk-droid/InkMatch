'use client'
import { Suspense, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

// ─── Validace hesla ───────────────────────────────────────────────────────────

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Heslo musí mít alespoň 8 znaků, obsahovat velké písmeno a číslo'
  if (!/[A-Z]/.test(pw)) return 'Heslo musí mít alespoň 8 znaků, obsahovat velké písmeno a číslo'
  if (!/[0-9]/.test(pw)) return 'Heslo musí mít alespoň 8 znaků, obsahovat velké písmeno a číslo'
  return null
}

// ─── Ikonka oka ──────────────────────────────────────────────────────────────

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    // oko otevřené
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    // oko přeškrtnuté
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

// ─── Pole hesla s okem ────────────────────────────────────────────────────────

function PasswordField({
  label, value, onChange, placeholder, error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string | null
}) {
  const [show, setShow] = useState(false)

  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          className={`input pr-10 ${error ? 'border-red-500/60' : ''}`}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Skrýt heslo' : 'Zobrazit heslo'}
        >
          <EyeIcon visible={show} />
        </button>
      </div>
      {error && (
        <p className="text-red-400 text-xs mt-1.5 leading-snug">{error}</p>
      )}
    </div>
  )
}

// ─── Formulář ─────────────────────────────────────────────────────────────────

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [role, setRole] = useState<'client' | 'artist'>('client')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', city: '' })
  const [errors, setErrors] = useState({ password: '', confirm: '' })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const r = params.get('role')
    if (r === 'artist' || r === 'client') setRole(r)
  }, [params])

  // Živá validace při psaní
  const handlePasswordChange = (value: string) => {
    setForm((f) => ({ ...f, password: value }))
    const err = value ? validatePassword(value) : ''
    const confirmErr = form.confirm && value !== form.confirm ? 'Hesla se neshodují' : ''
    setErrors((e) => ({ ...e, password: err ?? '', confirm: confirmErr }))
  }

  const handleConfirmChange = (value: string) => {
    setForm((f) => ({ ...f, confirm: value }))
    const confirmErr = value && value !== form.password ? 'Hesla se neshodují' : ''
    setErrors((e) => ({ ...e, confirm: confirmErr }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Finální validace při odeslání
    const pwErr = validatePassword(form.password)
    const cfErr = form.password !== form.confirm ? 'Hesla se neshodují' : null
    if (pwErr || cfErr) {
      setErrors({ password: pwErr ?? '', confirm: cfErr ?? '' })
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
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
      if (data.user?.id) {
        fetch('/api/consent', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id }),
        }).catch((err) => console.error('[Consent] error:', err))
      }
      router.push('/auth/check-email')
    }
  }

  const formValid = !errors.password && !errors.confirm && form.password.length >= 1 && form.confirm === form.password

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

            <PasswordField
              label="Heslo"
              value={form.password}
              onChange={handlePasswordChange}
              placeholder="Min. 8 znaků, velké písmeno, číslo"
              error={errors.password || null}
            />

            <PasswordField
              label="Zopakujte heslo"
              value={form.confirm}
              onChange={handleConfirmChange}
              placeholder="Zadejte heslo znovu"
              error={errors.confirm || null}
            />

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
