import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: Record<string, unknown>) =>
          cookieStore.set({ name, value, ...options }),
        remove: (name: string, options: Record<string, unknown>) =>
          cookieStore.set({ name, value: '', ...options }),
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (!profile) {
    const meta = data.user.user_metadata ?? {}
    await supabase.from('profiles').insert({
      id: data.user.id,
      name: meta.name ?? meta.full_name ?? '',
      email: data.user.email,
      city: meta.city ?? '',
      role: meta.role ?? 'client',
    })
    const role: string = meta.role ?? 'client'
    return NextResponse.redirect(`${origin}/${role === 'artist' ? 'artist' : 'client'}`)
  }

  return NextResponse.redirect(`${origin}/${profile.role === 'artist' ? 'artist' : 'client'}`)
}
