
import { useCallback, useEffect, useState } from 'react'
import {
  Activity as ActivityIcon,
  PlusCircle,
  Pencil,
  Trash2,
  RefreshCw,
  MapPin,
  CalendarDays,
  ArrowLeftRight,
  AlertCircle,
} from 'lucide-react'
import { getActivities, type Activity } from '../lib/activityApi'

function formatDate(date: string) {
  return new Date(date).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getActivityIcon(activity: Activity) {
  if (activity.action === 'created') return PlusCircle
  if (activity.action === 'deleted') return Trash2
  if (activity.action === 'status_changed') return ArrowLeftRight
  return Pencil
}

function getActivityColor(action: Activity['action']) {
  if (action === 'created') return 'bg-green-100 text-green-700'
  if (action === 'deleted') return 'bg-red-100 text-red-700'
  if (action === 'status_changed') return 'bg-amber-100 text-amber-700'
  return 'bg-blue-100 text-blue-700'
}

function getActivityLabel(action: Activity['action']) {
  if (action === 'created') return 'Ditambahkan'
  if (action === 'deleted') return 'Dihapus'
  if (action === 'status_changed') return 'Status Diubah'
  return 'Diperbarui'
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadActivities = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getActivities()
      setActivities(data)
    } catch {
      setError('Gagal memuat riwayat aktivitas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  const createdCount = activities.filter(item => item.action === 'created').length
  const updatedCount = activities.filter(
    item => item.action === 'updated' || item.action === 'status_changed'
  ).length
  const deletedCount = activities.filter(item => item.action === 'deleted').length

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-medium text-[#8A9B85]">
            JOURNEYBASE / AKTIVITAS
          </p>
          <h1 className="font-heading text-3xl font-bold text-forest">
            Riwayat Aktivitas
          </h1>
          <p className="mt-2 text-sm text-[#829084]">
            Semua perjalanan dan perubahan yang terjadi di JOURNEYBASE.
          </p>
        </div>

        <button
          onClick={loadActivities}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#e9e5da] bg-white px-4 py-3 text-sm font-semibold hover:bg-[#f5f4ef] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#eee9dd] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-3 text-green-700">
              <PlusCircle size={20} />
            </div>
            <div>
              <p className="text-sm text-[#829084]">Ditambahkan</p>
              <p className="text-2xl font-bold text-forest">{createdCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#eee9dd] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <Pencil size={20} />
            </div>
            <div>
              <p className="text-sm text-[#829084]">Diperbarui</p>
              <p className="text-2xl font-bold text-forest">{updatedCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#eee9dd] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-100 p-3 text-red-700">
              <Trash2 size={20} />
            </div>
            <div>
              <p className="text-sm text-[#829084]">Dihapus</p>
              <p className="text-2xl font-bold text-forest">{deletedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#eee9dd] bg-white p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-[#edf2e9] p-3 text-forest">
            <ActivityIcon size={21} />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-forest">
              Aktivitas Terbaru
            </h2>
            <p className="text-xs text-[#829084]">
              Menampilkan maksimal 100 aktivitas terakhir
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-14 text-center text-sm text-[#829084]">
            Memuat riwayat aktivitas...
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <AlertCircle className="mx-auto mb-3 text-red-500" size={30} />
            <p className="mb-4 text-sm text-red-600">{error}</p>
            <button
              onClick={loadActivities}
              className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white"
            >
              Coba Lagi
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-14 text-center">
            <CalendarDays className="mx-auto mb-3 text-[#A8B9A0]" size={36} />
            <p className="font-semibold text-forest">Belum ada aktivitas</p>
            <p className="mt-1 text-sm text-[#829084]">
              Aktivitas baru akan muncul di sini secara otomatis.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {activities.map((item, index) => {
              const Icon = getActivityIcon(item)

              return (
                <div key={item.id} className="relative flex gap-4">
                  {index !== activities.length - 1 && (
                    <div className="absolute left-5 top-11 h-full w-px bg-[#e9e5da]" />
                  )}

                  <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getActivityColor(item.action)}`}>
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1 border-b border-[#f0ede6] pb-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-forest">
                        {item.entity_name}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getActivityColor(item.action)}`}>
                        {getActivityLabel(item.action)}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-[#829084]">
                      {item.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#9AA398]">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} />
                        {item.entity_type === 'destination' ? 'Destinasi' : 'Places'}
                      </span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
