import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/auth/callback']

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const path = request.nextUrl.pathname

  // If Supabase isn't configured, let everything through (dev fallback)
  if (!supabaseUrl.startsWith('http')) {
    return NextResponse.next({ request })
  }

  const isPublic = PUBLIC_ROUTES.some((r) => path.startsWith(r))

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in + trying to access a protected route → /login
  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Already logged in + on /login → /home
  if (user && path === '/login') {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/home'
    return NextResponse.redirect(homeUrl)
  }

  return supabaseResponse
}
