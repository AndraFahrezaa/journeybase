
import { useEffect, useState } from 'react'
import { Save, X, ImagePlus } from 'lucide-react'
import { adminPlaces } from '../lib/adminApi'
import { getCountries, getProvinces } from '../lib/locationsApi'
import { uploadDestinationImage } from '../lib/uploadImageApi'
import type { Place } from '../lib/placesApi'

type LocationOption = {
  id: string
  name: string
}

type Props = {
  token: string
  initialData?: Place
  onCancel: () => void
  onSuccess: () => void
}

export default function PlaceForm({
  token,
  initialData,
  onCancel,
  onSuccess,
}: Props) {
  const [countries, setCountries] = useState<LocationOption[]>([])
  const [provinces, setProvinces] = useState<LocationOption[]>([])
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(initialData?.photo_url ?? '')

  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    country_id: initialData?.country_id ?? '',
    province_id: initialData?.province_id ?? '',
    city: initialData?.city ?? '',
    address: initialData?.address ?? '',
    description: initialData?.description ?? '',
    latitude: initialData?.latitude?.toString() ?? '',
    longitude: initialData?.longitude?.toString() ?? '',
    visited_at: initialData?.visited_at?.slice(0, 10) ??
      new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    async function loadLocations() {
      try {
        const [countryData, provinceData] = await Promise.all([
          getCountries(),
          getProvinces(),
        ])

        setCountries(countryData)
        setProvinces(provinceData)
      } catch {
        setError('Gagal mengambil data negara dan provinsi.')
      } finally {
        setLoadingLocations(false)
      }
    }

    loadLocations()
  }, [])

  useEffect(() => {
    if (!photoFile) return

    const objectUrl = URL.createObjectURL(photoFile)
    setPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [photoFile])

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handlePhotoChange(file: File | undefined) {
    if (!file) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Format foto harus JPG, PNG, atau WebP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto maksimal 5 MB.')
      return
    }

    setError('')
    setPhotoFile(file)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      let photoUrl = initialData?.photo_url ?? null

      if (photoFile) {
        photoUrl = await uploadDestinationImage(photoFile, token)
      }

      const latitude = form.latitude.trim()
        ? Number(form.latitude)
        : null

      const longitude = form.longitude.trim()
        ? Number(form.longitude)
        : null

      if (
        (latitude !== null && !Number.isFinite(latitude)) ||
        (longitude !== null && !Number.isFinite(longitude))
      ) {
        throw new Error('Koordinat harus berupa angka yang valid.')
      }

      if (
        (latitude === null) !== (longitude === null)
      ) {
        throw new Error('Isi latitude dan longitude secara bersamaan.')
      }

      const place = {
        name: form.name.trim(),
        country_id: form.country_id || null,
        province_id: form.province_id || null,
        city: form.city.trim() || null,
        address: form.address.trim() || null,
        description: form.description.trim() || null,
        photo_url: photoUrl,
        latitude,
        longitude,
        visited_at: form.visited_at || null,
      }

      if (!place.name) {
        throw new Error('Nama tempat wajib diisi.')
      }

      if (initialData) {
        await adminPlaces(
          'update',
          { id: initialData.id, place },
          token
        )
      } else {
        await adminPlaces('create', { place }, token)
      }

      onSuccess()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan Places.'
      )
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-[#e9e5da] bg-white px-4 py-3 text-sm outline-none focus:border-[#244C3A]'

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-[#e9e5da] bg-white p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold">
            {initialData ? 'Edit Places' : 'Tambah Places'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Simpan tempat menarik yang pernah kamu kunjungi.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold">
          Nama tempat *
          <input
            required
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Contoh: Kopi Senja"
            className={inputClass}
          />
        </label>

        <label className="space-y-2 text-sm font-semibold">
          Tanggal kunjungan
          <input
            type="date"
            value={form.visited_at}
            onChange={(e) => updateField('visited_at', e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="space-y-2 text-sm font-semibold">
          Negara
          <select
            value={form.country_id}
            onChange={(e) => updateField('country_id', e.target.value)}
            className={inputClass}
            disabled={loadingLocations}
          >
            <option value="">Pilih negara</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </label>

{countries.find((country) => country.id === form.country_id)?.name === 'Indonesia' && (
  <div>
    <label>Provinsi</label>
    <select
    className="w-full rounded-xl border border-[#e9e5da] bg-white px-4 py-3 text-sm outline-none focus:border-[#244C3A]"
      value={form.province_id}
      onChange={(e) => updateField('province_id', e.target.value)}
    >
      <option value="">Pilih Provinsi</option>
      {provinces.map((province) => (
        <option key={province.id} value={province.id}>
          {province.name}
        </option>
      ))}
    </select>
  </div>
)}

        <label className="space-y-2 text-sm font-semibold">
          Kota
          <input
            value={form.city}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="Nama kota"
            className={inputClass}
          />
        </label>

        <label className="space-y-2 text-sm font-semibold">
          Alamat
          <input
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Alamat lengkap"
            className={inputClass}
          />
        </label>

        <label className="space-y-2 text-sm font-semibold">
          Latitude
          <input
            type="number"
            step="any"
            value={form.latitude}
            onChange={(e) => updateField('latitude', e.target.value)}
            placeholder="-6.200000"
            className={inputClass}
          />
        </label>

        <label className="space-y-2 text-sm font-semibold">
          Longitude
          <input
            type="number"
            step="any"
            value={form.longitude}
            onChange={(e) => updateField('longitude', e.target.value)}
            placeholder="106.816666"
            className={inputClass}
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-semibold">
        Deskripsi
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Ceritakan sedikit tentang tempat ini..."
          className={inputClass}
        />
      </label>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Foto tempat</p>

        <label className="flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#e9e5da] bg-[#faf9f5] p-4 text-center hover:bg-[#f5f4ef]">
          {preview ? (
            <img
              src={preview}
              alt="Preview Places"
              className="h-48 w-full rounded-lg object-cover"
            />
          ) : (
            <>
              <ImagePlus size={28} className="text-gray-400" />
              <span className="mt-2 text-sm text-gray-500">
                Klik untuk memilih foto
              </span>
            </>
          )}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handlePhotoChange(e.target.files?.[0])}
          />
        </label>

        <p className="text-xs text-gray-400">
          JPG, PNG, atau WebP. Maksimal 5 MB.
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-[#eeeae1] pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-[#e9e5da] px-5 py-3 text-sm font-semibold"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#244C3A] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Menyimpan...' : 'Simpan Places'}
        </button>
      </div>
    </form>
  )
}
