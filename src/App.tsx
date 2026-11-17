
import { useEffect, useState } from 'react'
import { testConnection } from './lib/testConnection'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import MapPage from './components/MapPage'
import PlacesPage from './components/PlacesPage'
import StatisticsPage from './components/StatisticsPage'
import DashboardPage from './components/DashboardPage'
import ActivityPage from './components/ActivityPage'
import { getActivities, type Activity } from './lib/activityApi'
import { getGlobalSearchResults, type SearchResult } from './lib/globalSearchApi'
import { getDestinations } from './lib/destinationsApi'

import {
  LayoutDashboard,
  Map,
  MapPin,
  Heart,
  CheckCircle2,
  BarChart3,
  Search,
  LockKeyhole,
  Bell,
  Compass,
  Globe2,
  Plus,
  ChevronRight,
  Menu,
  X,
  History,
  RefreshCw,
  ArrowUpDown,
  Info,
} from 'lucide-react'

const menuItems = [
  { label: 'Beranda', icon: LayoutDashboard },
  { label: 'Jelajahi Peta', icon: Map },
  { label: 'Indonesia', icon: MapPin },
  { label: 'Luar Negeri', icon: Globe2 },
  { label: 'Wishlist', icon: Heart },
  { label: 'Visited', icon: CheckCircle2 },
  { label: 'Places', icon: Compass },
  { label: 'Statistik', icon: BarChart3 },
  { label: 'Riwayat Aktivitas', icon: History },
]

type Destination = {
  id: string
  name: string
  city_region: string | null
  description: string | null
  photo_url: string | null
  latitude: number | null
  longitude: number | null
  status: 'wishlist' | 'visited'
  created_at?: string | null
  visited_at?: string | null
  countries: { name: string }[] | { name: string } | null
  provinces: { name: string }[] | { name: string } | null
}

type Region = 'indonesia' | 'international'

type SortOption =
  | 'newest'
  | 'name-asc'
  | 'name-desc'
  | 'visited-newest'
  | 'visited-oldest'

function getRelationName(
  relation: { name: string }[] | { name: string } | null
) {
  if (Array.isArray(relation)) return relation[0]?.name ?? ''
  return relation?.name ?? ''
}

function DestinationsPage({
  status,
  region,
}: {
  status?: 'wishlist' | 'visited'
  region?: Region
}) {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'wishlist' | 'visited'
  >('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const data = await getDestinations(status)

        if (mounted) {
          setDestinations((data ?? []) as Destination[])
        }
      } catch (err) {
        console.error(err)
        if (mounted) setError('Gagal mengambil data destinasi.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [status])

  const filteredDestinations = destinations.filter((item) => {
    const country = getRelationName(item.countries).toLowerCase()
    const province = getRelationName(item.provinces)

    const matchesRegion =
      !region ||
      (region === 'indonesia'
        ? country === 'indonesia'
        : country !== '' && country !== 'indonesia')

    const matchesStatus =
      !region ||
      statusFilter === 'all' ||
      item.status === statusFilter

    const searchText = [
      item.name,
      item.city_region,
      item.description,
      country,
      province,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchesSearch = searchText.includes(search.toLowerCase().trim())

    return matchesRegion && matchesStatus && matchesSearch
  })

  const sortedDestinations = [...filteredDestinations].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name, 'id')

      case 'name-desc':
        return b.name.localeCompare(a.name, 'id')

      case 'visited-newest':
        if (!a.visited_at && !b.visited_at) return 0
        if (!a.visited_at) return 1
        if (!b.visited_at) return -1
        return (
          new Date(b.visited_at).getTime() -
          new Date(a.visited_at).getTime()
        )

      case 'visited-oldest':
        if (!a.visited_at && !b.visited_at) return 0
        if (!a.visited_at) return 1
        if (!b.visited_at) return -1
        return (
          new Date(a.visited_at).getTime() -
          new Date(b.visited_at).getTime()
        )

      case 'newest':
      default:
        if (!a.created_at && !b.created_at) return 0
        if (!a.created_at) return 1
        if (!b.created_at) return -1
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        )
    }
  })

  const pageTitle = region
    ? region === 'indonesia'
      ? 'Destinasi Indonesia'
      : 'Destinasi Luar Negeri'
    : status === 'wishlist'
      ? 'Wishlist'
      : 'Visited'

  const pageDescription = region
    ? 'Temukan dan kelola destinasi perjalananmu.'
    : status === 'wishlist'
      ? 'Tempat-tempat yang ingin kamu kunjungi.'
      : 'Tempat-tempat yang sudah pernah kamu kunjungi.'

  function getMapsUrl(item: Destination) {
    const query =
      item.latitude != null && item.longitude != null
        ? `${item.latitude},${item.longitude}`
        : `${item.name} ${item.city_region ?? ''} ${getRelationName(item.countries)}`

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-forest">
          {pageTitle}
        </h1>
        <p className="mt-1 text-sm text-[#85877f]">
          {pageDescription}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#92958b]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari destinasi, negara, kota, atau provinsi..."
            className="w-full rounded-xl border border-[#e9e5da] bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#244C3A]"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {region && (
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Semua' },
                { value: 'wishlist', label: 'Wishlist' },
                { value: 'visited', label: 'Visited' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() =>
                    setStatusFilter(
                      filter.value as 'all' | 'wishlist' | 'visited'
                    )
                  }
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    statusFilter === filter.value
                      ? 'bg-forest text-white'
                      : 'border border-[#e9e5da] bg-white text-[#77796f] hover:bg-[#f1f0e9]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}

          <div className="relative sm:ml-auto sm:w-full">
            <ArrowUpDown
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full appearance-none rounded-xl border border-[#e9e5da] bg-white py-3 pl-11 pr-10 text-sm outline-none transition focus:border-[#244C3A]"
            >
              <option value="newest">Terbaru ditambahkan</option>
              <option value="name-asc">Nama A–Z</option>
              <option value="name-desc">Nama Z–A</option>
              <option value="visited-newest">Tanggal kunjungan terbaru</option>
              <option value="visited-oldest">Tanggal kunjungan terlama</option>
            </select>
            <ChevronRight
              size={17}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#e9e5da] bg-white p-10 text-center text-sm text-[#85877f]">
          Memuat destinasi...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white"
          >
            Coba Lagi
          </button>
        </div>
      ) : sortedDestinations.length === 0 ? (
        <div className="rounded-2xl border border-[#e9e5da] bg-white p-10 text-center">
          <MapPin size={30} className="mx-auto mb-3 text-[#a8b9a0]" />
          <p className="font-semibold text-forest">
            {search || statusFilter !== 'all'
              ? 'Destinasi tidak ditemukan'
              : 'Belum ada destinasi'}
          </p>
          <p className="mt-1 text-sm text-[#85877f]">
            Coba ubah kata kunci atau filter pencarian.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[#85877f]">
            Menampilkan {sortedDestinations.length} destinasi
          </p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sortedDestinations.map((item) => {
              const country = getRelationName(item.countries)
              const province = getRelationName(item.provinces)

              const location = [
                item.city_region,
                province,
                country,
              ]
                .filter(Boolean)
                .join(', ')

              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-[#e9e5da] bg-white transition hover:-translate-y-1 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedDestination(item)}
                    className="block w-full text-left"
                  >
                    <div className="relative h-48 bg-[#eeece4]">
                      {item.photo_url ? (
                        <img
                          src={item.photo_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <MapPin size={34} className="text-[#a8b9a0]" />
                        </div>
                      )}

                      <span
                        className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === 'wishlist'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {item.status === 'wishlist' ? 'Wishlist' : 'Visited'}
                      </span>
                    </div>

                    <div className="space-y-3 p-4">
                      <div>
                        <h3 className="font-heading text-lg font-bold text-forest">
                          {item.name}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-[#85877f]">
                          <MapPin size={13} />
                          {location || 'Lokasi belum ditentukan'}
                        </p>
                      </div>

                      {item.description && (
                        <p className="line-clamp-2 text-sm leading-relaxed text-[#77796f]">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t border-[#eeeae0] pt-3">
                        <span className="text-sm font-semibold text-forest">
                          Lihat Detail
                        </span>
                        <ChevronRight size={18} className="text-forest" />
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {selectedDestination && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedDestination(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail ${selectedDestination.name}`}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 bg-[#eeece4] sm:h-80">
              {selectedDestination.photo_url ? (
                <img
                  src={selectedDestination.photo_url}
                  alt={selectedDestination.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <MapPin size={48} className="text-[#a8b9a0]" />
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedDestination(null)}
                aria-label="Tutup detail"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-forest shadow hover:bg-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6 sm:p-8">
              <div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedDestination.status === 'wishlist'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {selectedDestination.status === 'wishlist'
                    ? 'Wishlist'
                    : 'Visited'}
                </span>

                <h2 className="mt-3 font-heading text-2xl font-bold text-forest">
                  {selectedDestination.name}
                </h2>
              </div>

              <div className="rounded-2xl bg-[#f7f6f1] p-4">
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="mt-0.5 shrink-0 text-forest" />
                  <div>
                    <p className="text-sm font-semibold text-forest">
                      Lokasi
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[#77796f]">
                      {[
                        selectedDestination.city_region,
                        getRelationName(selectedDestination.provinces),
                        getRelationName(selectedDestination.countries),
                      ]
                        .filter(Boolean)
                        .join(', ') || 'Lokasi belum ditentukan'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-heading font-bold text-forest">
                  Tentang Destinasi
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#77796f]">
                  {selectedDestination.description ||
                    'Belum ada deskripsi untuk destinasi ini.'}
                </p>
              </div>

              <div>
                <h3 className="font-heading font-bold text-forest">
                  Koordinat
                </h3>
                <p className="mt-2 text-sm text-[#77796f]">
                  {selectedDestination.latitude != null &&
                  selectedDestination.longitude != null
                    ? `${selectedDestination.latitude}, ${selectedDestination.longitude}`
                    : 'Koordinat belum tersedia'}
                </p>
              </div>

              <a
                href={getMapsUrl(selectedDestination)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#315d48]"
              >
                <MapPin size={17} />
                Buka di Google Maps
              </a>

              <button
                type="button"
                onClick={() => setSelectedDestination(null)}
                className="w-full rounded-xl border border-[#e9e5da] px-5 py-3 text-sm font-semibold text-forest hover:bg-[#f5f4ef]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const [isAdminLogin, setIsAdminLogin] = useState(false)
  const [adminToken, setAdminToken] = useState(
    sessionStorage.getItem('journeybase_admin_token') || ''
  )

  useEffect(() => {
    testConnection()
  }, [])

  const [activePage, setActivePage] = useState('Beranda')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    async function searchData() {
      if (globalSearch.trim().length < 2) {
        setSearchResults([])
        setSearchLoading(false)
        return
      }

      setSearchLoading(true)

      try {
        const data = await getGlobalSearchResults()
        const keyword = globalSearch.toLowerCase().trim()

        const filtered = data.filter((item) =>
          `${item.name} ${item.subtitle}`.toLowerCase().includes(keyword)
        )

        if (mounted) setSearchResults(filtered.slice(0, 8))
      } catch (error) {
        console.error('Pencarian gagal:', error)
        if (mounted) setSearchResults([])
      } finally {
        if (mounted) setSearchLoading(false)
      }
    }

    searchData()

    return () => {
      mounted = false
    }
  }, [globalSearch])

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [notificationLoading, setNotificationLoading] = useState(false)

  const loadNotifications = async () => {
    setNotificationLoading(true)

    try {
      const data = await getActivities()
      setRecentActivities(data.slice(0, 5))
    } catch (error) {
      console.error('Gagal memuat notifikasi:', error)
    } finally {
      setNotificationLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const navigate = (page: string) => {
    setActivePage(page)
    setMobileMenu(false)
  }

  const PageIcon =
    menuItems.find((item) => item.label === activePage)?.icon || LayoutDashboard

  if (isAdminLogin && !adminToken) {
    return (
      <AdminLogin
        onLogin={(token) => {
          setAdminToken(token)
          setIsAdminLogin(false)
        }}
      />
    )
  }

  if (adminToken) {
    return <AdminDashboard token={adminToken} />
  }

  return (
    <div className="min-h-screen bg-cream text-forest md:flex">
      <aside
        className={`${
          mobileMenu ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[#e8e4d9] bg-white transition-transform duration-300 md:translate-x-0`}
      >
        <div className="flex items-center justify-between px-7 py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest text-white">
              <Compass size={23} />
            </div>
            <div>
              <h1 className="font-heading text-lg font-extrabold tracking-[0.12em]">
                JOURNEYBASE
              </h1>
              <p className="text-[10px] tracking-widest text-gray-400">
                YOUR WORLD, YOUR JOURNEY.
              </p>
            </div>
          </div>
          <button onClick={() => setMobileMenu(false)} className="md:hidden">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-3 pt-2">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
            Menu utama
          </p>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto px-4 pb-5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = activePage === item.label

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.label)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                  active
                    ? 'bg-forest font-semibold text-white shadow-sm'
                    : 'text-gray-500 hover:bg-[#f4f5ef] hover:text-forest'
                }`}
              >
                <Icon size={18} />
                {item.label}
                {active && <ChevronRight size={16} className="ml-auto" />}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto p-5">
          <div className="rounded-2xl bg-[#f3f2eb] p-4">
            <div className="mb-2 flex items-center gap-2">
              <Compass size={17} />
              <span className="text-xs font-bold">Your next adventure</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-500">
              Every journey begins with a single step.
            </p>
          </div>

          <button
            onClick={() => {
              setIsAdminLogin(true)
              setMobileMenu(false)
            }}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[#244C3A] hover:bg-[#edf0e8]"
          >
            <LockKeyhole size={17} /> Admin
          </button>
        </div>
      </aside>

      {mobileMenu && (
        <button
          aria-label="Tutup menu"
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
        />
      )}

      <main className="min-w-0 flex-1 md:ml-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e8e4d9] bg-cream/90 px-5 py-4 backdrop-blur-md md:px-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenu(true)}
              className="md:hidden"
            >
              <Menu size={22} />
            </button>
            <div>
              <p className="text-xs text-gray-400">
                Your personal travel space
              </p>
              <h2 className="font-heading text-lg font-bold">
                {activePage}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <div className="flex items-center gap-2 rounded-full border border-[#e4dfd2] bg-white px-4 py-2.5">
                <Search size={17} className="shrink-0 text-[#92958b]" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value)
                    setSearchOpen(true)
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSearchOpen(false)
                  }}
                  placeholder="Cari destinasi atau tempat..."
                  className="w-48 bg-transparent text-sm outline-none transition-all placeholder:text-[#a0a398] focus:w-64"
                />
                {globalSearch && (
                  <button
                    onClick={() => {
                      setGlobalSearch('')
                      setSearchResults([])
                    }}
                    className="text-[#92958b] hover:text-forest"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {searchOpen && globalSearch.trim().length >= 2 && (
                <>
                  <button
                    aria-label="Tutup hasil pencarian"
                    onClick={() => setSearchOpen(false)}
                    className="fixed inset-0 z-20 cursor-default"
                  />

                  <div className="absolute right-0 top-14 z-30 w-80 overflow-hidden rounded-2xl border border-[#e9e5da] bg-white shadow-xl">
                    <div className="border-b border-[#eeeae0] px-4 py-3">
                      <p className="text-xs font-semibold text-[#85877f]">
                        HASIL PENCARIAN
                      </p>
                    </div>

                    {searchLoading ? (
                      <p className="p-5 text-center text-sm text-[#85877f]">
                        Mencari...
                      </p>
                    ) : searchResults.length === 0 ? (
                      <p className="p-5 text-center text-sm text-[#85877f]">
                        Tidak ada hasil ditemukan.
                      </p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {searchResults.map((item) => (
                          <button
                            key={`${item.type}-${item.id}`}
                            onClick={() => {
                              if (item.type === 'place') {
                                navigate('Places')
                              } else {
                                navigate(
                                  item.status === 'visited'
                                    ? 'Visited'
                                    : 'Wishlist'
                                )
                              }

                              setGlobalSearch('')
                              setSearchResults([])
                              setSearchOpen(false)
                            }}
                            className="flex w-full items-center gap-3 border-b border-[#f1eee7] px-4 py-3 text-left hover:bg-[#f7f6f1]"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf2e9] text-forest">
                              {item.type === 'place' ? (
                                <Compass size={17} />
                              ) : (
                                <MapPin size={17} />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-forest">
                                {item.name}
                              </p>
                              <p className="truncate text-xs text-[#85877f]">
                                {item.subtitle}
                              </p>
                              <p className="mt-1 text-[10px] text-[#a0a398]">
                                {item.type === 'place'
                                  ? 'Places'
                                  : item.status === 'visited'
                                    ? 'Visited'
                                    : 'Wishlist'}
                              </p>
                            </div>

                            <ChevronRight
                              size={16}
                              className="shrink-0 text-[#92958b]"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* NOTIFIKASI */}
            <div className="relative">
              <button
                onClick={() => {
                  const nextState = !notificationsOpen
                  setNotificationsOpen(nextState)

                  if (nextState) {
                    loadNotifications()
                  }
                }}
                className="relative rounded-full border border-[#e4dfd2] p-2.5 transition hover:bg-white"
                aria-label="Notifikasi"
                aria-expanded={notificationsOpen}
              >
                <Bell size={18} />

                {recentActivities.length > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-cream" />
                )}
              </button>

              {notificationsOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Tutup notifikasi"
                    onClick={() => setNotificationsOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />

                  {/* DROPDOWN NOTIFIKASI - POSISI RESPONSIVE */}
                  <div className="fixed right-3 top-[76px] z-50 w-[calc(100vw-24px)] max-w-[360px] overflow-hidden rounded-2xl border border-[#e9e5da] bg-white shadow-xl sm:right-5 md:right-8">
                    <div className="flex items-center justify-between border-b border-[#eeeae0] p-4">
                      <div className="min-w-0">
                        <h3 className="font-heading font-bold text-forest">
                          Notifikasi
                        </h3>
                        <p className="text-xs text-[#85877f]">
                          Aktivitas terbaru JOURNEYBASE
                        </p>
                      </div>

                      <button
                        onClick={loadNotifications}
                        disabled={notificationLoading}
                        className="ml-2 shrink-0 rounded-lg p-2 text-[#85877f] hover:bg-[#f5f4ef]"
                        title="Refresh"
                      >
                        <RefreshCw
                          size={16}
                          className={notificationLoading ? 'animate-spin' : ''}
                        />
                      </button>
                    </div>

                    <div className="max-h-[min(360px,60vh)] overflow-y-auto">
                      {notificationLoading ? (
                        <p className="p-6 text-center text-sm text-[#85877f]">
                          Memuat notifikasi...
                        </p>
                      ) : recentActivities.length === 0 ? (
                        <div className="p-7 text-center">
                          <Bell
                            size={25}
                            className="mx-auto mb-2 text-[#a8b9a0]"
                          />
                          <p className="text-sm font-semibold text-forest">
                            Belum ada aktivitas
                          </p>
                          <p className="mt-1 text-xs text-[#85877f]">
                            Aktivitas terbaru akan muncul di sini.
                          </p>
                        </div>
                      ) : (
                        recentActivities.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              navigate('Riwayat Aktivitas')
                              setNotificationsOpen(false)
                            }}
                            className="flex w-full gap-3 border-b border-[#f1eee7] p-4 text-left transition hover:bg-[#f8f7f2]"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf2e9] text-forest">
                              <Bell size={16} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-forest">
                                {item.entity_name}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs text-[#85877f]">
                                {item.description || 'Ada aktivitas baru.'}
                              </p>
                              <p className="mt-2 text-[10px] text-[#a0a398]">
                                {new Date(item.created_at).toLocaleString(
                                  'id-ID',
                                  {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => {
                        navigate('Riwayat Aktivitas')
                        setNotificationsOpen(false)
                      }}
                      className="w-full bg-[#f7f6f1] p-3 text-center text-sm font-semibold text-forest hover:bg-[#eeede5]"
                    >
                      Lihat Semua Aktivitas
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* TENTANG JOURNEYBASE */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAboutOpen((previous) => !previous)}
                aria-label="Tentang JOURNEYBASE"
                aria-expanded={aboutOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-sage font-bold text-forest transition hover:ring-4 hover:ring-[#a8b9a0]/30"
              >
                J
              </button>

              {aboutOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Tutup informasi JOURNEYBASE"
                    onClick={() => setAboutOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />

                  <div className="absolute right-0 top-12 z-50 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-[#e9e5da] bg-white shadow-xl">
                    <div className="bg-forest px-5 py-5 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                          <Compass size={27} />
                        </div>

                        <button
                          type="button"
                          onClick={() => setAboutOpen(false)}
                          aria-label="Tutup"
                          className="rounded-full p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <h3 className="mt-4 font-heading text-xl font-extrabold tracking-wider">
                        JOURNEYBASE
                      </h3>
                      <p className="mt-1 text-xs tracking-widest text-white/70">
                        YOUR WORLD, YOUR JOURNEY.
                      </p>
                    </div>

                    <div className="space-y-4 p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#85877f]">
                          Versi aplikasi
                        </span>
                        <span className="rounded-full bg-[#edf2e9] px-3 py-1 text-xs font-bold text-forest">
                          Version 1.0.0
                        </span>
                      </div>

                      <div className="border-t border-[#eeeae0]" />

                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <Info size={16} className="text-forest" />
                          <h4 className="text-sm font-bold text-forest">
                            Tentang Website
                          </h4>
                        </div>

                        <p className="text-sm leading-6 text-[#77796f]">
                          JOURNEYBASE adalah website personal travel wishlist
                          dan tracker untuk menyimpan destinasi impian,
                          mencatat tempat yang sudah dikunjungi, serta
                          menjelajahi berbagai tempat di dunia.
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#f7f6f1] p-3">
                        <p className="text-[11px] uppercase tracking-wider text-[#92958b]">
                          Created by
                        </p>
                        <p className="mt-1 font-heading text-sm font-bold text-forest">
                          FhrzaaA
                        </p>
                      </div>

                      <p className="text-center text-[10px] text-[#a0a398]">
                        © {new Date().getFullYear()} JOURNEYBASE
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 md:px-10 md:py-10">
          {activePage === 'Beranda' ? (
            <DashboardPage onNavigate={navigate} />
          ) : activePage === 'Indonesia' ? (
            <DestinationsPage region="indonesia" />
          ) : activePage === 'Luar Negeri' ? (
            <DestinationsPage region="international" />
          ) : activePage === 'Wishlist' ? (
            <DestinationsPage status="wishlist" />
          ) : activePage === 'Visited' ? (
            <DestinationsPage status="visited" />
          ) : activePage === 'Jelajahi Peta' ? (
            <MapPage />
          ) : activePage === 'Places' ? (
            <PlacesPage />
          ) : activePage === 'Statistik' ? (
            <StatisticsPage />
          ) : activePage === 'Riwayat Aktivitas' ? (
            <ActivityPage />
          ) : (
            <section className="rounded-3xl border border-[#e9e5da] bg-white p-7 md:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf1e9]">
                <PageIcon size={26} />
              </div>
              <h2 className="mt-6 font-heading text-2xl font-bold">
                {activePage}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
                Halaman {activePage} sudah aktif dalam navigasi. Konten dan
                fitur lengkapnya akan kita bangun pada tahap berikutnya.
              </p>

              {['Wishlist', 'Places'].includes(activePage) && (
                <button className="mt-7 flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white hover:bg-[#315d48]">
                  <Plus size={17} /> Tambah {activePage}
                </button>
              )}

              <div className="mt-10 border-t border-[#eeeae0] pt-5">
                <button
                  onClick={() => navigate('Beranda')}
                  className="text-sm font-semibold text-forest hover:underline"
                >
                  ← Kembali ke Beranda
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
