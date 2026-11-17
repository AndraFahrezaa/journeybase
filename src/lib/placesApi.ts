
import { supabase } from './supabase'

export type Place = {
  id: string
  name: string
  country_id: string | null
  province_id: string | null
  city: string | null
  address: string | null
  description: string | null
  photo_url: string | null
  latitude: number | null
  longitude: number | null
  visited_at: string | null
  created_at: string
  countries: { name: string } | null
  provinces: { name: string } | null
}

export async function getPlaces() {
  const { data, error } = await supabase
    .from('places')
    .select(`
      id,
      name,
      country_id,
      province_id,
      city,
      address,
      description,
      photo_url,
      latitude,
      longitude,
      visited_at,
      created_at,
      countries(name),
      provinces(name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Gagal mengambil Places:', error.message)
    throw error
  }

  return (data ?? []) as unknown as Place[]
}
