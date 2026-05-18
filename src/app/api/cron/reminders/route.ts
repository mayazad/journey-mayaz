import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  // Prevent unauthorized execution except from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // We must use the service role key to bypass RLS since there is no active user session during a cron job.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch pending tasks due within the next 48 hours
    const now = new Date()
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const { data: tasks, error } = await supabase
      .from('academic_tasks')
      .select('*')
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

    // Prepare WhatsApp message
    let message = '🚨 *Academic Reminder*\n\nYou have tasks due soon:\n\n'
    tasks.forEach((task, idx) => {
      const dueDate = new Date(task.due_date).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      message += `${idx + 1}. *${task.title}* (${task.type})\nDue: ${dueDate}\n\n`
    })
    
    message += 'Mark them as done in your dashboard to stop these reminders!'

    // Send via CallMeBot API if credentials exist
    const phone = process.env.CALLMEBOT_PHONE
    const apiKey = process.env.CALLMEBOT_API_KEY

    if (phone && apiKey) {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`
      const res = await fetch(url)
      if (!res.ok) {
        console.error('CallMeBot API failed:', await res.text())
        return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 })
      }
      return NextResponse.json({ message: 'Reminder sent successfully!', tasks: tasks.length })
    } else {
      console.warn('CallMeBot credentials missing in environment variables.')
      return NextResponse.json({ message: 'Tasks found, but no CallMeBot credentials configured.', tasks: tasks.length })
    }

  } catch (err: any) {
    console.error('Cron job error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
