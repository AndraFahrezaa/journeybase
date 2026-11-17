
import { useEffect, useState } from 'react'
import { getCountries, getProvinces } from '../lib/locationsApi'
import { adminDestinations } from '../lib/adminApi'
import { uploadDestinationImage } from '../lib/uploadImageApi'

type Option = {
  id: string
  name: string
}

type DestinationFormProps = {
  token: string
  onSuccess: () => void
  onCancel: () => void
  initialData?: {
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
  }
}

export default function DestinationForm({
  token,
  onSuccess,
  onCancel,
  initialData,
}: DestinationFormProps) {
  const [countries, setCountries] = useState<Option[]>([])
  const [provinces, setProvinces] = useState<Option[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

const [name, setName] = useState(initialData?.name ?? '')
const [countryId, setCountryId] = useState(initialData?.country_id ?? '')
const [provinceId, setProvinceId] = useState(initialData?.province_id ?? '')
const [cityRegion, setCityRegion] = useState(initialData?.city_region ?? '')
const [description, setDescription] = useState(initialData?.description ?? '')
const [latitude, setLatitude] = useState(
  initialData?.latitude?.toString() ?? ''
)
const [longitude, setLongitude] = useState(
  initialData?.longitude?.toString() ?? ''
)
const [status, setStatus] = useState<'wishlist' | 'visited'>(
  initialData?.status ?? 'wishlist'
)
const [photoFile, setPhotoFile] = useState<File | null>(null)
const [photoPreview, setPhotoPreview] = useState(
  initialData?.photo_url ?? ''
)
  useEffect(() => {
    async function loadOptions() {
      try {
        const [countryData, provinceData] = await Promise.all([
          getCountries(),
          getProvinces(),
        ])

        setCountries(countryData)
        setProvinces(provinceData)
      } catch {
        setError('Gagal memuat pilihan negara atau provinsi.')
      } finally {
        setLoadingOptions(false)
      }
    }

    loadOptions()
  }, [])

  const selectedCountry = countries.find(
    (country) => country.id === countryId
  )

  const isIndonesia = selectedCountry?.name
    .trim()
    .toLowerCase() === 'indonesia'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

 try {
  let photoUrl = initialData?.photo_url ?? null

  // Upload foto baru jika Admin memilih foto
  if (photoFile) {
    photoUrl = await uploadDestinationImage(photoFile, token)
  }

  await adminDestinations(
    initialData ? 'update' : 'create',
    {
      ...(initialData ? { id: initialData.id } : {}),
      destination: {
        name: name.trim(),
        country_id: countryId || null,
        province_id: isIndonesia ? provinceId || null : null,
        city_region: cityRegion.trim() || null,
        description: description.trim() || null,
        photo_url: photoUrl,
        latitude: latitude === '' ? null : Number(latitude),
        longitude: longitude === '' ? null : Number(longitude),
        status,
      },
    },
    token
  )
      onSuccess()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menambahkan destinasi.'
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
      <div>
        <h2 className="font-heading text-xl font-bold text-[#244C3A]">
          {initialData ? 'Edit Destinasi' : 'Tambah Destinasi'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {initialData
  ? 'Perbarui informasi destinasi yang sudah tersimpan.'
  : 'Masukkan informasi tempat yang ingin kamu simpan.'}
        </p>
      </div>

      {loadingOptions ? (
        <p className="text-sm text-gray-500">Memuat pilihan lokasi...</p>
      ) : (
        <>
          <div>
            <label className="text-sm font-semibold">Nama Destinasi *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Candi Borobudur"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Negara</label>
            <select
              value={countryId}
              onChange={(e) => {
                setCountryId(e.target.value)
                setProvinceId('')
              }}
              className={inputClass}
            >
              <option value="">Pilih negara</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {isIndonesia && (
            <div>
              <label className="text-sm font-semibold">Provinsi</label>
              <select
                value={provinceId}
                onChange={(e) => setProvinceId(e.target.value)}
                className={inputClass}
              >
                <option value="">Pilih provinsi</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold">Kota / Wilayah</label>
            <input
              value={cityRegion}
              onChange={(e) => setCityRegion(e.target.value)}
              placeholder="Contoh: Magelang"
              className={inputClass}
            />
          </div>

          <div>

<div>
  <label className="text-sm font-semibold">Foto Cover Destinasi</label>
  <p className="mt-1 text-xs text-gray-500">
    JPG, PNG, atau WebP. Maksimal 5 MB.
  </p>

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={(e) => {
      const file = e.target.files?.[0] ?? null

      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran foto maksimal 5 MB.')
        e.target.value = ''
        return
      }

      setError('')
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }}
    className={inputClass}
  />

  {photoPreview && (
    <img
      src={photoPreview}
      alt="Preview foto cover"
      className="mt-3 h-48 w-full rounded-xl object-cover"
    />
  )}
</div>
            <label className="text-sm font-semibold">Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan sedikit tentang destinasi ini..."
              rows={4}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="-7.6079"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="110.2038"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'wishlist' | 'visited')
              }
              className={inputClass}
            >
              <option value="wishlist">Wishlist</option>
              <option value="visited">Visited</option>
            </select>
          </div>
        </>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-[#e9e5da] px-5 py-3 text-sm font-semibold"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={saving || loadingOptions}
          className="rounded-xl bg-[#244C3A] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving
  ? 'Menyimpan...'
  : initialData
    ? 'Simpan Perubahan'
    : 'Simpan Destinasi'}
        </button>
      </div>
    </form>
  )
}
