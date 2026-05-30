import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedPage = createRouteMatcher(['/dashboard(.*)', '/vault(.*)'])
const isProtectedApi = createRouteMatcher(['/api/truelayer(.*)', '/api/notifications(.*)', '/api/cron(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedPage(req)) {
    const { userId } = await auth()
    if (!userId) {
      const { redirectToSignIn } = await auth()
      return redirectToSignIn()
    }
  }
  // API routes — deixa passar, cada route verifica auth() internamente
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
