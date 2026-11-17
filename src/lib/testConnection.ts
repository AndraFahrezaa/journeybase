
import { supabase } from './supabase'

export async function testConnection() {
  const { data, error } = await supabase
    .from('countries')
    .select('id')
    .limit(1)

  if (error) {
    console.error('Supabase connection failed:', error.message)
    return
  }

  console.log('Supabase connection successful!', data)
}
