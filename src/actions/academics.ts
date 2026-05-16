'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type TaskState = {
  error?: string
  success?: boolean
}

export async function addTask(
  prevState: TaskState,
  formData: FormData
): Promise<TaskState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const title = formData.get('title') as string
  const type = formData.get('type') as string
  const due_date = formData.get('due_date') as string
  const notes = formData.get('notes') as string

  if (!title || !type || !due_date) {
    return { error: 'Title, type, and due date are required.' }
  }

  const { error } = await supabase.from('academic_tasks').insert({
    user_id: user.id,
    title,
    type,
    due_date: new Date(due_date).toISOString(),
    status: 'pending',
    notes: notes || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/academics')
  return { success: true }
}

export async function getTasks() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('academic_tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('getTasks error:', error.message)
    return []
  }

  return data ?? []
}

export async function updateTaskStatus(id: string, status: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('academic_tasks')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/academics')
  return { success: true }
}
