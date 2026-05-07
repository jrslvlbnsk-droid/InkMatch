import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : (request.headers.get('x-real-ip') ?? 'unknown')

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
    )

    const now = new Date().toISOString()

    const { error } = await supabase
      .from('users')
      .update({
        terms_accepted_at: now,
        gdpr_accepted_at: now,
        terms_accepted_ip: ip,
      })
      .eq('id', userId)

    if (error) {
      console.error('[Consent] update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Consent] error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
