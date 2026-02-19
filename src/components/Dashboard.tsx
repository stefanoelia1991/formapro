import { useEffect, useState } from 'react'
import { supabase, statoColore, statoLabel } from '../lib/supabase'
import FormAttestato from './FormAttestato'
import FormApprendistato from './FormApprendistato'
import * as XLSX from 'xlsx'

export default function Dashboard() {
  const [attestati, setAttestati] = useState<any[]>([])
  const [apprendisti, setApprendisti] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStato, setFiltroStato] = useState('')
  const [filtroAzienda, setFiltroAzienda] = useState('')
  const [ricerca, setRicerca] = useState('')
  const [aziende, setAziende] = useState<any[]>([])
  const [tab, setTab] = useState<'attestati'|'apprendisti'>('attestati')
  const [formAttestato, setFormAttestato] = useState(false)
  const [formApp, setFormApp] = useState(false)
  const [attestatoSel, setAttestatoSel] = useState<any>(null)
  const [appSel, setAppSel] = useState<any>(null)

  useEffect(() => { caricaDati() }, [])

  async function caricaDati() {
    setLoading(true)
    const [{ data: att }, { data: app }, { data: az }] = await Promise.all([
      supabase.from('v_scadenzario').select('*').order('data_scadenza', { ascending: true }),
      supabase.from('v_apprendistato').select('*').order('prossima_scadenza', { ascending: true }),
      supabase.from('aziende').select('id,nome').eq('attiva', true)
    ])
    setAttestati(att || [])
    setApprendisti(app || [])
    setAziende(az || [])
    setLoading(false)
  }

  const attestatiFiltrati = attestati.filter(a => {
    if (filtroStato && a.stato_live !== filtroStato) return false
    if (filtroAzienda && a.azienda_id !== filtroAzienda) return false
    if (ricerca && !a.cognome_nome?.toLowerCase().includes(ricerca.toLowerCase())) return false
    return true
  })

  const kpi = {
    valido:  attestati.filter(a => a.stato_live === 'VALIDO').length,
    scad6m:  attestati.filter(a => a.stato_live === 'IN_SCADENZA_6M').length,
    scad12m: attestati.filter(a => a.stato_live === 'IN_SCADENZA_12M').length,
    scaduto: attestati.filter(a => a.stato_live === 'SCADUTO').length,
  }

  async function eliminaAttestato(id: string) {
    if (!confirm('Eliminare questo attestato?')) return
    await supabase.from('attestati').delete().eq('id', id)
    caricaDati()
  }

  async function eliminaApp(id: string) {
    if (!confirm('Eliminare questo apprendista?')) return
    await supabase.from('apprendistato').delete().eq('id', id)
    caricaDati()
  }

  function esportaExcel() {
    const dati = attestatiFiltrati.map(a => ({
      'Nominativo': a.cognome_nome,
      'Codice Fiscale': a.codice_fiscale,
      'Azienda': a.nome_azienda,
      'Tipologia': a.tipologia,
      'Corso': a.nome_corso,
      'Protocollo': a.protocollo,
      'Data Inizio': a.data_inizio,
      'Data Fine': a.data_fine,
      'Data Attestato': a.data_attestato,
      'Scadenza': a.data_scadenza,
      'Giorni Residui': a.giorni_residui,
      'Stato': a.stato_live,
    }))
    const ws = XLSX.utils.json_to_sheet(dati)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Scadenzario')
    XLSX.writeFile(wb, `Scadenzario_${new Date().toLocaleDateString('it-IT').replace(/\//g,'-')}.xlsx`)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400">Caricamento dati...</div>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {formAttestato && (
        <FormAttestato
          attestato={attestatoSel}
          onSalva={() => { setFormAttestato(false); caricaDati() }}
          onChiudi={() => setFormAttestato(false)}
        />
      )}

      {formApp && (
        <FormApprendistato
          apprendistato={appSel}
          onSalva={() => { setFormApp(false); caricaDati() }}
          onChiudi={() => setFormApp(false)}
        />
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Validi', value: kpi.valido, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'In scadenza (6m)', value: kpi.scad6m, color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'In scadenza (12m)', value: kpi.scad12m, color: 'bg-orange-50 border-orange-200 text-orange-700' },
          { label: 'Scaduti', value: kpi.scaduto, color: 'bg-red-50 border-red-200 text-red-700' },
        ].map(k => (
          <div key={k.label} className={`border rounded-xl p-4 ${k.color}`}>
            <div className="text-3xl font-bold">{k.value}</div>
            <div className="text-sm mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('attestati')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'attestati' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Formazione Sicurezza ({attestati.length})
        </button>
        <button onClick={() => setTab('apprendisti')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'apprendisti' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Apprendistato ({apprendisti.length})
        </button>
      </div>

      {tab === 'attestati' && (
        <div>
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48" placeholder="Cerca per nome..." value={ricerca} onChange={e => setRicerca(e.target.value)} />
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filtroStato} onChange={e => setFiltroStato(e.target.value)}>
              <option value="">Tutti gli stati</option>
              <option value="VALIDO">Valido</option>
              <option value="IN_SCADENZA_6M">In scadenza (6 mesi)</option>
              <option value="IN_SCADENZA_12M">In scadenza (12 mesi)</option>
              <option value="SCADUTO">Scaduto</option>
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filtroAzienda} onChange={e => setFiltroAzienda(e.target.value)}>
              <option value="">Tutte le aziende</option>
              {aziende.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
            <button onClick={() => { setFiltroStato(''); setFiltroAzienda(''); setRicerca('') }} className="text-sm text-gray-400 hover:text-gray-600">
              Azzera filtri
            </button>
            <div className="ml-auto flex gap-2">
              <button onClick={esportaExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                📥 Esporta Excel
              </button>
              <button onClick={() => { setAttestatoSel(null); setFormAttestato(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                + Nuovo Attestato
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Nominativo</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Azienda</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Corso</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Protocollo</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Scadenza</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Giorni</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Stato</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attestatiFiltrati.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{a.cognome_nome}</td>
                      <td className="px-4 py-3 text-gray-600">{a.nome_azienda}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-48 truncate">{a.nome_corso}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.protocollo}</td>
                      <td className="px-4 py-3 text-gray-600">{a.data_scadenza ? new Date(a.data_scadenza).toLocaleDateString('it-IT') : '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{a.giorni_residui ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statoColore(a.stato_live)}`}>
                          {statoLabel(a.stato_live)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => { setAttestatoSel(a); setFormAttestato(true) }} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Modifica</button>
                          <button onClick={() => eliminaAttestato(a.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Elimina</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attestatiFiltrati.length === 0 && (
                <div className="text-center py-8 text-gray-400">Nessun risultato</div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'apprendisti' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setAppSel(null); setFormApp(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              + Nuovo Apprendista
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Nominativo</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Azienda</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Inizio</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Fine Contratto</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Annualità Consegnate</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Da Fare</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Prossima Scadenza</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Stato</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {apprendisti.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{a.cognome_nome}</td>
                      <td className="px-4 py-3 text-gray-600">{a.nome_azienda}</td>
                      <td className="px-4 py-3 text-gray-600">{a.data_inizio ? new Date(a.data_inizio).toLocaleDateString('it-IT') : '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{a.data_fine_contratto ? new Date(a.data_fine_contratto).toLocaleDateString('it-IT') : '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{a.annualita_consegnate || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{a.annualita_da_fare || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{a.prossima_scadenza ? new Date(a.prossima_scadenza).toLocaleDateString('it-IT') : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statoColore(a.stato_live)}`}>
                          {statoLabel(a.stato_live)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => { setAppSel(a); setFormApp(true) }} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Modifica</button>
                          <button onClick={() => eliminaApp(a.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Elimina</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}