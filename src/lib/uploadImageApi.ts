
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function uploadDestinationImage(
  file: File,
  token: string
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/admin-upload-image`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: formData,
    }
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Gagal mengunggah foto')
  }

  return result.photo_url
}
