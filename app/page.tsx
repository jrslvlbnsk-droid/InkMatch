'use client'
import Link from 'next/link'
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex justify-between items-center px-10 py-5 border-b border-white/5 sticky top-0 z-50 bg-ink/90 backdrop-blur-xl">
        <div style={{fontFamily:'Georgia,serif'}} className="text-2xl font-semibold">Ink<span className="text-gold">Match</span></div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="btn-outline text-xs px-4 py-2">Prihlasit</Link>
          <Link href="/auth/register" className="btn-gold text-xs px-4 py-2">Zacit zdarma</Link>
        </div>
      </nav>
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <p className="text-xs tracking-[3px] uppercase text-gold/70 mb-6">AI Tattoo Matching Platform</p>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(48px,8vw,88px)'}} className="font-light leading-none mb-2">Najdi tatera,</h1>
        <p style={{fontFamily:'Georgia,serif',fontSize:'clamp(48px,8vw,88px)',lineHeight:1}} className="font-light italic text-white/40 mb-8">ktery mluvi tvym stylem</p>
        <p className="text-white/50 text-base max-w-md leading-relaxed mb-12">Popis sve tetovani. AI porovna popis s portfolii tateru a najde match.</p>
        <div className="flex gap-3 flex-wrap justify-center mb-16">
          <Link href="/auth/register?role=client" className="btn-gold px-8 py-3 text-sm">Hledam tatera</Link>
          <Link href="/auth/register?role=artist" className="btn-outline px-8 py-3 text-sm">Jsem tater</Link>
        </div>
        <div className="flex gap-12 border-t border-white/5 pt-10">
          {[['247','Tateru'],['1 840','Realizaci'],['4.9','Hodnoceni'],['12','Stylu']].map(([n,l]) => (
            <div key={l} className="text-center">
              <span style={{fontFamily:'Georgia,serif'}} className="text-4xl font-semibold text-gold block">{n}</span>
              <span className="text-xs tracking-[2px] uppercase text-white/40">{l}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
