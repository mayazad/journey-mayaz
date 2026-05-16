'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type LearningState = { error?: string; success?: boolean }

export type Roadmap = {
  id: string; title: string; description?: string; created_at: string
  node_count?: number; done_count?: number
}

export type RoadmapNode = {
  id: string; roadmap_id: string; title: string; description?: string
  notes?: string; links?: { label: string; url: string }[]
  status: 'not_started' | 'in_progress' | 'done' | 'skipped'
  parent_ids: string[]; position_x: number; position_y: number; order_index: number
}

// ── Get all roadmaps for the user ─────────────────────────────────────────────
export async function getRoadmaps(): Promise<Roadmap[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!supabaseUrl.startsWith('http')) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: roadmaps } = await supabase
    .from('roadmaps')
    .select('id, title, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!roadmaps) return []

  // Enrich with node counts
  const enriched = await Promise.all(
    roadmaps.map(async (r) => {
      const { count: node_count }  = await supabase.from('roadmap_nodes').select('*', { count: 'exact', head: true }).eq('roadmap_id', r.id)
      const { count: done_count }  = await supabase.from('roadmap_nodes').select('*', { count: 'exact', head: true }).eq('roadmap_id', r.id).eq('status', 'done')
      return { ...r, node_count: node_count ?? 0, done_count: done_count ?? 0 }
    })
  )

  return enriched as Roadmap[]
}

// ── Get nodes for a single roadmap ───────────────────────────────────────────
export async function getRoadmapNodes(roadmapId: string): Promise<RoadmapNode[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!supabaseUrl.startsWith('http')) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('roadmap_nodes')
    .select('*')
    .eq('roadmap_id', roadmapId)
    .eq('user_id', user.id)
    .order('order_index', { ascending: true })

  return (data ?? []) as RoadmapNode[]
}

// ── Create a new roadmap ──────────────────────────────────────────────────────
export async function createRoadmap(title: string, description?: string): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('roadmaps')
    .insert({ user_id: user.id, title, description })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/learning')
  return { id: data.id }
}

// ── Delete a roadmap ──────────────────────────────────────────────────────────
export async function deleteRoadmap(roadmapId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('roadmaps')
    .delete()
    .eq('id', roadmapId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/learning')
  return {}
}

// ── Update a single node's status ────────────────────────────────────────────
export async function updateNodeStatus(
  nodeId: string,
  status: RoadmapNode['status']
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('roadmap_nodes')
    .update({ status })
    .eq('id', nodeId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/learning')
  return {}
}

// ── Update a node's notes + links ─────────────────────────────────────────────
export async function updateNodeDetails(
  nodeId: string,
  notes: string,
  links: { label: string; url: string }[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('roadmap_nodes')
    .update({ notes, links })
    .eq('id', nodeId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/learning')
  return {}
}

// ── Save node positions after drag ───────────────────────────────────────────
export async function saveNodePositions(
  updates: { id: string; position_x: number; position_y: number }[]
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await Promise.all(
    updates.map((u) =>
      supabase
        .from('roadmap_nodes')
        .update({ position_x: u.position_x, position_y: u.position_y })
        .eq('id', u.id)
        .eq('user_id', user.id)
    )
  )
}

// ── Bulk insert nodes (from AI import) ────────────────────────────────────────
export async function bulkInsertNodes(
  roadmapId: string,
  nodes: { title: string; description?: string; order_index: number; parent_ids?: string[] }[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const rows = nodes.map((n, i) => ({
    roadmap_id: roadmapId,
    user_id: user.id,
    title: n.title,
    description: n.description ?? null,
    order_index: n.order_index ?? i,
    parent_ids: n.parent_ids ?? [],
    position_x: 250,
    position_y: i * 120,
    status: 'not_started' as const,
  }))

  const { error } = await supabase.from('roadmap_nodes').insert(rows)
  if (error) return { error: error.message }

  revalidatePath('/learning')
  revalidatePath(`/learning/${roadmapId}`)
  return {}
}
