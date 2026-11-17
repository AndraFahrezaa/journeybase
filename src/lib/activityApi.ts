
import { supabase } from './supabase'

export type Activity = {
  id: string
  action: 'created' | 'updated' | 'status_changed' | 'deleted'
  entity_type: 'destination' | 'place'
  entity_id: string | null
  entity_name: string
  description: string | null
  created_at: string
}

export async function getActivities() {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Gagal mengambil riwayat aktivitas:', error.message)
    throw error
  }

  return (data ?? []) as Activity[]
}
