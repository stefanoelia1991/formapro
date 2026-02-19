import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function FormApprendistato({ apprendistato, onSalva, onChiudi }: {
  apprendistato?: any
  onSalva: () => void
  onChiudi: () => void
}) {
  const [dipendenti, setDipendenti] = useState<any[]>([])
  const [aziende, setAziende] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    dipendente_id: '',
    azienda_id: '',
    data_inizio: '',
    data_fine_contratto: '',
    annualita_consegnate: '',
    annualita_da_fare: '',
    prossima_scadenza: '',
    stato: 'ATTIVO',
    note: '',
  })

  useEffect(() => {
    caricaDati()
    if (apprendistato) {
      setForm({
        dipendente_id: apprendistato.dipendente_id || '',
        azienda_id: apprendistato.azienda_id || '',
        data_inizio: apprendistato.data_inizio || '',
        data_fine_contratto: apprendistato.data_fine_contratto || '',
        annualita_consegnate: apprendistato.annualita_consegnate || '',
        annualita_da_fare: apprendistato.annualita_da_fare || '',
        prossima_scadenza: apprendistato.prossima_scadenza || '',
        stato: apprendistato.stato || 'ATTIVO',
        note: apprendistato.note || '',
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

  async function salva() {
    if (!form.dipendente_id || !form.azienda_id) {
      alert('Compila i campi obbligatori: Azienda e Dipendente')
      return
    }
    setLoading(true)
    if (apprendistato) {
      await supabase.from('apprendistato').update(form).eq('id', apprendistato.id)
    } else {
      await supabase.from('apprendistato').insert(form)
    }
    setLoading(false)
    onSalva()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold">{apprendistato ? 'Modifica Apprendista' : 'Nuovo Apprendista'}</h2>
          <button onClick={onChiudi} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Azienda *</label>
            <select className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.azienda_id} onChange={e => { set('azienda_id', e.target.value); set('dipendente_id', '') }}>
              <option value="">Seleziona azienda</option>
              {aziende.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apprendista *</label>
            <select className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.dipendente_id} onChange={e => set('dipendente_id', e.target.value)}>
              <option value="">Seleziona dipendente</option>
              {dipendentiFiltrati.map(d => <option key={d.id} value={d.id}>{d.cognome_nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio Contratto</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.data_inizio} onChange={e => set('data_inizio', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fine Contratto</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.data_fine_contratto} onChange={e => set('data_fine_contratto', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annualità Consegnate</label>
            <input className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.annualita_consegnate} onChange={e => set('annualita_consegnate', e.target.value)} placeholder="es. 1° e 2°" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annualità da Fare</label>
            <input className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.annualita_da_fare} onChange={e => set('annualita_da_fare', e.target.value)} placeholder="es. 3° a Maggio" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prossima Scadenza</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.prossima_scadenza} onChange={e => set('prossima_scadenza', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
            <select className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={form.stato} onChange={e => set('stato', e.target.value)}>
              <option value="ATTIVO">Attivo</option>
              <option value="IN_SCADENZA">In scadenza</option>
              <option value="SCADUTO">Scaduto</option>
              <option value="CESSATO">Cessato</option>
              <option value="COMPLETATO">Completato</option>
            </select>
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