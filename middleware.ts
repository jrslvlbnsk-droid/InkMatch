import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set(name, value)
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set(name, value, options as any)
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set(name, '')
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set(name, '', options as any)
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const loginUrl = new URL('/auth/login', request.url)
  const path = request.nextUrl.pathname

  if (!user) {
    return NextResponse.redirect(loginUrl)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  if (path.startsWith('/artist') && role !== 'artist') {
    return NextResponse.redirect(loginUrl)
  }

  if (path.startsWith('/client') && role !== 'client') {
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/artist/:path*', '/client/:path*'],
}
