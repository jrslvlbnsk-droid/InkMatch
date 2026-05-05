'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

const STYLES = [
  'Blackwork', 'Traditional', 'Neo-traditional', 'Realism', 'Microrealism', 'Watercolor',
  'Tribal', 'Japanese', 'Geometric', 'Minimalist', 'Lettering',
  'Old School', 'New School', 'Trash Polka', 'Dotwork',
]

interface Props {
  userId: string
  profile: any
  onUpdate: (profile: any) => void
}

export default function ProfileTab({ userId, profile, onUpdate }: Props) {
  const [form, setForm] = useState({
    nickname: profile?.nickname ?? '',
    name: profile?.name ?? '',
    city: profile?.city ?? '',
    bio: profile?.bio ?? '',
    instagram: profile?.instagram ?? '',
    website: profile?.website ?? '',
    styles: (profile?.styles ?? []) as string[],
  })
  const [saving, setSaving] = useState(false)

  const toggleStyle = (style: string) => {
    setForm((f) => ({
      ...f,
      styles: f.styles.includes(style)
        ? f.styles.filter((s) => s !== style)
        : [...f.styles, style],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .update(form)
      .eq('id', userId)
      .select()
      .single()
    setSaving(false)
    if (error) {
      toast.error('Uložení selhalo')
      return
    }
    onUpdate(data)
    toast.success('Profil uložen')
  }

  return (
    <div>
      <h2 className="text-xl font-medium mb-1">Profil</h2>
      <p className="text-white/40 text-sm mb-6">Upravte své veřejné údaje</p>

      <div className="card p-6 space-y-5 max-w-xl">
        <div>
          <label className="label">Přezdívka</label>
          <input
            className="input"
            placeholder="Jak vás klienti znají..."
            value={form.nickname}
            onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Jméno</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Město</label>
          <input
            className="input"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea
            className="input min-h-[100px] resize-none"
            placeholder="Představte se klientům..."
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Instagram</label>
          <input
            className="input"
            placeholder="@username"
            value={form.instagram}
            onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Web</label>
          <input
            className="input"
            placeholder="https://..."
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Styly tetování</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleStyle(s)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  form.styles.includes(s)
                    ? 'border-gold text-gold bg-gold/10'
                    : 'border-white/10 text-white/40 hover:border-white/25'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-gold" onClick={handleSave} disabled={saving}>
          {saving ? 'Ukládám...' : 'Uložit profil'}
        </button>
      </div>
    </div>
  )
}
