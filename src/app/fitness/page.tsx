import { getWeeklyPlan, getTodayPlan } from '@/actions/fitness'
import { aiSetDayPlan } from '@/actions/ai'
import { getTodayMeals, getTodaySleep } from '@/actions/health'
import { AppShell } from '@/components/AppShell'
import { FitnessClient } from './FitnessClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fitness — Mayaz OS',
  description: 'Your weekly workout plan, diet tracker, and sleep log.',
}

export default async function FitnessPage() {
  const [weeklyPlan, todayPlan, todayMeals, todaySleep] = await Promise.all([
    getWeeklyPlan(),
    getTodayPlan(),
    getTodayMeals(),
    getTodaySleep(),
  ])

  return (
    <AppShell>
      <FitnessClient
        weeklyPlan={weeklyPlan}
        todayPlan={todayPlan}
        aiAction={aiSetDayPlan}
        initialMeals={todayMeals}
        initialSleep={todaySleep}
      />
    </AppShell>
  )
}
