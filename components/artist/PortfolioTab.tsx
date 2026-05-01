'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

const STYLES = [
  'Blackwork', 'Traditional', 'Neo-traditional', 'Realism', 'Watercolor',
  'Tribal', 'Japanese', 'Geometric', 'Minimalist', 'Lettering',
  'Old School', 'New School', 'Trash Polka', 'Dotwork',
]

export default function PortfolioTab({ userId }: { userId: string }) {
  const [images, setImages] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('portfolio_images')
      .select('*')
      .eq('artist_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setImages(data ?? []))
  }, [userId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const fileName = `${userId}/${Date.now()}_${file.name.replace(/\s/g, '_')}`
    const { error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(fileName, file)
    if (uploadError) {
      toast.error('Nahrávání selhalo')
      setUploading(false)
      return
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from('portfolio').getPublicUrl(fileName)
    const { data: img } = await supabase
      .from('portfolio_images')
      .insert({ artist_id: userId, url: publicUrl, style: selectedStyle })
      .select()
      .single()
    if (img) setImages((prev) => [img, ...prev])
    toast.success('Fotografie nahrána')
    setUploading(false)
    e.target.value = ''
  }

  const handleDelete = async (id: string, url: string) => {
    const supabase = createClient()
    await supabase.from('portfolio_images').delete().eq('id', id)
    setImages((prev) => prev.filter((i) => i.id !== id))
    toast.success('Fotografie odstraněna')
  }

  return (
    <div>
      <h2 className="text-xl font-medium mb-1">Portfolio</h2>
      <p className="text-white/40 text-sm mb-6">Sdílejte své práce se světem</p>

      <div className="card p-5 mb-6 flex items-end gap-4 flex-wrap">
        <div className="flex-1 min-w-40">
          <label className="label">Styl fotografie</label>
          <select
            className="input"
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
          >
            {STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <label
          className={`btn-gold cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? 'Nahrávám...' : 'Nahrát fotografii'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative group aspect-square rounded-lg overflow-hidden bg-surface2"
          >
            <img
              src={img.url}
              alt={img.style}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-ink/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <span className="text-gold text-xs font-medium">{img.style}</span>
              <button
                onClick={() => handleDelete(img.id, img.url)}
                className="text-white/50 hover:text-red-400 text-xs transition-colors"
              >
                Odstranit
              </button>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-4 py-16 text-center text-white/25 text-sm">
            Zatím žádné fotografie. Nahrajte svou první práci.
          </div>
        )}
      </div>
    </div>
  )
}
