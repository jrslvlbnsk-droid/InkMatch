'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

const STYLES = [
  'Blackwork', 'Traditional', 'Neo-traditional', 'Realism', 'Microrealism', 'Watercolor',
  'Tribal', 'Japanese', 'Geometric', 'Minimalist', 'Lettering',
  'Old School', 'New School', 'Trash Polka', 'Dotwork',
]

export default function PortfolioTab({ userId }: { userId: string }) {
  const [images, setImages] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0])
  const [preview, setPreview] = useState<{ url: string; file: File } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('portfolio_images')
      .select('*')
      .eq('artist_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setImages(data ?? []))
  }, [userId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setPreview({ url: objectUrl, file })
  }

  const handleUpload = async () => {
    if (!preview) return
    setUploading(true)
    const supabase = createClient()
    const fileName = `${userId}/${Date.now()}_${preview.file.name.replace(/\s/g, '_')}`

    const { error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(fileName, preview.file)

    if (uploadError) {
      console.error('[PortfolioTab] upload error:', uploadError)
      toast.error('Nahrávání selhalo: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(fileName)
    console.log('[PortfolioTab] publicUrl:', publicUrl)

    const { data: img, error: insertError } = await supabase
      .from('portfolio_images')
      .insert({ artist_id: userId, url: publicUrl, style: selectedStyle })
      .select()
      .single()

    if (insertError) {
      console.error('[PortfolioTab] insert error:', insertError)
      toast.error('Uložení záznamu selhalo')
      setUploading(false)
      return
    }

    console.log('[PortfolioTab] inserted image:', img)

    // Okamžitě přidej do galerie
    setImages((prev) => [img, ...prev])
    toast.success('Fotografie nahrána')

    // Reset
    URL.revokeObjectURL(preview.url)
    setPreview(null)
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCancelPreview = () => {
    if (preview) URL.revokeObjectURL(preview.url)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('portfolio_images').delete().eq('id', id)
    setImages((prev) => prev.filter((i) => i.id !== id))
    toast.success('Fotografie odstraněna')
  }

  return (
    <div>
      <h2 className="text-xl font-medium mb-1">Portfolio</h2>
      <p className="text-white/40 text-sm mb-6">Sdílejte své práce se světem</p>

      {/* Upload panel */}
      <div className="card p-5 mb-6">
        {!preview ? (
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-40">
              <label className="label">Styl fotografie</label>
              <select
                className="input"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
              >
                {STYLES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <label className="btn-gold cursor-pointer shrink-0">
              Vybrat fotografii
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        ) : (
          <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
            {/* Náhled */}
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-surface2 shrink-0">
              <img src={preview.url} alt="náhled" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <label className="label">Styl fotografie</label>
                <select
                  className="input"
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  disabled={uploading}
                >
                  {STYLES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-gold flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-ink/40 border-t-ink rounded-full animate-spin" />
                      Nahrávám...
                    </>
                  ) : (
                    'Nahrát fotografii'
                  )}
                </button>
                <button
                  onClick={handleCancelPreview}
                  disabled={uploading}
                  className="btn-outline disabled:opacity-50"
                >
                  Zrušit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Galerie */}
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
                onClick={() => handleDelete(img.id)}
                className="text-white/50 hover:text-red-400 text-xs transition-colors"
              >
                Odstranit
              </button>
            </div>
          </div>
        ))}
        {images.length === 0 && !uploading && (
          <div className="col-span-4 py-16 text-center text-white/25 text-sm">
            Zatím žádné fotografie. Nahrajte svou první práci.
          </div>
        )}
      </div>
    </div>
  )
}
