import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { description, style, city } = await request.json()

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  )

  // Zjisti aktuálního uživatele — tatér se nesmí zobrazit sám sobě
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  let query = supabase
    .from('profiles')
    .select('id, name, nickname, city, bio, styles, avatar_url')
    .eq('role', 'artist')

  if (city) query = query.ilike('city', `%${city}%`)

  const { data: rawArtists } = await query.limit(30)

  // Vyfiltruj přihlášeného uživatele z výsledků
  const artists = (rawArtists ?? []).filter((a) => a.id !== currentUser?.id)

  if (!artists.length) {
    return NextResponse.json({ artists: [] })
  }

  const filtered = style
    ? artists.filter(
        (a) =>
          !a.styles?.length ||
          a.styles.some((s: string) =>
            s.toLowerCase().includes(style.toLowerCase())
          )
      )
    : artists

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'sk-ant-TVUJ_KLIC_ZDE') {
    return NextResponse.json({ artists: filtered })
  }

  try {
    const prompt = `Jsi expert na výběr tatéra. Seřaď tatéry podle vhodnosti pro tohoto klienta.

Popis klienta: ${description}
Preferovaný styl: ${style ?? 'jakýkoliv'}

Dostupní tatéři:
${filtered
  .map(
    (a, i) =>
      `${i}. ${a.nickname || a.name} | ${a.city} | Styly: ${(a.styles ?? []).join(', ')} | Bio: ${a.bio ?? '(žádné bio)'}`
  )
  .join('\n')}

Vrať POUZE JSON: {"ranked":[0,1,2,...]} kde čísla jsou indexy seřazené od nejlepší shody po nejhorší.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const aiData = await res.json()
    const text: string = aiData.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ artists: filtered })
    const { ranked } = JSON.parse(jsonMatch[0]) as { ranked: number[] }
    const sorted = ranked.map((i) => filtered[i]).filter(Boolean)
    return NextResponse.json({ artists: sorted })
  } catch {
    return NextResponse.json({ artists: filtered })
  }
}
