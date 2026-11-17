
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function callAdminFunction(
  functionName: string,
  body: Record<string, unknown>,
  token: string,
  fallbackMessage: string
) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    }
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.error || result.message || fallbackMessage
    )
  }

  return result
}

export async function adminDestinations(
  action: 'create' | 'update' | 'delete',
  payload: {
    id?: string
    destination?: Record<string, unknown>
  },
  token: string
) {
  return callAdminFunction(
    'admin-destinations',
    { action, ...payload },
    token,
    'Gagal memproses destinasi'
  )
}

export async function adminPlaces(
  action: 'create' | 'update' | 'delete',
  payload: {
    id?: string
    place?: Record<string, unknown>
  },
  token: string
) {
  return callAdminFunction(
    'admin-places',
    { action, ...payload },
    token,
    'Gagal memproses Places'
  )
}

export async function adminRestoreBackup(
  backup: Record<string, unknown>,
  token: string
) {
  return callAdminFunction(
    'admin-restore-backup',
    backup,
    token,
    'Gagal memulihkan backup'
  )
}
