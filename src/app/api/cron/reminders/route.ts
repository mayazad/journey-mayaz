import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  // Prevent unauthorized execution except from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch pending tasks due within the next 48 hours
    const now = new Date()
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const { data: tasks, error } = await supabase
      .from('academic_tasks')
      .select('*, profiles(callmebot_phone, callmebot_api_key)')
      .eq('status', 'pending')
      .lte('due_date', in48Hours.toISOString())
      .gte('due_date', now.toISOString())
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Supabase error fetching tasks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ message: 'No urgent tasks found. No reminders sent.' })
    }

    // 2. Group tasks by user_id
    const tasksByUser: Record<string, {
      phone: string;
      apiKey: string;
      tasks: typeof tasks;
    }> = {}

    tasks.forEach(task => {
      const profile = Array.isArray(task.profiles) ? task.profiles[0] : task.profiles;
      const phone = profile?.callmebot_phone
      const apiKey = profile?.callmebot_api_key
      
      // If the user hasn't configured WhatsApp, we skip sending them a reminder
      if (!phone || !apiKey) return

      if (!tasksByUser[task.user_id]) {
        tasksByUser[task.user_id] = { phone, apiKey, tasks: [] }
      }
      tasksByUser[task.user_id].tasks.push(task)
    })

    let totalSent = 0

    // 3. Send WhatsApp messages for each user who has it configured
    for (const userId of Object.keys(tasksByUser)) {
      const userGroup = tasksByUser[userId]
      let message = '🚨 *Academic Reminder*\n\nYou have tasks due soon:\n\n'
      
      userGroup.tasks.forEach((task, idx) => {
        const dueDate = new Date(task.due_date).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
        message += `${idx + 1}. *${task.title}* (${task.type})\nDue: ${dueDate}\n\n`
      })
      
      message += 'Mark them as done in your dashboard to stop these reminders!'

      const url = `https://api.callmebot.com/whatsapp.php?phone=${userGroup.phone}&text=${encodeURIComponent(message)}&apikey=${userGroup.apiKey}`
      const res = await fetch(url)
      
      if (!res.ok) {
        console.error(`CallMeBot API failed for user ${userId}:`, await res.text())
      } else {
        totalSent++
      }
    }

    return NextResponse.json({ 
      message: `Reminders processed. Sent ${totalSent} individual WhatsApp messages.`, 
      total_urgent_tasks: tasks.length 
    })

  } catch (err: any) {
    console.error('Cron job error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
