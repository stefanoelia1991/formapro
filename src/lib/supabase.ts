import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseKey)

export type StatoAttestato = 'VALIDO' | 'IN_SCADENZA_12M' | 'IN_SCADENZA_6M' | 'SCADUTO'
export type StatoApp = 'ATTIVO' | 'IN_SCADENZA' | 'SCADUTO' | 'CESSATO' | 'COMPLETATO'

export function statoColore(stato: string) {
  switch(stato) {
    case 'VALIDO':            return 'bg-green-100 text-green-800'
    case 'IN_SCADENZA_6M':   return 'bg-amber-100 text-amber-800'
    case 'IN_SCADENZA_12M':  return 'bg-orange-100 text-orange-800'
    case 'SCADUTO':          return 'bg-red-100 text-red-800'
    case 'ATTIVO':           return 'bg-green-100 text-green-800'
    case 'IN_SCADENZA':      return 'bg-amber-100 text-amber-800'
    case 'CESSATO':          return 'bg-gray-100 text-gray-800'
    default:                 return 'bg-gray-100 text-gray-800'
  }
}

export function statoLabel(stato: string) {
  switch(stato) {
    case 'VALIDO':            return '✅ Valido'
    case 'IN_SCADENZA_6M':   return '⚠️ In scadenza (6 mesi)'
    case 'IN_SCADENZA_12M':  return '🔶 In scadenza (12 mesi)'
    case 'SCADUTO':          return '❌ Scaduto'
    case 'ATTIVO':           return '✅ Attivo'
    case 'IN_SCADENZA':      return '⚠️ In scadenza'
    case 'CESSATO':          return '🚫 Cessato'
    default:                 return stato
  }
}