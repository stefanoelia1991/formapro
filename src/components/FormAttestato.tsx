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
  const [nuovoDip, setNuovoDip] = useState(false)
  const [newDip, setNewDip] = useState({ cognome_nome: '', codice_fiscale: '', mansione: '', email: '' })
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

  async function creaNuovoDipendente() {
    if (!newDip.cognome_nome || !form.azienda_id) {
      alert('Inserisci almeno il nome e seleziona prima l\'azienda')
      return
    }
    const { data, error } = await supabase.from('dipendenti').insert({
      cognome_nome: newDip.cognome_nome.trim(),
      codice_fiscale: newDip.codice_fiscale.trim().toUpperCase() || null,
      mansione: newDip.mansione.trim() || null,
      email: newDip.email.trim() || null,
      azienda_id: form.azienda_id,
      attivo: true,
    }).select().single()

    if (error) { alert('Errore nella creazione del dipendente'); return }

    // Aggiorna lista e seleziona il nuovo dipendente
    await caricaDati()
    set('dipendente_id', data.id)
    setNuovoDip(false)
    setNewDip({ cognome_nome: '', codice_fiscale: '', mansione: '', email: '' })
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

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    border: '1px solid #e2e8f0', borderRadius: '8px',
    padding: '9px 12px', fontSize: '13px', color: '#0f172a',
    outline: 'none', background: 'white',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: '600',
    color: '#374151', marginBottom: '5px',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
              {attestato ? 'Modifica Attestato' : 'Nuovo Attestato'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>Compila i campi obbligatori *</p>
          </div>
          <button onClick={onChiudi} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Azienda */}
          <div>
            <label style={labelStyle}>Azienda *</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.azienda_id}
              onChange={e => { set('azienda_id', e.target.value); set('dipendente_id', ''); setNuovoDip(false) }}
            >
              <option value="">Seleziona azienda</option>
              {aziende.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>

          {/* Dipendente */}
          <div>
            <label style={labelStyle}>Dipendente *</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select style={{ ...inputStyle, cursor: 'pointer', flex: 1 }}
                value={form.dipendente_id}
                onChange={e => {
                  if (e.target.value === '__nuovo__') { setNuovoDip(true); set('dipendente_id', '') }
                  else set('dipendente_id', e.target.value)
                }}
              >
                <option value="">Seleziona dipendente</option>
                {dipendentiFiltrati.map(d => <option key={d.id} value={d.id}>{d.cognome_nome}</option>)}
                <option value="__nuovo__">➕ Aggiungi nuovo dipendente...</option>
              </select>
            </div>
          </div>

          {/* Mini-form nuovo dipendente */}
          {nuovoDip && (
            <div style={{ gridColumn: '1 / -1', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1', marginBottom: '12px' }}>
                ➕ Nuovo Dipendente
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ ...labelStyle, color: '#0369a1' }}>Nome e Cognome *</label>
                  <input style={inputStyle} placeholder="Es. Rossi Mario"
                    value={newDip.cognome_nome}
                    onChange={e => setNewDip(d => ({ ...d, cognome_nome: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, color: '#0369a1' }}>Codice Fiscale</label>
                  <input style={{ ...inputStyle, textTransform: 'uppercase' }} placeholder="Es. RSSMRA80A01H703Z"
                    value={newDip.codice_fiscale}
                    onChange={e => setNewDip(d => ({ ...d, codice_fiscale: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, color: '#0369a1' }}>Mansione</label>
                  <input style={inputStyle} placeholder="Es. Operaio"
                    value={newDip.mansione}
                    onChange={e => setNewDip(d => ({ ...d, mansione: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, color: '#0369a1' }}>Email</label>
                  <input style={inputStyle} placeholder="Es. mario@azienda.it"
                    value={newDip.email}
                    onChange={e => setNewDip(d => ({ ...d, email: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={creaNuovoDipendente}
                  style={{ background: '#0369a1', color: 'white', border: 'none', borderRadius: '7px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Salva dipendente
                </button>
                <button onClick={() => setNuovoDip(false)}
                  style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
                  Annulla
                </button>
              </div>
            </div>
          )}

          {/* Tipologia */}
          <div>
            <label style={labelStyle}>Tipologia *</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.tipologia} onChange={e => set('tipologia', e.target.value)}>
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

          {/* Protocollo */}
          <div>
            <label style={labelStyle}>Protocollo</label>
            <input style={inputStyle} value={form.protocollo} onChange={e => set('protocollo', e.target.value)} placeholder="Es. FC21513" />
          </div>

          {/* Nome corso */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Nome Corso *</label>
            <input style={inputStyle} value={form.nome_corso} onChange={e => set('nome_corso', e.target.value)} placeholder="Nome corso come da attestato" />
          </div>

          {/* Date */}
          <div>
            <label style={labelStyle}>Data Inizio Corso</label>
            <input type="date" style={inputStyle} value={form.data_inizio} onChange={e => set('data_inizio', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Data Fine Corso</label>
            <input type="date" style={inputStyle} value={form.data_fine} onChange={e => set('data_fine', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Data Attestato</label>
            <input type="date" style={inputStyle} value={form.data_attestato} onChange={e => set('data_attestato', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Data Scadenza</label>
            <input type="date" style={inputStyle} value={form.data_scadenza} onChange={e => set('data_scadenza', e.target.value)} />
          </div>

          {/* Note */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Note</label>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Note aggiuntive..." />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onChiudi} style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
            Annulla
          </button>
          <button onClick={salva} disabled={loading} style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '600', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Salvataggio...' : 'Salva Attestato'}
          </button>
        </div>
      </div>
    </div>
  )
}