import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { LandingPage } from './LandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mayaz OS — Your Personal AI Operating System',
  description:
    'Track fitness, learning, academics, and daily life — all in one place, powered by AI. Built for people who want to be intentional about their days.',
}

export default async function RootPage() {
  const user = await getAuthUser()
  if (user) redirect('/home')
  return <LandingPage />
}
