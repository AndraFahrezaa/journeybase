
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
import { LatLngBounds } from 'leaflet'

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

function getMapPoints(
  destinations: Destination[],
  places: Place[]
): [number, number][] {
  return [
    ...destinations
      .filter(
        (item) => item.latitude !== null && item.longitude !== null
      )
      .map(
        (item) => [item.latitude!, item.longitude!] as [number, number]
      ),
    ...places
      .filter(
        (item) => item.latitude !== null && item.longitude !== null
      )
      .map(
        (item) => [item.latitude!, item.longitude!] as [number, number]
      ),
  ]
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
    const points = getMapPoints(destinations, places)

    if (points.length === 1) {
      map.setView(points[0], 10, { animate: true })
    } else if (points.length > 1) {
      const bounds = new LatLngBounds(points)
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 10,
        animate: true,
      })
    } else {
      map.setView([-2.5, 118], 5, { animate: true })
    }
  }, [map, destinations, places])

  return null
}

function MapResizeHandler() {
  const map = useMap()

  useEffect(() => {
    let frame = 0

    const invalidate = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        map.invalidateSize({
          pan: false,
          animate: false,
        })
      })
    }

    invalidate()

    const container = map.getContainer()
    const observer = new ResizeObserver(invalidate)

    observer.observe(container)

    window.addEventListener('resize', invalidate)
    window.addEventListener('orientationchange', invalidate)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', invalidate)
      window.removeEventListener('orientationchange', invalidate)
    }
  }, [map])

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
    const points = getMapPoints(destinations, places)

    if (points.length === 1) {
      map.setView(points[0], 10, { animate: true })
    } else if (points.length > 1) {
      map.fitBounds(new LatLngBounds(points), {
        padding: [40, 40],
        maxZoom: 10,
        animate: true,
      })
    } else {
      map.setView([-2.5, 118], 5, { animate: true })
    }
  }

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <button
          type="button"
          onClick={handleReset}
          title="Reset tampilan peta"
          aria-label="Reset tampilan peta"
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
    let mounted = true

    async function loadData() {
      try {
        const [destinationData, placeData] = await Promise.all([
          getDestinations(),
          getPlaces(),
        ])

        if (mounted) {
          setDestinations(destinationData as unknown as Destination[])
          setPlaces(placeData as unknown as Place[])
        }
      } catch (err) {
        console.error('Map loading error:', err)

        if (mounted) {
          setError('Gagal mengambil data lokasi.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
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

  const visiblePlaces = activeFilters.places ? mappedPlaces : []

  const visiblePoints = getMapPoints(
    visibleDestinations,
    visiblePlaces
  )

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#e9e5da] bg-white text-sm text-gray-500">
        Memuat peta...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-5 text-sm text-red-600">
        {error}
      </div>
    )
  }

  return (
    <section className="min-w-0 w-full space-y-5">
      <div>
        <h2 className="font-heading text-2xl font-bold">
          Jelajahi Peta
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {mappedDestinations.length + mappedPlaces.length} lokasi memiliki koordinat
        </p>
      </div>

      {/* FILTER */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            setActiveFilters({
              wishlist: true,
              visited: true,
              places: true,
            })
          }
          className="rounded-xl border border-[#244C3A] bg-[#244C3A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#315d48]"
        >
          Tampilkan Semua
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveFilters((prev) => ({
              ...prev,
              wishlist: !prev.wishlist,
            }))
          }
          aria-pressed={activeFilters.wishlist}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeFilters.wishlist
              ? 'bg-[#EFC94C] text-[#244C3A]'
              : 'border border-gray-200 bg-white text-gray-400'
          }`}
        >
          Wishlist
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveFilters((prev) => ({
              ...prev,
              visited: !prev.visited,
            }))
          }
          aria-pressed={activeFilters.visited}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeFilters.visited
              ? 'bg-[#6F9B79] text-white'
              : 'border border-gray-200 bg-white text-gray-400'
          }`}
        >
          Visited
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveFilters((prev) => ({
              ...prev,
              places: !prev.places,
            }))
          }
          aria-pressed={activeFilters.places}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeFilters.places
              ? 'bg-[#3B82F6] text-white'
              : 'border border-gray-200 bg-white text-gray-400'
          }`}
        >
          Places
        </button>
      </div>

      {/* MAP */}
      <div className="relative isolate z-0 h-[420px] w-full min-w-0 overflow-hidden rounded-2xl border border-[#e9e5da] bg-[#e8eee7] sm:h-[520px] lg:h-[600px]">
        <MapContainer
          center={[-2.5, 118]}
          zoom={5}
          minZoom={3}
          maxZoom={18}
          scrollWheelZoom
          className="!h-full !w-full"
          style={{
            height: '100%',
            width: '100%',
            minHeight: '100%',
            minWidth: '100%',
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapResizeHandler />

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
                color:
                  item.status === 'wishlist' ? '#D6A928' : '#244C3A',
                fillColor:
                  item.status === 'wishlist' ? '#EFC94C' : '#6F9B79',
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

        {visiblePoints.length === 0 && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-[400] -translate-x-1/2 rounded-xl bg-white/95 px-4 py-2 text-center text-xs text-gray-600 shadow">
            Tidak ada lokasi pada filter ini
          </div>
        )}
      </div>


      {/* LEGEND */}
      <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#EFC94C]" />
          Wishlist (
          {visibleDestinations.filter(
            (item) => item.status === 'wishlist'
          ).length}
          )
        </span>

        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#6F9B79]" />
          Visited (
          {visibleDestinations.filter(
            (item) => item.status === 'visited'
          ).length}
          )
        </span>

        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#3B82F6]" />
          Places ({visiblePlaces.length})
        </span>
      </div>
    </section>
  )
}
