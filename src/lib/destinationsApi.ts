
import { supabase } from './supabase'

export async function getDestinations(status?: 'wishlist' | 'visited') {
  let query = supabase
    .from('destinations')
    .select(`
id,
name,
country_id,
province_id,
city_region,
description,
photo_url,
latitude,
longitude,
status,
      countries(name),
      provinces(name)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Gagal mengambil destinasi:', error.message)
    throw error
  }

  return data
}
