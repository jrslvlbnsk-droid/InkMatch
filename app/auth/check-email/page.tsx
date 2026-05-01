import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full border border-gold/30 flex items-center justify-center mx-auto mb-6 text-2xl text-gold">
          ✉
        </div>
        <h1
          style={{ fontFamily: 'Georgia,serif' }}
          className="text-3xl font-semibold mb-3"
        >
          Zkontrolujte email
        </h1>
        <p className="text-white/50 leading-relaxed mb-8">
          Poslali jsme vám potvrzovací odkaz. Klikněte na něj pro aktivaci účtu.
          Pokud email nevidíte, zkontrolujte složku Spam.
        </p>
        <Link href="/auth/login" className="btn-outline inline-block">
          Zpět na přihlášení
        </Link>
      </div>
    </div>
  )
}
