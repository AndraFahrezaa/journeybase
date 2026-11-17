
import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet'
import { getDestinations } from '../lib/destinationsApi'
import { getPlaces } from '../lib/placesApi'
import { LocateFixed } from 'lucide-react'

type Destination = {
  id: string
  name: string
  city_region: string | null
  latitude: number | null
  longitude: number | null
  status: 'wishlist' | 'visited'
  photo_url: string | null
  countries: { name: string } | null
}

type Place = {
  id: string
  name: string
  city: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
  photo_url: string | null
  countries: { name: string } | null
}

function FitMapToMarkers({
  destinations,
  places,
}: {
  destinations: Destination[]
  places: Place[]
}) {
  const map = useMap()

  useEffect(() => {
    const points: [number, number][] = []

    destinations.forEach((item) => {
      if (item.latitude !== null && item.longitude !== null) {
        points.push([item.latitude, item.longitude])
      }
    })

    places.forEach((item) => {
      if (item.latitude !== null && item.longitude !== null) {
        points.push([item.latitude, item.longitude])
      }
    })

    if (points.length > 0) {
      map.fitBounds(points, {
        padding: [40, 40],
        maxZoom: 10,
      })
    }
  }, [map, destinations, places])

  return null
}

function MapResetButton({
  destinations,
  places,
}: {
  destinations: Destination[]
  places: Place[]
}) {
  const map = useMap()

  function handleReset() {
    const points: [number, number][] = [
      ...destinations
        .filter((item) => item.latitude !== null && item.longitude !== null)
        .map((item) => [item.latitude!, item.longitude!] as [number, number]),
      ...places
        .filter((item) => item.latitude !== null && item.longitude !== null)
        .map((item) => [item.latitude!, item.longitude!] as [number, number]),
    ]

    if (points.length > 0) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 10 })
    } else {
      map.setView([-2.5, 118], 5)
    }
  }

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <button
          type="button"
          onClick={handleReset}
          title="Reset tampilan peta"
          className="flex h-10 w-10 items-center justify-center bg-white text-[#244C3A] hover:bg-gray-100"
        >
          <LocateFixed size={19} />
        </button>
      </div>
    </div>
  )
}

export default function MapPage() {
  const [destinations, setDestinations] = useState<Destination[]>([])
    const [places, setPlaces] = useState<Place[]>([])
      const [activeFilters, setActiveFilters] = useState({
    wishlist: true,
    visited: true,
    places: true,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [destinationData, placeData] = await Promise.all([
  getDestinations(),
  getPlaces(),
])

setDestinations(destinationData as unknown as Destination[])
setPlaces(placeData as unknown as Place[])
      } catch {
        setError('Gagal mengambil data lokasi.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const mappedDestinations = destinations.filter(
    (item) => item.latitude !== null && item.longitude !== null
  )
  const mappedPlaces = places.filter(
  (item) => item.latitude !== null && item.longitude !== null
)
const visibleDestinations = mappedDestinations.filter(
  (item) => activeFilters[item.status]
)

const visiblePlaces = activeFilters.places
  ? mappedPlaces
  : []

  if (loading) {
    return <p className="py-12 text-center text-sm text-gray-500">Memuat peta...</p>
  }

  if (error) {
    return <p className="rounded-xl bg-red-50 p-5 text-sm text-red-600">{error}</p>
  }

  return (
    <section>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold">Jelajahi Peta</h2>
        <p className="mt-2 text-sm text-gray-500">
          {mappedDestinations.length + mappedPlaces.length} lokasi memiliki koordinat
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
  onClick={() =>
    setActiveFilters({
      wishlist: true,
      visited: true,
      places: true,
    })
  }
  className="rounded-xl border border-[#244C3A] bg-[#244C3A] px-4 py-2 text-sm font-semibold text-white"
>
  Tampilkan Semua
</button>
        <button
          onClick={() =>
            setActiveFilters((prev) => ({
              ...prev,
              wishlist: !prev.wishlist,
            }))
          }
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeFilters.wishlist
              ? 'bg-[#EFC94C] text-[#244C3A]'
              : 'bg-white text-gray-400 border border-gray-200'
          }`}
        >
          Wishlist
        </button>

        <button
          onClick={() =>
            setActiveFilters((prev) => ({
              ...prev,
              visited: !prev.visited,
            }))
          }
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeFilters.visited
              ? 'bg-[#6F9B79] text-white'
              : 'bg-white text-gray-400 border border-gray-200'
          }`}
        >
          Visited
        </button>

        <button
          onClick={() =>
            setActiveFilters((prev) => ({
              ...prev,
              places: !prev.places,
            }))
          }
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeFilters.places
              ? 'bg-[#3B82F6] text-white'
              : 'bg-white text-gray-400 border border-gray-200'
          }`}
        >
          Places
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e9e5da] bg-white">
<MapContainer
  center={[-2.5, 118]}
  zoom={5}
  scrollWheelZoom
  style={{ height: '600px', width: '100%' }}
>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
<FitMapToMarkers
  destinations={visibleDestinations}
  places={visiblePlaces}
/>
<MapResetButton
  destinations={visibleDestinations}
  places={visiblePlaces}
/>
          {visibleDestinations.map((item) => (
            <CircleMarker
              key={item.id}
              center={[item.latitude!, item.longitude!]}
              radius={9}
              pathOptions={{
                color: item.status === 'wishlist' ? '#D6A928' : '#244C3A',
                fillColor: item.status === 'wishlist' ? '#EFC94C' : '#6F9B79',
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <div className="min-w-36">
                  {item.photo_url && (
                    <img
                      src={item.photo_url}
                      alt={item.name}
                      className="mb-2 h-24 w-full rounded-lg object-cover"
                    />
                  )}
                  <strong>{item.name}</strong>
                  <p className="text-xs">
                    {[item.city_region, item.countries?.name]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p className="mt-1 text-xs font-semibold">
                    {item.status === 'wishlist' ? 'Wishlist' : 'Visited'}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {visiblePlaces.map((item) => (
            <CircleMarker
              key={`place-${item.id}`}
              center={[item.latitude!, item.longitude!]}
              radius={9}
              pathOptions={{
                color: '#2563EB',
                fillColor: '#3B82F6',
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <div className="min-w-36">
                  {item.photo_url && (
                    <img
                      src={item.photo_url}
                      alt={item.name}
                      className="mb-2 h-24 w-full rounded-lg object-cover"
                    />
                  )}
                  <strong>{item.name}</strong>
                  <p className="text-xs">
                    {[item.address, item.city, item.countries?.name]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-blue-600">
                    Places
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        </MapContainer>
      </div>


<div className="mt-4 flex flex-wrap gap-5 text-sm">
  <span className="flex items-center gap-2">
    <span className="h-3 w-3 rounded-full bg-[#EFC94C]" />
    Wishlist ({visibleDestinations.filter(
      (item) => item.status === 'wishlist'
    ).length})
  </span>

  <span className="flex items-center gap-2">
    <span className="h-3 w-3 rounded-full bg-[#6F9B79]" />
    Visited ({visibleDestinations.filter(
      (item) => item.status === 'visited'
    ).length})
  </span>

  <span className="flex items-center gap-2">
    <span className="h-3 w-3 rounded-full bg-[#3B82F6]" />
    Places ({visiblePlaces.length})
  </span>
</div>

    </section>
  )
}
