import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full border border-gold/30 flex items-center justify-center mx-auto mb-6 text-gold text-2xl">
          ✓
        </div>
        <h1
          style={{ fontFamily: 'Georgia,serif' }}
          className="text-3xl font-light mb-3"
        >
          Rezervace odeslána
        </h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          Vaše rezervace byla úspěšně odeslána. Tatér vás bude brzy kontaktovat
          pro potvrzení termínu.
        </p>
        <Link href="/client" className="btn-gold inline-block">
          Zpět na hledání
        </Link>
      </div>
    </div>
  )
}
