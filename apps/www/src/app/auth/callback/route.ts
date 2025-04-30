import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from "@/lib/supabase/server"
// import {useTranslations} from "@/hooks/use-translations";
export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    // Normalize the next parameter, defaulting to '/'
    let nextParam = requestUrl.searchParams.get('next');
    if (!nextParam || nextParam === 'null') {
        nextParam = '/';
    }
    // Alternatively, combine with the redirect param if needed:
    const next = nextParam || requestUrl.searchParams.get("redirect") || '/';

    const locale = request.nextUrl.locale || 'en'

    // If the redirect path does not already include the locale, prepend the locale.
    let nextPath = next;
    if (!next.startsWith(``)) {
        nextPath = next === '/' ? `/` : `${next}`;
    }

    const supabase = await createClient()

    // For OAuth and email sign-in flows
    if (code) {
        const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
        if (sessionError) {
            console.error('Session error:', sessionError)
            return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
        }
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        console.error('User error:', userError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
    }

    return NextResponse.redirect(`${requestUrl.origin}${nextPath}`)
}
