import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarClient from '@/components/CalendarClient'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: members } = await supabase
    .from('team_members')
    .select('*')
    .order('name')

  return <CalendarClient user={user} initialMembers={members || []} />
}
