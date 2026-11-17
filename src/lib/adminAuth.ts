
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

type AdminLoginResponse = {
  success: boolean
  message: string
  token: string
  expires_at: string
}

export async function adminLogin(code: string): Promise<AdminLoginResponse> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/admin-login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ code }),
    }
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Login admin gagal')
  }

  return result as AdminLoginResponse
}
