
import { getDestinations } from './destinationsApi'
import { getPlaces } from './placesApi'

export type SearchResult = {
  id: string
  name: string
  subtitle: string
  type: 'destination' | 'place'
  status?: 'wishlist' | 'visited'
}

function relationName(
  relation:
    | { name: string }[]
    | { name: string }
    | null
) {
  if (Array.isArray(relation)) return relation[0]?.name ?? ''
  return relation?.name ?? ''
}

export async function getGlobalSearchResults(): Promise<SearchResult[]> {
  const [destinations, places] = await Promise.all([
    getDestinations(),
    getPlaces(),
  ])

  const destinationResults: SearchResult[] = (destinations ?? []).map(
    (item: any) => ({
      id: item.id,
      name: item.name,
      subtitle: [
        item.city_region,
        relationName(item.provinces),
        relationName(item.countries),
      ].filter(Boolean).join(', ') || 'Destinasi',
      type: 'destination',
      status: item.status,
    })
  )

  const placeResults: SearchResult[] = (places ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    subtitle: [
      item.city,
      relationName(item.provinces),
      relationName(item.countries),
    ].filter(Boolean).join(', ') || 'Places',
    type: 'place',
  }))

  return [...destinationResults, ...placeResults]
}
