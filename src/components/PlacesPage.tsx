
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MapPin,
  Search,
  CalendarDays,
  Compass,
  RefreshCw,
  Map,
  X,
  Globe2,
  Building2,
  Navigation,
  Image as ImageIcon,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react'
import { getPlaces, type Place } from '../lib/placesApi'

type SortOption = 'newest' | 'name-asc' | 'name-desc' | 'visited-newest' | 'visited-oldest'

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getPlaces()
      setPlaces(data)
    } catch {
      setError('Gagal mengambil data Places. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!selectedPlace) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedPlace(null)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [selectedPlace])

  const countries = useMemo(() => {
    return Array.from(
      new Set(
        places
          .map((place) => place.countries?.name)
          .filter((name): name is string => Boolean(name))
      )
    ).sort((a, b) => a.localeCompare(b, 'id'))
  }, [places])

  const filteredPlaces = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    const filtered = places.filter((place) => {
      const matchesSearch =
        !keyword ||
        [
          place.name,
          place.city,
          place.address,
          place.description,
          place.countries?.name,
          place.provinces?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(keyword)

      const matchesCountry =
        !selectedCountry || place.countries?.name === selectedCountry

      return matchesSearch && matchesCountry
    })

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name, 'id')

        case 'name-desc':
          return b.name.localeCompare(a.name, 'id')

        case 'visited-newest':
          return (b.visited_at || '').localeCompare(a.visited_at || '')

        case 'visited-oldest':
          return (a.visited_at || '9999-12-31').localeCompare(
            b.visited_at || '9999-12-31'
          )

        case 'newest':
        default:
          return (b.created_at || '').localeCompare(a.created_at || '')
      }
    })
  }, [places, search, selectedCountry, sortBy])

  function formatDate(date: string) {
    return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString(
      'id-ID',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    )
  }

  function resetFilters() {
    setSearch('')
    setSelectedCountry('')
    setSortBy('newest')
  }

  const hasActiveFilter = Boolean(
    search.trim() || selectedCountry || sortBy !== 'newest'
  )

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">Places</h2>
          <p className="mt-2 text-sm text-gray-500">
            Kumpulan tempat menarik yang pernah kamu kunjungi.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-[#e9e5da] bg-white px-4 py-3 text-sm font-semibold transition hover:bg-[#f5f4ef] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#e9e5da] bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Places</p>
              <p className="mt-2 font-heading text-3xl font-bold">
                {places.length}
              </p>
            </div>
            <div className="rounded-xl bg-[#edf0e8] p-3 text-[#244C3A]">
              <MapPin size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e9e5da] bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Hasil filter</p>
              <p className="mt-2 font-heading text-3xl font-bold">
                {filteredPlaces.length}
              </p>
            </div>
            <div className="rounded-xl bg-[#f3eee4] p-3 text-[#8a7655]">
              <Compass size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH, FILTER NEGARA, DAN SORTING */}
      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_220px_240px]">
        <div className="flex items-center gap-3 rounded-xl border border-[#e9e5da] bg-white px-4 py-3">
          <Search size={18} className="shrink-0 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tempat, kota, atau negara..."
            className="w-full bg-transparent text-sm outline-none"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-gray-400 transition hover:text-gray-700"
              aria-label="Hapus pencarian"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <div className="relative">
          <Globe2
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#244C3A]"
          />
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full appearance-none rounded-xl border border-[#e9e5da] bg-white py-3 pl-11 pr-10 text-sm outline-none transition focus:border-[#244C3A]"
          >
            <option value="">Semua Negara</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          <ChevronDown
            size={17}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>

        <div className="relative">
          <ArrowUpDown
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#244C3A]"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full appearance-none rounded-xl border border-[#e9e5da] bg-white py-3 pl-11 pr-10 text-sm outline-none transition focus:border-[#244C3A]"
          >
            <option value="newest">Terbaru ditambahkan</option>
            <option value="name-asc">Nama A–Z</option>
            <option value="name-desc">Nama Z–A</option>
            <option value="visited-newest">Kunjungan terbaru</option>
            <option value="visited-oldest">Kunjungan terlama</option>
          </select>
          <ChevronDown
            size={17}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      {hasActiveFilter && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            Filter aktif:

            {selectedCountry && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e5ebdf] px-3 py-1 font-semibold text-[#244C3A]">
                <Globe2 size={12} />
                {selectedCountry}
              </span>
            )}

            {search.trim() && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f3eee4] px-3 py-1 font-semibold text-[#8a7655]">
                <Search size={12} />
                {search}
              </span>
            )}

            {sortBy !== 'newest' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#edf0e8] px-3 py-1 font-semibold text-[#244C3A]">
                <ArrowUpDown size={12} />
                {sortBy === 'name-asc'
                  ? 'Nama A–Z'
                  : sortBy === 'name-desc'
                    ? 'Nama Z–A'
                    : sortBy === 'visited-newest'
                      ? 'Kunjungan terbaru'
                      : 'Kunjungan terlama'}
              </span>
            )}
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-[#244C3A] transition hover:underline"
          >
            <X size={14} />
            Reset filter
          </button>
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-500">
          Memuat Places...
        </p>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-5 text-sm text-red-600">
          <p>{error}</p>
          <button
            onClick={loadData}
            className="mt-3 font-semibold underline"
          >
            Coba lagi
          </button>
        </div>
      ) : filteredPlaces.length === 0 ? (
        <div className="rounded-2xl border border-[#e9e5da] bg-white px-5 py-16 text-center">
          <Compass size={35} className="mx-auto text-[#b8b9a9]" />
          <h3 className="mt-4 font-semibold">
            {hasActiveFilter ? 'Tempat tidak ditemukan' : 'Belum ada Places'}
          </h3>
          <p className="mt-2 text-sm text-gray-400">
            {hasActiveFilter
              ? 'Tidak ada tempat yang cocok dengan pencarian atau filter yang dipilih.'
              : 'Tempat yang sudah kamu simpan akan muncul di sini.'}
          </p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-xl bg-[#244C3A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#315d49]"
            >
              Reset filter
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            Menampilkan {filteredPlaces.length} dari {places.length} tempat
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlaces.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => setSelectedPlace(place)}
                className="group overflow-hidden rounded-2xl border border-[#e9e5da] bg-white text-left transition duration-200 hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#244C3A]"
              >
                {place.photo_url ? (
                  <img
                    src={place.photo_url}
                    alt={place.name}
                    loading="lazy"
                    className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-[#edf0e8] text-[#244C3A]">
                    <MapPin size={34} />
                  </div>
                )}

                <div className="p-5">
                  <h3 className="font-heading text-base font-bold">
                    {place.name}
                  </h3>

                  <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-gray-500">
                    <MapPin size={15} className="mt-0.5 shrink-0" />
                    <span>
                      {[
                        place.city,
                        place.provinces?.name,
                        place.countries?.name,
                      ]
                        .filter(Boolean)
                        .join(', ') || 'Lokasi belum diisi'}
                    </span>
                  </p>

                  {place.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-500">
                      {place.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-[#eeeae1] pt-4">
                    <span className="text-xs font-semibold text-[#244C3A]">
                      Lihat detail
                    </span>
                    <span className="text-xs text-gray-400">
                      {place.visited_at
                        ? formatDate(place.visited_at)
                        : ''}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* DETAIL PLACES MODAL */}
      {selectedPlace && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPlace(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="place-detail-title"
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#F7F5EF] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPlace(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/95 p-2 text-gray-700 shadow transition hover:bg-white"
              aria-label="Tutup detail"
            >
              <X size={20} />
            </button>

            {selectedPlace.photo_url ? (
              <img
                src={selectedPlace.photo_url}
                alt={selectedPlace.name}
                className="h-64 w-full object-cover sm:h-80"
              />
            ) : (
              <div className="flex h-64 items-center justify-center bg-[#edf0e8] text-[#244C3A] sm:h-80">
                <ImageIcon size={48} />
              </div>
            )}

            <div className="space-y-6 p-6 sm:p-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#e5ebdf] px-3 py-1 text-xs font-semibold text-[#244C3A]">
                  <Compass size={13} />
                  JOURNEYBASE PLACES
                </span>

                <h2
                  id="place-detail-title"
                  className="mt-3 font-heading text-2xl font-bold text-[#244C3A] sm:text-3xl"
                >
                  {selectedPlace.name}
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl border border-[#e9e5da] bg-white p-4">
                  <Globe2 size={19} className="mt-0.5 shrink-0 text-[#244C3A]" />
                  <div>
                    <p className="text-xs text-gray-400">Negara</p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedPlace.countries?.name || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-[#e9e5da] bg-white p-4">
                  <Building2 size={19} className="mt-0.5 shrink-0 text-[#244C3A]" />
                  <div>
                    <p className="text-xs text-gray-400">Provinsi</p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedPlace.provinces?.name || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-[#e9e5da] bg-white p-4">
                  <MapPin size={19} className="mt-0.5 shrink-0 text-[#244C3A]" />
                  <div>
                    <p className="text-xs text-gray-400">Kota</p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedPlace.city || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-[#e9e5da] bg-white p-4">
                  <CalendarDays size={19} className="mt-0.5 shrink-0 text-[#244C3A]" />
                  <div>
                    <p className="text-xs text-gray-400">Tanggal kunjungan</p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedPlace.visited_at
                        ? formatDate(selectedPlace.visited_at)
                        : 'Belum diisi'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#e9e5da] bg-white p-4">
                <div className="flex items-center gap-2 text-[#244C3A]">
                  <Navigation size={18} />
                  <h3 className="text-sm font-bold">Alamat</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {selectedPlace.address || 'Alamat belum diisi.'}
                </p>
              </div>

              <div>
                <h3 className="font-heading text-base font-bold text-[#244C3A]">
                  Tentang tempat ini
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-600">
                  {selectedPlace.description || 'Belum ada deskripsi untuk tempat ini.'}
                </p>
              </div>

              {selectedPlace.latitude != null &&
                selectedPlace.longitude != null && (
                  <a
                    href={`https://www.google.com/maps?q=${selectedPlace.latitude},${selectedPlace.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#244C3A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#315d49]"
                  >
                    <Map size={17} />
                    Buka Lokasi di Google Maps
                  </a>
                )}

              <button
                type="button"
                onClick={() => setSelectedPlace(null)}
                className="w-full rounded-xl border border-[#e9e5da] bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-[#f5f4ef]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
