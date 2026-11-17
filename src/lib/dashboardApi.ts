
import { supabase } from './supabase'

export async function getDashboardStats() {
  const [wishlist, visited, places] = await Promise.all([
    supabase
      .from('destinations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'wishlist'),

    supabase
      .from('destinations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'visited'),

    supabase
      .from('places')
      .select('*', { count: 'exact', head: true }),
  ])

  if (wishlist.error) throw wishlist.error
  if (visited.error) throw visited.error
  if (places.error) throw places.error

  return {
    wishlist: wishlist.count ?? 0,
    visited: visited.count ?? 0,
    places: places.count ?? 0,
  }
}
