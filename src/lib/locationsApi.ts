
import { supabase } from './supabase'

export async function getCountries() {
  const { data, error } = await supabase
    .from('countries')
    .select('id, name')
    .order('name')

  if (error) {
    console.error('Gagal mengambil negara:', error.message)
    throw error
  }

  return data ?? []
}

export async function getProvinces() {
  const { data, error } = await supabase
    .from('provinces')
    .select('id, name')
    .order('name')

  if (error) {
    console.error('Gagal mengambil provinsi:', error.message)
    throw error
  }

  return data ?? []
}
