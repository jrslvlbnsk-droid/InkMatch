'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { cormorant } from '@/lib/fonts'

const STYLES = [
  'Blackwork', 'Traditional', 'Neo-traditional', 'Realism', 'Microrealism', 'Watercolor',
  'Tribal', 'Japanese', 'Geometric', 'Minimalist', 'Lettering',
  'Old School', 'New School', 'Trash Polka', 'Dotwork',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)

  const [form, setForm] = useState({
    nickname: '', name: '', city: '', bio: '', instagram: '', website: '',
  })
  const [saving, setSaving] = useState(false)

  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [photosByStyle, setPhotosByStyle] = useState<Record<string, number>>({})
  const [uploadStyle, setUploadStyle] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
    })
  }, [router])

  useEffect(() => {
    if (selectedStyles.length > 0 && !selectedStyles.includes(uploadStyle)) {
      setUploadStyle(selectedStyles[0])
    }
  }, [selectedStyles, uploadStyle])

  const handleStep1 = async () => {
    if (!form.nickname.trim() || !form.name.trim() || !form.city.trim() || !form.bio.trim()) {
      toast.error('Vyplňte všechna povinná pole')
      return
    }
    if (!userId) return
    setSaving(true)
    const { error } = await createClient()
      .from('profiles')
      .update({
        nickname: form.nickname.trim(),
        name: form.name.trim(),
        city: form.city.trim(),
        bio: form.bio.trim(),
        instagram: form.instagram.trim() || null,
        website: form.website.trim() || null,
      })
      .eq('id', userId)
    setSaving(false)
    if (error) { toast.error('Uložení selhalo'); return }
    setStep(2)
  }

  const toggleStyle = (s: string) => {
    setSelectedStyles((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const totalPhotos = Object.values(photosByStyle).reduce((a, b) => a + b, 0)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadStyle || !userId) return
    setUploading(true)
    const supabase = createClient()
    const fileName = `${userId}/${Date.now()}_${file.name.replace(/\s/g, '_')}`
    const { error: uploadError } = await supabase.storage.from('portfolio').upload(fileName, file)
    if (uploadError) { toast.error('Nahrávání selhalo'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(fileName)
    await supabase.from('portfolio_images').insert({ artist_id: userId, url: publicUrl, style: uploadStyle })
    setPhotosByStyle((prev) => ({ ...prev, [uploadStyle]: (prev[uploadStyle] ?? 0) + 1 }))
    toast.success('Fotografie nahrána')
    setUploading(false)
    e.target.value = ''
  }

  const handleStep2 = async () => {
    if (selectedStyles.length === 0) { toast.error('Vyberte alespoň 1 styl'); return }
    if (totalPhotos < 3) { toast.error('Nahrajte alespoň 3 fotografie celkem'); return }
    const missingStyle = selectedStyles.find((s) => (photosByStyle[s] ?? 0) < 2)
    if (missingStyle) { toast.error(`Styl „${missingStyle}": nahrajte alespoň 2 fotografie`); return }
    if (!userId) return
    await createClient().from('profiles').update({ styles: selectedStyles }).eq('id', userId)
    setStep(3)
  }

  const steps = ['Základní údaje', 'Styly a fotky', 'Hotovo']

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-5 sm:px-10 py-4 border-b border-white/5">
        <div className={`${cormorant.className} text-xl font-semibold`}>
          Ink<span className="text-gold">Match</span>
        </div>
        <span className="text-white/30 text-xs">Krok {step} / 3</span>
      </nav>

      {/* Ukazatel kroků */}
      <div className="flex items-center justify-center gap-0 px-6 py-6">
        {steps.map((label, i) => {
          const n = i + 1
          const done = step > n
          const active = step === n
          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  done ? 'bg-gold text-ink' : active ? 'border-2 border-gold text-gold' : 'border border-white/20 text-white/30'
                }`}>
                  {done ? '✓' : n}
                </div>
                <span className={`text-[10px] mt-1 hidden sm:block ${active ? 'text-white/70' : 'text-white/25'}`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-16 sm:w-24 h-px mx-2 mb-4 sm:mb-0 transition-all ${step > n ? 'bg-gold/50' : 'bg-white/10'}`} />
              )}
            </div>
          )
        })}
      </div>

      <main className="flex-1 flex flex-col items-center justify-start px-4 pb-12">
        <div className="w-full max-w-lg">

          {/* KROK 1 */}
          {step === 1 && (
            <div className="card p-6 sm:p-8 space-y-5">
              <div>
                <h1 className={`${cormorant.className} text-2xl sm:text-3xl font-light mb-1`}>Představte se</h1>
                <p className="text-white/40 text-sm">Tyto informace uvidí klienti na vašem profilu</p>
              </div>

              <div>
                <label className="label">Přezdívka <span className="text-gold">*</span></label>
                <input
                  className="input"
                  placeholder="Jak vás klienti znají..."
                  value={form.nickname}
                  onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Jméno a příjmení <span className="text-gold">*</span></label>
                <input
                  className="input"
                  placeholder="Jana Nováková"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Město <span className="text-gold">*</span></label>
                <input
                  className="input"
                  placeholder="Praha"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Bio <span className="text-gold">*</span></label>
                <textarea
                  className="input min-h-[110px] resize-none"
                  placeholder="Představte se klientům, popište váš styl a přístup..."
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Instagram <span className="text-white/25">(volitelné)</span></label>
                <input
                  className="input"
                  placeholder="@username"
                  value={form.instagram}
                  onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Web <span className="text-white/25">(volitelné)</span></label>
                <input
                  className="input"
                  placeholder="https://..."
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                />
              </div>

              <button className="btn-gold w-full py-3" onClick={handleStep1} disabled={saving}>
                {saving ? 'Ukládám...' : 'Pokračovat →'}
              </button>
            </div>
          )}

          {/* KROK 2 */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Styly */}
              <div className="card p-6">
                <h2 className="font-medium mb-1">Vaše styly</h2>
                <p className="text-white/40 text-xs mb-4">Vyberte alespoň 1 styl, který tatérujete</p>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleStyle(s)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        selectedStyles.includes(s)
                          ? 'border-gold text-gold bg-gold/10'
                          : 'border-white/10 text-white/40 hover:border-white/25'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload fotek */}
              <div className="card p-6">
                <h2 className="font-medium mb-1">Portfolio fotky</h2>
                <p className="text-white/40 text-xs mb-4">
                  Alespoň 3 fotky celkem · alespoň 2 na každý zvolený styl
                </p>

                {selectedStyles.length === 0 ? (
                  <p className="text-white/25 text-sm py-4 text-center">Nejdřív vyberte styly výše</p>
                ) : (
                  <>
                    {/* Přehled počtu fotek per styl */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                      {selectedStyles.map((s) => {
                        const count = photosByStyle[s] ?? 0
                        const ok = count >= 2
                        return (
                          <div key={s} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${ok ? 'border-gold/30 bg-gold/5 text-gold' : 'border-white/10 text-white/50'}`}>
                            <span className="truncate">{s}</span>
                            <span className="ml-2 shrink-0 font-medium">{count}/2{ok && ' ✓'}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Upload */}
                    <div className="flex items-end gap-3 flex-wrap">
                      <div className="flex-1 min-w-36">
                        <label className="label">Styl fotky</label>
                        <select
                          className="input"
                          value={uploadStyle}
                          onChange={(e) => setUploadStyle(e.target.value)}
                        >
                          {selectedStyles.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <label className={`btn-gold cursor-pointer shrink-0 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploading ? 'Nahrávám...' : 'Nahrát fotku'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                      </label>
                    </div>

                    <p className="text-white/30 text-xs mt-3">
                      Nahráno celkem: <span className={totalPhotos >= 3 ? 'text-gold' : 'text-white/50'}>{totalPhotos}</span> / min. 3
                    </p>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button className="btn-outline flex-1 py-3" onClick={() => setStep(1)}>
                  ← Zpět
                </button>
                <button className="btn-gold flex-1 py-3" onClick={handleStep2}>
                  Pokračovat →
                </button>
              </div>
            </div>
          )}

          {/* KROK 3 */}
          {step === 3 && (
            <div className="card p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full border border-gold/30 flex items-center justify-center mx-auto text-gold text-2xl">
                ✓
              </div>
              <div>
                <h1 className={`${cormorant.className} text-3xl font-light mb-2`}>Profil je připraven</h1>
                <p className="text-white/50 text-sm leading-relaxed">
                  Váš profil byl úspěšně vytvořen. Klienti vás nyní mohou najít a rezervovat.
                </p>
              </div>

              <div className="text-left card p-4 space-y-2">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Shrnutí</p>
                <p className="text-sm"><span className="text-white/40">Přezdívka:</span> <span className="text-white/80">{form.nickname}</span></p>
                <p className="text-sm"><span className="text-white/40">Jméno:</span> <span className="text-white/80">{form.name}</span></p>
                <p className="text-sm"><span className="text-white/40">Město:</span> <span className="text-white/80">{form.city}</span></p>
                <p className="text-sm"><span className="text-white/40">Styly:</span> <span className="text-white/80">{selectedStyles.join(', ')}</span></p>
                <p className="text-sm"><span className="text-white/40">Fotky:</span> <span className="text-white/80">{totalPhotos}</span></p>
              </div>

              <button className="btn-gold w-full py-3" onClick={() => router.push('/artist')}>
                Přejít na dashboard →
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
