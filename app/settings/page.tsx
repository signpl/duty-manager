import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from '@/components/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: members } = await supabase
    .from('team_members')
    .select('*')
    .order('name')

  return <SettingsClient user={user} initialMembers={members || []} />
}
