'use client'
import { useState, useRef } from 'react'
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

function Avatar({ url, name, size = 96 }: { url?: string | null; name?: string | null; size?: number }) {
  const cls = `rounded-full overflow-hidden bg-surface2 border border-white/10 shrink-0 flex items-center justify-center`
  const style = { width: size, height: size, minWidth: size }
  return (
    <div className={cls} style={style}>
      {url ? (
        <img src={url} alt={name ?? ''} className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.35 }} className="text-white/30 font-light">
          {name?.[0]?.toUpperCase() ?? '?'}
        </span>
      )}
    </div>
  )
}

export default function ProfileTab({ userId, profile, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    nickname: profile?.nickname ?? '',
    name: profile?.name ?? '',
    city: profile?.city ?? '',
    bio: profile?.bio ?? '',
    instagram: profile?.instagram ?? '',
    website: profile?.website ?? '',
    styles: (profile?.styles ?? []) as string[],
    avatar_url: profile?.avatar_url ?? '',
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startEditing = () => {
    setForm({
      nickname: profile?.nickname ?? '',
      name: profile?.name ?? '',
      city: profile?.city ?? '',
      bio: profile?.bio ?? '',
      instagram: profile?.instagram ?? '',
      website: profile?.website ?? '',
      styles: (profile?.styles ?? []) as string[],
      avatar_url: profile?.avatar_url ?? '',
    })
    setAvatarPreview(null)
    setEditing(true)
  }

  const handleCancel = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
    setEditing(false)
  }

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)
    setAvatarUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${userId}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      console.error('[ProfileTab] avatar upload error:', uploadError)
      toast.error('Nahrávání fotky selhalo: ' + uploadError.message)
      setAvatarUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    console.log('[ProfileTab] avatar publicUrl:', publicUrl)
    setForm((f) => ({ ...f, avatar_url: publicUrl }))
    setAvatarUploading(false)
  }

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
    if (error) { toast.error('Uložení selhalo'); return }
    onUpdate(data)
    toast.success('Profil uložen')
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
    setEditing(false)
  }

  // ── VIEW MODE ────────────────────────────────────────────────────────────────
  if (!editing) {
    const displayName = profile?.nickname || profile?.name
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium mb-0.5">Profil</h2>
            <p className="text-white/40 text-sm">Vaše veřejné informace</p>
          </div>
          <button onClick={startEditing} className="btn-outline text-xs px-4 py-2">
            Upravit profil
          </button>
        </div>

        <div className="card p-6 max-w-xl space-y-5">
          {/* Avatar + jméno */}
          <div className="flex items-center gap-5">
            <Avatar url={profile?.avatar_url} name={displayName} size={96} />
            <div>
              <p className="text-lg font-medium leading-tight">{profile?.nickname || profile?.name || '—'}</p>
              {profile?.nickname && profile?.name && (
                <p className="text-white/35 text-sm mt-0.5">{profile.name}</p>
              )}
              {profile?.city && (
                <p className="text-white/50 text-sm mt-1">{profile.city}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile?.bio ? (
            <div>
              <p className="label mb-2">Bio</p>
              <p className="text-white/60 text-sm leading-relaxed">{profile.bio}</p>
            </div>
          ) : (
            <p className="text-white/25 text-sm italic">Bio není vyplněno.</p>
          )}

          {/* Styly */}
          {profile?.styles?.length > 0 && (
            <div>
              <p className="label mb-2">Styly</p>
              <div className="flex flex-wrap gap-2">
                {profile.styles.map((s: string) => (
                  <span key={s} className="px-3 py-1 rounded-full border border-white/10 text-white/60 text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sociální sítě */}
          {(profile?.instagram || profile?.website) && (
            <div className="flex flex-wrap gap-4">
              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/40 hover:text-gold transition-colors"
                >
                  {profile.instagram}
                </a>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/40 hover:text-gold transition-colors"
                >
                  Web ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── EDIT MODE ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-medium mb-0.5">Upravit profil</h2>
          <p className="text-white/40 text-sm">Změny se uloží po kliknutí na Uložit</p>
        </div>
      </div>

      <div className="card p-6 space-y-5 max-w-xl">
        {/* Avatar */}
        <div>
          <label className="label mb-3">Profilová fotka</label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar url={avatarPreview ?? form.avatar_url} name={form.nickname || form.name} size={96} />
              {avatarUploading && (
                <div className="absolute inset-0 rounded-full bg-ink/70 flex items-center justify-center">
                  <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <label className={`btn-outline text-xs cursor-pointer ${avatarUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {avatarUploading ? 'Nahrávám...' : 'Vybrat fotku'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                  disabled={avatarUploading}
                />
              </label>
              <p className="text-white/25 text-xs mt-1.5">JPG, PNG, max 5 MB</p>
            </div>
          </div>
        </div>

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

        <div className="flex gap-3 pt-1">
          <button
            className="btn-gold flex-1 sm:flex-none sm:px-8"
            onClick={handleSave}
            disabled={saving || avatarUploading}
          >
            {saving ? 'Ukládám...' : 'Uložit'}
          </button>
          <button
            className="btn-outline flex-1 sm:flex-none sm:px-8"
            onClick={handleCancel}
            disabled={saving}
          >
            Zrušit
          </button>
        </div>
      </div>
    </div>
  )
}
