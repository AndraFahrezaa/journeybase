
import { useCallback, useEffect, useState } from 'react'
import {
  Globe2,
  Heart,
  CheckCircle2,
  MapPin,
  Plane,
  TrendingUp,
  RefreshCw,
  BarChart3,
  Trophy,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Stats = {
  wishlist: number
  visited: number
  places: number
  countries: number
}

type CountryStat = {
  name: string
  count: number
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<Stats>({
    wishlist: 0,
    visited: 0,
    places: 0,
    countries: 0,
  })

  const [countryStats, setCountryStats] = useState<CountryStat[]>([])
  const [placeCountryStats, setPlaceCountryStats] = useState<CountryStat[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadStatistics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      const [wishlist, visited, places, countries, placeCountries] =
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

          supabase
            .from('destinations')
            .select('country_id, countries(name)')
            .eq('status', 'visited'),

          supabase
            .from('places')
            .select('id, country_id, countries(name)'),
        ])

      if (wishlist.error) throw wishlist.error
      if (visited.error) throw visited.error
      if (places.error) throw places.error
      if (countries.error) throw countries.error
      if (placeCountries.error) throw placeCountries.error

      const groupedCountries: Record<string, number> = {}

      ;(countries.data ?? []).forEach((destination: any) => {
        const countryName = destination.countries?.name

        if (countryName) {
          groupedCountries[countryName] =
            (groupedCountries[countryName] ?? 0) + 1
        }
      })

      const sortedCountries = Object.entries(groupedCountries)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      const groupedPlaceCountries: Record<string, number> = {}

      ;(placeCountries.data ?? []).forEach((place: any) => {
        const countryName = place.countries?.name

        if (countryName) {
          groupedPlaceCountries[countryName] =
            (groupedPlaceCountries[countryName] ?? 0) + 1
        }
      })

      const sortedPlaceCountries = Object.entries(groupedPlaceCountries)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      setStats({
        wishlist: wishlist.count ?? 0,
        visited: visited.count ?? 0,
        places: places.count ?? 0,
        countries: sortedCountries.length,
      })

      setCountryStats(sortedCountries)
      setPlaceCountryStats(sortedPlaceCountries)
    } catch (err) {
      console.error('Gagal mengambil statistik:', err)
      setError('Gagal mengambil data statistik. Silakan coba lagi.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadStatistics()
  }, [loadStatistics])

  const totalDestinations = stats.wishlist + stats.visited

  const progress =
    totalDestinations > 0
      ? Math.round((stats.visited / totalDestinations) * 100)
      : 0

  const totalPlacesByCountry = placeCountryStats.reduce(
    (total, country) => total + country.count,
    0
  )

  const topPlaceCountry = placeCountryStats[0]

  const cards = [
    {
      label: 'Wishlist',
      value: stats.wishlist,
      icon: Heart,
      color: 'bg-[#fbf1df] text-[#c18c32]',
    },
    {
      label: 'Visited',
      value: stats.visited,
      icon: CheckCircle2,
      color: 'bg-[#e8f0e7] text-[#477b50]',
    },
    {
      label: 'Places',
      value: stats.places,
      icon: MapPin,
      color: 'bg-[#e8edf5] text-[#5478aa]',
    },
    {
      label: 'Negara Dikunjungi',
      value: stats.countries,
      icon: Globe2,
      color: 'bg-[#eeeaf5] text-[#8066a7]',
    },
  ]

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Memuat statistik perjalanan...
      </div>
    )
  }

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">
            Statistik Perjalanan
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Lihat perkembangan dan pencapaian perjalananmu.
          </p>
        </div>

        <button
          onClick={() => loadStatistics(true)}
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
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600">
          <span>{error}</span>
          <button
            onClick={() => loadStatistics(true)}
            className="font-semibold underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-[#e9e5da] bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{card.label}</p>
                <div className={`rounded-xl p-3 ${card.color}`}>
                  <Icon size={21} />
                </div>
              </div>

              <p className="mt-4 font-heading text-3xl font-bold">
                {card.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* PROGRESS AND DESTINATION COUNTRIES */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e9e5da] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#e8f0e7] p-3 text-[#477b50]">
              <TrendingUp size={21} />
            </div>
            <div>
              <h3 className="font-heading font-bold">
                Progress Perjalanan
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Destinasi yang sudah dikunjungi
              </p>
            </div>
          </div>

          <div className="mt-7 flex items-end justify-between">
            <p className="font-heading text-4xl font-bold">
              {progress}%
            </p>
            <p className="text-sm text-gray-500">
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

        <div className="rounded-2xl border border-[#e9e5da] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#f3eee4] p-3 text-[#8a7655]">
              <Plane size={21} />
            </div>
            <div>
              <h3 className="font-heading font-bold">
                Negara Dikunjungi
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Berdasarkan destinasi berstatus Visited
              </p>
            </div>
          </div>

          {countryStats.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              Belum ada negara yang dikunjungi.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {countryStats.map((country) => (
                <div key={country.name}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium">{country.name}</span>
                    <span className="text-gray-500">
                      {country.count} destinasi
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-[#edf0e8]">
                    <div
                      className="h-full rounded-full bg-[#244C3A]"
                      style={{
                        width: `${
                          (country.count /
                            Math.max(
                              ...countryStats.map((item) => item.count)
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PLACES BY COUNTRY */}
      <div className="mt-6 rounded-2xl border border-[#e9e5da] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#e8edf5] p-3 text-[#5478aa]">
              <BarChart3 size={21} />
            </div>
            <div>
              <h3 className="font-heading font-bold">
                Statistik Places per Negara
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Sebaran tempat yang sudah kamu simpan berdasarkan negara
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">Total Places dengan negara</p>
            <p className="font-heading text-2xl font-bold">
              {totalPlacesByCountry}
            </p>
          </div>
        </div>

        {placeCountryStats.length === 0 ? (
          <div className="py-12 text-center">
            <Globe2 size={35} className="mx-auto text-[#b8b9a9]" />
            <p className="mt-3 text-sm font-medium text-gray-500">
              Belum ada data Places berdasarkan negara.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Pastikan Places sudah memiliki negara.
            </p>
          </div>
        ) : (
          <>
            {topPlaceCountry && (
              <div className="mt-6 flex items-center gap-3 rounded-xl bg-[#edf0e8] p-4">
                <div className="rounded-xl bg-white p-3 text-[#244C3A]">
                  <Trophy size={21} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    Negara dengan Places terbanyak
                  </p>
                  <p className="mt-1 font-semibold text-[#244C3A]">
                    {topPlaceCountry.name}
                  </p>
                </div>
                <p className="ml-auto font-heading text-xl font-bold text-[#244C3A]">
                  {topPlaceCountry.count}
                </p>
              </div>
            )}

            <div className="mt-7 space-y-5">
              {placeCountryStats.map((country) => {
                const percentage =
                  totalPlacesByCountry > 0
                    ? Math.round(
                        (country.count / totalPlacesByCountry) * 100
                      )
                    : 0

                return (
                  <div key={country.name}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {country.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {country.count} Places · {percentage}%
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-[#edf0e8]">
                      <div
                        className="h-full rounded-full bg-[#5478aa] transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
