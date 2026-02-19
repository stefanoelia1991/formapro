import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function FormAttestato({ attestato, onSalva, onChiudi }: {
  attestato?: any
  onSalva: () => void
  onChiudi: () => void
}) {
  const [dipendenti, setDipendenti] = useState<any[]>([])
  const [aziende, setAziende] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    dipendente_id: '',
    azienda_id: '',
    tipologia: '',
    nome_corso: '',
    protocollo: '',
    data_inizio: '',
    data_fine: '',
    data_attestato: '',
    data_scadenza: '',
    note: '',
  })

  useEffect(() => {
    caricaDati()
    if (attestato) {
      setForm({
        dipendente_id: attestato.dipendente_id || '',
        azienda_id: attestato.azienda_id || '',
        tipologia: attestato.tipologia || '',
        nome_corso: attestato.nome_corso || '',
        protocollo: attestato.protocollo || '',
        data_inizio: attestato.data_inizio || '',
        data_fine: attestato.data_fine || '',
        data_attestato: attestato.data_attestato || '',
        data_scadenza: attestato.data_scadenza || '',
        note: attestato.note || '',
      })
    }
  }, [])

  async function caricaDati() {
    const [{ data: az }, { data: dip }] = await Promise.all([
      supabase.from('aziende').select('id,nome').eq('attiva', true).order('nome'),
      supabase.from('dipendenti').select('id,cognome_nome,azienda_id').eq('attivo', true).order('cognome_nome')
    ])
    setAziende(az || [])
    setDipendenti(dip || [])
  }

  const dipendentiFiltrati = form.azienda_id
    ? dipendenti.filter(d => d.azienda_id === form.azienda_id)
    : dipendenti

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function calcola_stato(data_scadenza: string) {
    if (!data_scadenza) return 'VALIDO'
    const delta = Math.floor((new Date(data_scadenza).getTime() - new Date().getTime()) / 86400000)
    if (delta < 0) return 'SCADUTO'
    if (delta <= 180) return 'IN_SCADENZA_6M'
    if (delta <= 365) return 'IN_SCADENZA_12M'
    return 'VALIDO'
  }

  async function salva() {
    if (!form.dipendente_id || !form.azienda_id || !form.tipologia || !form.nome_corso) {
      alert('Compila i campi obbligatori: Azienda, Dipendente, Tipologia, Corso')
      return
    }
    setLoading(true)
    const dati = { ...form, stato: calcola_stato(form.data_scadenza) }
    if (attestato) {
      await supabase.from('attestati').update(dati).eq('id', attestato.id)
    } else {
      await supabase.from('attestati').insert(dati)
    }
    setLoading(false)
    onSalva()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold">{attestato ? 'Modifica Attestato' : 'Nuovo Attestato'}</h2>
          <button onClick={onChiudi} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Azienda *</label>
              <select className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.azienda_id} onChange={e => { set('azienda_id', e.target.value); set('dipendente_id', '') }}>
                <option value="">Seleziona azienda</option>
                {aziende.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dipendente *</label>
              <select className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.dipendente_id} onChange={e => set('dipendente_id', e.target.value)}>
                <option value="">Seleziona dipendente</option>
                {dipendentiFiltrati.map(d => <option key={d.id} value={d.id}>{d.cognome_nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipologia *</label>
            <select className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.tipologia} onChange={e => set('tipologia', e.target.value)}>
              <option value="">Seleziona tipologia</option>
              <option>Formazione Lavoratori</option>
              <option>RLS</option>
              <option>RSPP DL</option>
              <option>Antincendio</option>
              <option>Primo Soccorso</option>
              <option>Preposto</option>
              <option>Dirigente</option>
              <option>Altro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Protocollo</label>
            <input className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.protocollo} onChange={e => set('protocollo', e.target.value)} placeholder="es. FC21513" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Corso *</label>
            <input className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.nome_corso} onChange={e => set('nome_corso', e.target.value)} placeholder="Nome corso come da attestato" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio Corso</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.data_inizio} onChange={e => set('data_inizio', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fine Corso</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.data_fine} onChange={e => set('data_fine', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Attestato</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.data_attestato} onChange={e => set('data_attestato', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Scadenza</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.data_scadenza} onChange={e => set('data_scadenza', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea className="w-full border border-gray-200 rounded-lg p-2 text-sm" rows={3} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Note aggiuntive..." />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onChiudi} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annulla</button>
          <button onClick={salva} disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}