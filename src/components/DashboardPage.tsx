
import { useCallback, useEffect, useState } from 'react'
import {
  Heart,
  CheckCircle2,
  MapPin,
  Compass,
  Plane,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  CalendarDays,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Destination = {
  id: string
  name: string
  city_region: string | null
  photo_url: string | null
  status: 'wishlist' | 'visited'
  created_at: string
  countries: { name: string }[] | null
}

type Place = {
  id: string
  name: string
  city: string | null
  photo_url: string | null
  visited_at: string | null
  countries: { name: string }[] | null
}

type Stats = {
  wishlist: number
  visited: number
  places: number
}

type DashboardPageProps = {
  onNavigate: (page: string) => void
}

export default function DashboardPage({
  onNavigate,
}: DashboardPageProps) {
  const [stats, setStats] = useState<Stats>({
    wishlist: 0,
    visited: 0,
    places: 0,
  })

  const [wishlist, setWishlist] = useState<Destination[]>([])
  const [visited, setVisited] = useState<Destination[]>([])
  const [recentPlaces, setRecentPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true)
      else setLoading(true)

      setError('')

      const [
        wishlistCount,
        visitedCount,
        placesCount,
        wishlistData,
        visitedData,
        placesData,
      ] = await Promise.all([
        supabase
          .from('destinations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'wishlist'),

        supabase
          .from('destinations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'visited'),

        supabase
          .from('places')
          .select('id', { count: 'exact', head: true }),

        supabase
          .from('destinations')
          .select('id, name, city_region, photo_url, status, created_at, countries(name)')
          .eq('status', 'wishlist')
          .order('created_at', { ascending: false })
          .limit(4),

        supabase
          .from('destinations')
          .select('id, name, city_region, photo_url, status, created_at, countries(name)')
          .eq('status', 'visited')
          .order('created_at', { ascending: false })
          .limit(4),

        supabase
          .from('places')
          .select('id, name, city, photo_url, visited_at, countries(name)')
          .order('created_at', { ascending: false })
          .limit(4),
      ])

      if (wishlistCount.error) throw wishlistCount.error
      if (visitedCount.error) throw visitedCount.error
      if (placesCount.error) throw placesCount.error
      if (wishlistData.error) throw wishlistData.error
      if (visitedData.error) throw visitedData.error
      if (placesData.error) throw placesData.error

      setStats({
        wishlist: wishlistCount.count ?? 0,
        visited: visitedCount.count ?? 0,
        places: placesCount.count ?? 0,
      })

      setWishlist((wishlistData.data ?? []) as Destination[])
      setVisited((visitedData.data ?? []) as Destination[])
      setRecentPlaces((placesData.data ?? []) as Place[])
    } catch (err) {
      console.error('Dashboard error:', err)
      setError('Gagal mengambil data Dashboard. Silakan coba lagi.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const totalDestinations = stats.wishlist + stats.visited

  const progress =
    totalDestinations > 0
      ? Math.round((stats.visited / totalDestinations) * 100)
      : 0

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Memuat Dashboard JOURNEYBASE...
      </div>
    )
  }

  const statCards = [
    {
      label: 'Wishlist',
      value: stats.wishlist,
      icon: Heart,
      color: 'bg-[#fbf1df] text-[#c18c32]',
      page: 'Wishlist',
      description: 'Lihat destinasi impianmu',
    },
    {
      label: 'Visited',
      value: stats.visited,
      icon: CheckCircle2,
      color: 'bg-[#e8f0e7] text-[#477b50]',
      page: 'Visited',
      description: 'Lihat destinasi yang dikunjungi',
    },
    {
      label: 'Places',
      value: stats.places,
      icon: MapPin,
      color: 'bg-[#e8edf5] text-[#5478aa]',
      page: 'Places',
      description: 'Lihat tempat yang tersimpan',
    },
  ]

  const itemClass =
    'group flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-[#f7f7f2]'

  return (
    <section className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#8a927f]">
            {today}
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
            Your Journey Awaits.
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Setiap perjalanan dimulai dari satu destinasi.
          </p>
        </div>

        <button
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-[#e9e5da] bg-white px-4 py-3 text-sm font-semibold transition hover:bg-[#f5f4ef] disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? 'animate-spin' : ''}
          />
          {refreshing ? 'Memperbarui...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button
            onClick={() => loadDashboard(true)}
            className="font-semibold underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon

          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onNavigate(card.page)}
              className="group rounded-2xl border border-[#e9e5da] bg-white p-5 text-left transition duration-200 hover:-translate-y-1 hover:border-[#a8b9a0] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#477b50] focus:ring-offset-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{card.label}</p>
                <div className="flex items-center gap-2">
                  <div className={`rounded-xl p-3 ${card.color}`}>
                    <Icon size={21} />
                  </div>
                  <ArrowUpRight
                    size={17}
                    className="text-gray-300 transition group-hover:text-[#477b50]"
                  />
                </div>
              </div>

              <p className="mt-4 font-heading text-3xl font-bold">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {card.description}
              </p>
            </button>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#e9e5da] bg-white p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#e8f0e7] p-3 text-[#477b50]">
              <TrendingUp size={21} />
            </div>
            <div>
              <h3 className="font-heading font-bold">
                Progress Perjalanan
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Perjalanan dari Wishlist menuju Visited
              </p>
            </div>
          </div>

          <div className="mt-7 flex items-end justify-between gap-3">
            <p className="font-heading text-4xl font-bold">
              {progress}%
            </p>
            <p className="text-right text-sm text-gray-500">
              {stats.visited} dari {totalDestinations} destinasi
            </p>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#edf0e8]">
            <div
              className="h-full rounded-full bg-[#477b50] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-5 flex justify-between text-xs text-gray-500">
            <span>Wishlist: {stats.wishlist}</span>
            <span>Visited: {stats.visited}</span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-[#244C3A] p-6 text-white">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <Compass size={23} />
            </div>
            <h3 className="mt-5 font-heading text-xl font-bold">
              Explore the World
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Simpan destinasi impianmu dan temukan berbagai tempat menarik di dunia.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm font-semibold">
            Your World, Your Journey.
            <Plane size={17} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#e9e5da] bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold">
                Wishlist Terbaru
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                Destinasi yang ingin kamu kunjungi
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('Wishlist')}
              className="flex items-center gap-1 text-xs font-semibold text-[#477b50] hover:underline"
            >
              Lihat semua <ArrowUpRight size={14} />
            </button>
          </div>

          {wishlist.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Belum ada destinasi Wishlist.
            </p>
          ) : (
            <div className="space-y-2">
              {wishlist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate('Wishlist')}
                  className={itemClass}
                >
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt={item.name}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#edf0e8]">
                      <MapPin size={20} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {item.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {[item.city_region, item.countries?.[0]?.name]
                        .filter(Boolean)
                        .join(', ') || 'Lokasi belum diisi'}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={17}
                    className="shrink-0 text-gray-300 transition group-hover:text-[#477b50]"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#e9e5da] bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold">
                Terakhir Dikunjungi
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                Destinasi dengan status Visited
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('Visited')}
              className="flex items-center gap-1 text-xs font-semibold text-[#477b50] hover:underline"
            >
              Lihat semua <ArrowUpRight size={14} />
            </button>
          </div>

          {visited.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Belum ada destinasi yang dikunjungi.
            </p>
          ) : (
            <div className="space-y-2">
              {visited.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate('Visited')}
                  className={itemClass}
                >
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt={item.name}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#edf0e8]">
                      <MapPin size={20} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {item.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {[item.city_region, item.countries?.[0]?.name]
                        .filter(Boolean)
                        .join(', ') || 'Lokasi belum diisi'}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={17}
                    className="shrink-0 text-gray-300 transition group-hover:text-[#477b50]"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#e9e5da] bg-white p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold">
              Places Terbaru
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              Tempat menarik yang pernah kamu simpan
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('Places')}
            className="flex items-center gap-1 text-xs font-semibold text-[#477b50] hover:underline"
          >
            Lihat semua <ArrowUpRight size={14} />
          </button>
        </div>

        {recentPlaces.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            Belum ada Places.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {recentPlaces.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => onNavigate('Places')}
                className={itemClass}
              >
                {place.photo_url ? (
                  <img
                    src={place.photo_url}
                    alt={place.name}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#edf0e8]">
                    <MapPin size={20} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {place.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-400">
                    {[place.city, place.countries?.[0]?.name]
                      .filter(Boolean)
                      .join(', ') || 'Lokasi belum diisi'}
                  </p>
                  {place.visited_at && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                      <CalendarDays size={11} />
                      {place.visited_at.slice(0, 10)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
