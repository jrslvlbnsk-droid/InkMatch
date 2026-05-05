import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { sendWelcomeClient, sendWelcomeArtist } from '@/lib/email'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

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

  let user = null

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) user = data.user
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) user = data.user
  }

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_link`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const meta = user.user_metadata ?? {}
    const role: string = meta.role ?? 'client'
    const name: string = meta.name ?? meta.full_name ?? ''

    await supabase.from('profiles').insert({
      id: user.id,
      name,
      email: user.email,
      city: meta.city ?? '',
      role,
    })

    // Uvítací email — fire and forget, nesmí blokovat redirect
    try {
      if (role === 'artist') {
        await sendWelcomeArtist({ name, email: user.email! })
      } else {
        await sendWelcomeClient({ name, email: user.email! })
      }
    } catch (err) {
      console.error('[Callback] welcome email failed:', err)
    }

    return NextResponse.redirect(
      `${origin}/${role === 'artist' ? 'artist/onboarding' : 'client'}`
    )
  }

  return NextResponse.redirect(
    `${origin}/${profile.role === 'artist' ? 'artist' : 'client'}`
  )
}
