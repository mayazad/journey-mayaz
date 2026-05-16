import { getRoadmapNodes, getRoadmaps } from '@/actions/learning'
import { AppShell } from '@/components/AppShell'
import { RoadmapCanvas } from './RoadmapCanvas'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const roadmaps = await getRoadmaps()
  const roadmap  = roadmaps.find(r => r.id === id)
  return { title: roadmap ? `${roadmap.title} — Mayaz OS` : 'Roadmap — Mayaz OS' }
}

export default async function RoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [nodes, roadmaps] = await Promise.all([
    getRoadmapNodes(id),
    getRoadmaps(),
  ])
  const roadmap = roadmaps.find(r => r.id === id)
  if (!roadmap) notFound()

  return (
    <AppShell>
      <RoadmapCanvas roadmap={roadmap} initialNodes={nodes} />
    </AppShell>
  )
}
