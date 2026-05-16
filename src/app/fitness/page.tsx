import { getWeeklyPlan, getTodayPlan } from '@/actions/fitness'
import { aiSetDayPlan } from '@/actions/ai'
import { AppShell } from '@/components/AppShell'
import { FitnessClient } from './FitnessClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fitness — Mayaz OS',
  description: 'Your weekly workout plan.',
}

export default async function FitnessPage() {
  const [weeklyPlan, todayPlan] = await Promise.all([
    getWeeklyPlan(),
    getTodayPlan(),
  ])

  return (
    <AppShell>
      <FitnessClient
        weeklyPlan={weeklyPlan}
        todayPlan={todayPlan}
        aiAction={aiSetDayPlan}
      />
    </AppShell>
  )
}
