import { getRoadmaps, getNotes } from '@/actions/learning'
import { parseRoadmapFromText } from '@/actions/ai'
import { AppShell } from '@/components/AppShell'
import { LearningClient } from './LearningClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Learning — Mayaz OS',
  description: 'Your learning roadmaps.',
}

export default async function LearningPage() {
  const roadmaps = await getRoadmaps()
  const notes = await getNotes()

  return (
    <AppShell>
      <LearningClient roadmaps={roadmaps} initialNotes={notes} parseAction={parseRoadmapFromText} />
    </AppShell>
  )
}
