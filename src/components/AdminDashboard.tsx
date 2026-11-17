
import { useEffect, useState, type ChangeEvent } from 'react'
import {
  MapPin,
  Heart,
  CheckCircle2,
  RefreshCw,
  Plus,
  LogOut,
  ArrowLeft,
  Compass,
  Pencil,
  Trash2,
  Search,
  X,
  Download,
  ShieldCheck,
  Database,
  Upload,
} from 'lucide-react'

import { getDestinations } from '../lib/destinationsApi'
import { getPlaces, type Place } from '../lib/placesApi'
import {
  adminDestinations,
  adminPlaces,
  adminRestoreBackup,
} from '../lib/adminApi'
import DestinationForm from './DestinationForm'
import PlaceForm from './PlaceForm'

type Destination = {
  id: string
  name: string
  country_id: string | null
  province_id: string | null
  city_region: string | null
  description: string | null
  photo_url: string | null
  latitude: number | null
  longitude: number | null
  status: 'wishlist' | 'visited'
  countries: { name: string } | null
}

export default function AdminDashboard({ token }: { token: string }) {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [places, setPlaces] = useState<Place[]>([])

  const [placeSearch, setPlaceSearch] = useState('')
  const [placeCountryFilter, setPlaceCountryFilter] = useState('all')

  const [showDestinationForm, setShowDestinationForm] = useState(false)
  const [editingDestination, setEditingDestination] =
    useState<Destination | null>(null)

  const [showPlaceForm, setShowPlaceForm] = useState(false)
  const [editingPlace, setEditingPlace] = useState<Place | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<'destinations' | 'places'>(
    'destinations'
  )

  function handleLogout() {
    sessionStorage.removeItem('journeybase_admin_token')
    window.location.reload()
  }

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [destinationData, placeData] = await Promise.all([
        getDestinations(),
        getPlaces(),
      ])

      setDestinations(
        (destinationData ?? []) as unknown as Destination[]
      )
      setPlaces(placeData)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal mengambil data.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleExportBackup() {
    setBackupLoading(true)

    try {
      const [destinationData, placeData] = await Promise.all([
        getDestinations(),
        getPlaces(),
      ])

      const backup = {
        application: 'JOURNEYBASE',
        backup_version: 1,
        created_at: new Date().toISOString(),
        data: {
          destinations: destinationData ?? [],
          places: placeData ?? [],
        },
        totals: {
          destinations: destinationData?.length ?? 0,
          places: placeData?.length ?? 0,
        },
      }

      const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: 'application/json' }
      )

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)

      link.href = url
      link.download = `journeybase-backup-${date}.json`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      alert(
        `Backup berhasil diunduh!\n\nDestinations: ${backup.totals.destinations}\nPlaces: ${backup.totals.places}`
      )
    } catch (err) {
      alert(
        err instanceof Error
          ? `Gagal membuat backup: ${err.message}`
          : 'Gagal membuat backup.'
      )
    } finally {
      setBackupLoading(false)
    }
  }

async function handleImportBackup(
  event: ChangeEvent<HTMLInputElement>
) {
  const input = event.currentTarget
  const file = input.files?.[0]

    if (!file) return

    try {
      if (!file.name.toLowerCase().endsWith('.json')) {
        throw new Error('File harus berformat .json')
      }

      const fileContent = await file.text()
      const backup: unknown = JSON.parse(fileContent)

      if (
        typeof backup !== 'object' ||
        backup === null ||
        !('application' in backup) ||
        !('backup_version' in backup) ||
        !('data' in backup)
      ) {
        throw new Error('Struktur file backup tidak valid.')
      }

      const backupData = backup as {
        application: unknown
        backup_version: unknown
        data: unknown
      }

      if (backupData.application !== 'JOURNEYBASE') {
        throw new Error(
          'File ini bukan backup dari JOURNEYBASE.'
        )
      }

      if (backupData.backup_version !== 1) {
        throw new Error(
          'Versi backup tidak didukung.'
        )
      }

      if (
        typeof backupData.data !== 'object' ||
        backupData.data === null ||
        !('destinations' in backupData.data) ||
        !('places' in backupData.data)
      ) {
        throw new Error('Data backup tidak lengkap.')
      }

      const data = backupData.data as {
        destinations: unknown
        places: unknown
      }

      if (
        !Array.isArray(data.destinations) ||
        !Array.isArray(data.places)
      ) {
        throw new Error(
          'Data Destinations atau Places tidak valid.'
        )
      }

      const destinationCount = data.destinations.length
      const placeCount = data.places.length

      if (destinationCount + placeCount > 10000) {
        throw new Error(
          'Jumlah data backup melebihi batas 10.000 baris.'
        )
      }

      const confirmed = window.confirm(
        `Pulihkan backup JOURNEYBASE ini?\n\n` +
        `Destinations: ${destinationCount}\n` +
        `Places: ${placeCount}\n\n` +
        `Data dengan ID yang sama akan diperbarui.\n` +
        `Data baru akan ditambahkan.\n` +
        `Data lain yang tidak ada di backup tidak akan dihapus.\n\n` +
        `Pastikan kamu sudah memiliki backup terbaru sebelum melanjutkan.`
      )

      if (!confirmed) return

      setRestoreLoading(true)

      await adminRestoreBackup(
        backup as Record<string, unknown>,
        token
      )

      await loadData()

      alert(
        `Restore berhasil diproses!\n\n` +
        `Destinations: ${destinationCount}\n` +
        `Places: ${placeCount}\n\n` +
        `Dashboard sudah diperbarui.`
      )
    } catch (err) {
      alert(
        err instanceof Error
          ? `Gagal melakukan restore: ${err.message}`
          : 'Gagal melakukan restore backup.'
      )
    } finally {
  setRestoreLoading(false)
  input.value = ''
}
  }

  async function handleDeleteDestination(id: string, name: string) {
    if (!window.confirm(`Yakin ingin menghapus destinasi "${name}"?`)) {
      return
    }

    try {
      await adminDestinations('delete', { id }, token)
      await loadData()
      alert('Destinasi berhasil dihapus.')
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus destinasi.'
      )
    }
  }

  async function handleDeletePlace(id: string, name: string) {
    if (!window.confirm(`Yakin ingin menghapus Places "${name}"?`)) {
      return
    }

    try {
      await adminPlaces('delete', { id }, token)
      await loadData()
      alert('Places berhasil dihapus.')
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus Places.'
      )
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const wishlistCount = destinations.filter(
    (item) => item.status === 'wishlist'
  ).length

  const visitedCount = destinations.filter(
    (item) => item.status === 'visited'
  ).length

  const placeCountries = Array.from(
    new Set(
      places
        .map((place) => place.countries?.name)
        .filter((name): name is string => Boolean(name))
    )
  ).sort((a, b) => a.localeCompare(b))

  const filteredPlaces = places.filter((place) => {
    const keyword = placeSearch.trim().toLowerCase()

    const matchesSearch = [
      place.name,
      place.city,
      place.address,
      place.description,
      place.countries?.name,
      place.provinces?.name,
    ].some((value) =>
      value?.toLowerCase().includes(keyword)
    )

    const matchesCountry =
      placeCountryFilter === 'all' ||
      place.countries?.name === placeCountryFilter

    return matchesSearch && matchesCountry
  })

  return (
    <div className="min-h-screen space-y-7 bg-[#F7F5EF] p-5 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">JOURNEYBASE / ADMIN</p>
          <h1 className="mt-2 font-heading text-2xl font-bold text-[#244C3A]">
            Dashboard Admin
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola destinasi dan tempat perjalananmu.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-[#e9e5da] bg-white px-4 py-3 text-sm font-semibold hover:bg-[#f5f4ef]"
          >
            <ArrowLeft size={16} />
            Kembali ke Website
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} />
            Logout
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#e9e5da] bg-white px-4 py-3 text-sm font-semibold hover:bg-[#f5f4ef] disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Backup & Restore */}
      <section className="rounded-2xl border border-[#e9e5da] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf0e8] text-[#244C3A]">
              <Database size={22} />
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-[#244C3A]">
                Backup & Restore Data
              </h2>
              <p className="mt-1 max-w-xl text-sm text-gray-500">
                Simpan salinan data JOURNEYBASE dan pulihkan
                kembali jika diperlukan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportBackup}
              disabled={backupLoading || loading || restoreLoading}
              className="flex items-center gap-2 rounded-xl bg-[#244C3A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#315d49] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {backupLoading ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <Download size={17} />
              )}
              {backupLoading ? 'Membuat Backup...' : 'Download Backup'}
            </button>

            <label
              className={`flex cursor-pointer items-center gap-2 rounded-xl border border-[#244C3A] bg-white px-5 py-3 text-sm font-semibold text-[#244C3A] hover:bg-[#edf0e8] ${
                restoreLoading || backupLoading || loading
                  ? 'pointer-events-none opacity-50'
                  : ''
              }`}
            >
              {restoreLoading ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <Upload size={17} />
              )}
              {restoreLoading ? 'Memulihkan...' : 'Restore Backup'}

              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportBackup}
                disabled={restoreLoading || backupLoading || loading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[#f7f5ef] p-4">
            <p className="text-xs text-gray-500">Destinations</p>
            <p className="mt-1 text-xl font-bold text-[#244C3A]">
              {destinations.length}
            </p>
          </div>

          <div className="rounded-xl bg-[#f7f5ef] p-4">
            <p className="text-xs text-gray-500">Places</p>
            <p className="mt-1 text-xl font-bold text-[#244C3A]">
              {places.length}
            </p>
          </div>

          <div className="rounded-xl bg-[#f7f5ef] p-4">
            <div className="flex items-center gap-2 text-[#477c58]">
              <ShieldCheck size={16} />
              <p className="text-xs font-semibold">Format JSON</p>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              File dapat disimpan sebagai cadangan.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-xs leading-relaxed text-gray-500">
          <p>
            Backup mencakup data Destinations dan Places beserta
            informasi lokasi dan URL foto. File foto fisik tidak
            disalin.
          </p>
          <p>
            Restore akan menambahkan data baru dan memperbarui data
            dengan ID yang sama. Data yang tidak ada di file backup
            tidak akan dihapus.
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e9e5da] bg-white p-6">
          <div className="flex items-center gap-3 text-[#b38b35]">
            <Heart size={21} />
            <span className="text-sm font-semibold">Wishlist</span>
          </div>
          <p className="mt-4 font-heading text-3xl font-bold">
            {wishlistCount}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Destinasi direncanakan
          </p>
        </div>

        <div className="rounded-2xl border border-[#e9e5da] bg-white p-6">
          <div className="flex items-center gap-3 text-[#477c58]">
            <CheckCircle2 size={21} />
            <span className="text-sm font-semibold">Visited</span>
          </div>
          <p className="mt-4 font-heading text-3xl font-bold">
            {visitedCount}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Destinasi dikunjungi
          </p>
        </div>

        <div className="rounded-2xl border border-[#e9e5da] bg-white p-6">
          <div className="flex items-center gap-3 text-blue-600">
            <Compass size={21} />
            <span className="text-sm font-semibold">Places</span>
          </div>
          <p className="mt-4 font-heading text-3xl font-bold">
            {places.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Tempat tersimpan
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-[#e9e5da] bg-white p-1">
          <button
            onClick={() => setActiveTab('destinations')}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
              activeTab === 'destinations'
                ? 'bg-[#244C3A] text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Destinations
          </button>

          <button
            onClick={() => setActiveTab('places')}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
              activeTab === 'places'
                ? 'bg-[#244C3A] text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Places
          </button>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'destinations') {
              setEditingDestination(null)
              setShowDestinationForm(true)
            } else {
              setEditingPlace(null)
              setShowPlaceForm(true)
            }
          }}
          className="flex items-center gap-2 rounded-xl bg-[#244C3A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#315d49]"
        >
          <Plus size={17} />
          Tambah {activeTab === 'destinations' ? 'Destinasi' : 'Places'}
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {activeTab === 'destinations' && (
        <>
          {(showDestinationForm || editingDestination) && (
            <DestinationForm
              token={token}
              initialData={editingDestination ?? undefined}
              onCancel={() => {
                setShowDestinationForm(false)
                setEditingDestination(null)
              }}
              onSuccess={() => {
                setShowDestinationForm(false)
                setEditingDestination(null)
                loadData()
              }}
            />
          )}

          <section className="rounded-2xl border border-[#e9e5da] bg-white p-6">
            <div className="mb-5 flex items-center gap-2">
              <MapPin size={20} />
              <h2 className="font-heading text-lg font-bold">
                Semua Destinasi
              </h2>
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-gray-500">
                Memuat destinasi...
              </p>
            ) : destinations.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">
                Belum ada destinasi.
              </p>
            ) : (
              <div className="space-y-3">
                {destinations.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border border-[#eeeae1] p-3"
                  >
                    {item.photo_url ? (
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="h-16 w-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-20 items-center justify-center rounded-lg bg-[#edf0e8]">
                        <MapPin size={22} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {[item.city_region, item.countries?.name]
                          .filter(Boolean)
                          .join(', ') || 'Lokasi belum diisi'}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === 'wishlist'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {item.status === 'wishlist' ? 'Wishlist' : 'Visited'}
                    </span>

                    <button
                      onClick={() => {
                        setEditingDestination(item)
                        setShowDestinationForm(false)
                      }}
                      className="rounded-lg border border-[#e9e5da] px-3 py-2 text-xs font-semibold hover:bg-[#f5f4ef]"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteDestination(item.id, item.name)
                      }
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Hapus
                    </button>

                    {item.latitude !== null &&
                      item.longitude !== null && (
                        <a
                          href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          Google Maps
                        </a>
                      )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === 'places' && (
        <>
          {(showPlaceForm || editingPlace) && (
            <PlaceForm
              token={token}
              initialData={editingPlace ?? undefined}
              onCancel={() => {
                setShowPlaceForm(false)
                setEditingPlace(null)
              }}
              onSuccess={() => {
                setShowPlaceForm(false)
                setEditingPlace(null)
                loadData()
              }}
            />
          )}

          <section className="rounded-2xl border border-[#e9e5da] bg-white p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Compass size={20} />
                <h2 className="font-heading text-lg font-bold">
                  Semua Places
                </h2>
              </div>

              <span className="rounded-full bg-[#edf0e8] px-3 py-1 text-xs font-semibold text-[#244C3A]">
                {filteredPlaces.length} / {places.length} Places
              </span>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_220px]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={placeSearch}
                  onChange={(e) => setPlaceSearch(e.target.value)}
                  placeholder="Cari nama, kota, alamat..."
                  className="w-full rounded-xl border border-[#e9e5da] bg-white py-3 pl-11 pr-10 text-sm outline-none focus:border-[#244C3A]"
                />

                {placeSearch && (
                  <button
                    type="button"
                    onClick={() => setPlaceSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100"
                    aria-label="Hapus pencarian"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <select
                value={placeCountryFilter}
                onChange={(e) => setPlaceCountryFilter(e.target.value)}
                className="w-full rounded-xl border border-[#e9e5da] bg-white px-4 py-3 text-sm outline-none focus:border-[#244C3A]"
              >
                <option value="all">Semua negara</option>
                {placeCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-gray-500">
                Memuat Places...
              </p>
            ) : places.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">
                Belum ada Places. Tambahkan tempat pertamamu.
              </p>
            ) : filteredPlaces.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#e9e5da] p-8 text-center">
                <Search
                  size={28}
                  className="mx-auto mb-3 text-gray-400"
                />
                <p className="font-semibold text-gray-700">
                  Places tidak ditemukan
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Coba ubah kata pencarian atau filter negara.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPlaceSearch('')
                    setPlaceCountryFilter('all')
                  }}
                  className="mt-4 rounded-lg border border-[#e9e5da] px-4 py-2 text-sm font-semibold hover:bg-[#f5f4ef]"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPlaces.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border border-[#eeeae1] p-3"
                  >
                    {item.photo_url ? (
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="h-16 w-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-20 items-center justify-center rounded-lg bg-[#edf0e8]">
                        <MapPin size={22} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {[
                          item.city,
                          item.provinces?.name,
                          item.countries?.name,
                        ]
                          .filter(Boolean)
                          .join(', ') || 'Lokasi belum diisi'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingPlace(item)
                        setShowPlaceForm(false)
                      }}
                      className="flex items-center gap-1 rounded-lg border border-[#e9e5da] px-3 py-2 text-xs font-semibold hover:bg-[#f5f4ef]"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDeletePlace(item.id, item.name)
                      }
                      className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                      Hapus
                    </button>

                    {item.latitude !== null &&
                      item.longitude !== null && (
                        <a
                          href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          Google Maps
                        </a>
                      )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
