
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
} from 'lucide-react'
import { supabase } from '../lib/supabase'

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

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true)
      else setLoading(true)

      setError('')

      const [wishlistCount, visitedCount, placesCount] =
        await Promise.all([
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
        ])

      if (wishlistCount.error) throw wishlistCount.error
      if (visitedCount.error) throw visitedCount.error
      if (placesCount.error) throw placesCount.error

      setStats({
        wishlist: wishlistCount.count ?? 0,
        visited: visitedCount.count ?? 0,
        places: placesCount.count ?? 0,
      })
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

  const statCards = [
    {
      label: 'Wishlist',
      value: stats.wishlist,
      icon: Heart,
      color: 'bg-[#fbf1df] text-[#c18c32]',
      page: 'Wishlist',
    },
    {
      label: 'Visited',
      value: stats.visited,
      icon: CheckCircle2,
      color: 'bg-[#e8f0e7] text-[#477b50]',
      page: 'Visited',
    },
    {
      label: 'Places',
      value: stats.places,
      icon: MapPin,
      color: 'bg-[#e8edf5] text-[#5478aa]',
      page: 'Places',
    },
  ]

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Memuat Dashboard JOURNEYBASE...
      </div>
    )
  }

  return (
    <section className="min-w-0 space-y-5 sm:space-y-6">

      {/* EXPLORE THE WORLD */}
      <div className="relative overflow-hidden rounded-2xl bg-[#244C3A] p-5 text-white sm:p-7">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-4 h-28 w-28 rounded-full border border-white/10" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/60 sm:text-sm">
              {today}
            </p>

            <h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
              Explore the World.
            </h2>

            <p className="mt-2 max-w-md text-xs leading-relaxed text-white/70 sm:text-sm">
              Simpan destinasi impianmu dan temukan berbagai tempat menarik di dunia.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-white/90 sm:text-sm">
              Your World, Your Journey.
              <Plane size={16} />
            </div>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 sm:h-14 sm:w-14">
            <Compass size={25} className="sm:hidden" />
            <Compass size={30} className="hidden sm:block" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          aria-label="Refresh dashboard"
          className="absolute bottom-5 right-5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50 sm:bottom-7 sm:right-7"
        >
          <RefreshCw
            size={16}
            className={refreshing ? 'animate-spin' : ''}
          />
        </button>
      </div>

      {/* ERROR */}
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

      {/* STAT CARDS */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon

          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onNavigate(card.page)}
              className="group flex min-w-0 flex-col rounded-xl border border-[#e9e5da] bg-white p-3 text-left transition duration-200 hover:border-[#a8b9a0] hover:shadow-md sm:rounded-2xl sm:p-5"
            >
              <div className="flex w-full items-center justify-between gap-1">
                <p className="truncate text-[11px] font-medium text-gray-500 sm:text-sm">
                  {card.label}
                </p>

                <div className={`shrink-0 rounded-lg p-1.5 sm:rounded-xl sm:p-2.5 ${card.color}`}>
                  <Icon size={15} className="sm:hidden" />
                  <Icon size={20} className="hidden sm:block" />
                </div>
              </div>

              <div className="mt-3 flex w-full items-center justify-between gap-1 sm:mt-5">
                <p className="font-heading text-2xl font-bold sm:text-3xl">
                  {card.value}
                </p>

                <ArrowUpRight
                  size={15}
                  className="shrink-0 text-gray-300 transition group-hover:text-[#477b50]"
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* PROGRESS PERJALANAN */}
      <div className="rounded-2xl border border-[#e9e5da] bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f0e7] text-[#477b50]">
            <TrendingUp size={21} />
          </div>

          <div className="min-w-0">
            <h3 className="font-heading font-bold">
              Progres Perjalanan
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Perjalanan dari Wishlist menuju Visited
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between gap-3">
          <p className="font-heading text-4xl font-bold sm:text-5xl">
            {progress}%
          </p>

          <p className="text-right text-xs text-gray-500 sm:text-sm">
            {stats.visited} dari {totalDestinations} destinasi
          </p>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#edf0e8]">
          <div
            className="h-full rounded-full bg-[#477b50] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#c18c32]" />
            Wishlist: {stats.wishlist}
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#477b50]" />
            Visited: {stats.visited}
          </span>
        </div>
      </div>

    </section>
  )
}
