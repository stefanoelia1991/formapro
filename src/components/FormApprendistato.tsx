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
  const [nuovoDip, setNuovoDip] = useState(false)
  const [nuovaAz, setNuovaAz] = useState(false)
  const [newDip, setNewDip] = useState({ cognome_nome: '', codice_fiscale: '', mansione: '', email: '' })
  const [newAz, setNewAz] = useState({ nome: '', partita_iva: '', email: '' })
  const [form, setForm] = useState({
    dipendente_id: '', azienda_id: '', data_inizio: '', data_fine_contratto: '',
    annualita_consegnate: '', annualita_da_fare: '', prossima_scadenza: '', stato: 'ATTIVO', note: '',
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

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function creaNuovaAzienda() {
    if (!newAz.nome) { alert('Inserisci almeno il nome azienda'); return }
    const { data, error } = await supabase.from('aziende').insert({
      nome: newAz.nome.trim(),
      partita_iva: newAz.partita_iva.trim() || null,
      email: newAz.email.trim() || null,
      attiva: true,
    }).select().single()
    if (error) { alert('Errore nella creazione azienda'); return }
    await caricaDati()
    set('azienda_id', data.id)
    setNuovaAz(false)
    setNewAz({ nome: '', partita_iva: '', email: '' })
  }

  async function creaNuovoDipendente() {
    if (!newDip.cognome_nome || !form.azienda_id) {
      alert("Inserisci almeno il nome e seleziona prima l'azienda")
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
    await caricaDati()
    set('dipendente_id', data.id)
    setNuovoDip(false)
    setNewDip({ cognome_nome: '', codice_fiscale: '', mansione: '', email: '' })
  }

  async function salva() {
    if (!form.dipendente_id || !form.azienda_id) {
      alert('Compila i campi obbligatori: Azienda e Apprendista')
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

  function MiniForm({ titolo, campi, onSalva, onAnnulla }: any) {
    return (
      <div style={{ gridColumn: '1 / -1', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1', marginBottom: '12px' }}>{titolo}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          {campi}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onSalva} style={{ background: '#0369a1', color: 'white', border: 'none', borderRadius: '7px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Salva
          </button>
          <button onClick={onAnnulla} style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
            Annulla
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
              {apprendistato ? 'Modifica Apprendista' : 'Nuovo Apprendista'}
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
              onChange={e => {
                if (e.target.value === '__nuova__') { setNuovaAz(true); set('azienda_id', '') }
                else { set('azienda_id', e.target.value); set('dipendente_id', ''); setNuovoDip(false) }
              }}
            >
              <option value="">Seleziona azienda</option>
              {aziende.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              <option value="__nuova__">➕ Aggiungi nuova azienda...</option>
            </select>
          </div>

          {/* Apprendista */}
          <div>
            <label style={labelStyle}>Apprendista *</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.dipendente_id}
              onChange={e => {
                if (e.target.value === '__nuovo__') { setNuovoDip(true); set('dipendente_id', '') }
                else set('dipendente_id', e.target.value)
              }}
            >
              <option value="">Seleziona apprendista</option>
              {dipendentiFiltrati.map(d => <option key={d.id} value={d.id}>{d.cognome_nome}</option>)}
              <option value="__nuovo__">➕ Aggiungi nuovo apprendista...</option>
            </select>
          </div>

          {/* Mini-form nuova azienda */}
          {nuovaAz && (
            <MiniForm
              titolo="➕ Nuova Azienda"
              onSalva={creaNuovaAzienda}
              onAnnulla={() => setNuovaAz(false)}
              campi={<>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ ...labelStyle, color: '#0369a1' }}>Nome Azienda *</label>
                  <input style={inputStyle} placeholder="Es. Mario Rossi S.r.l."
                    value={newAz.nome} onChange={e => setNewAz(a => ({ ...a, nome: e.target.value }))} />
                </div>
                <div>
                  <label style={{ ...labelStyle, color: '#0369a1' }}>Partita IVA</label>
                  <input style={inputStyle} placeholder="Es. 01234567890"
                    value={newAz.partita_iva} onChange={e => setNewAz(a => ({ ...a, partita_iva: e.target.value }))} />
                </div>
                <div>
                  <label style={{ ...labelStyle, color: '#0369a1' }}>Email</label>
                  <input style={inputStyle} placeholder="Es. info@azienda.it"
                    value={newAz.email} onChange={e => setNewAz(a => ({ ...a, email: e.target.value }))} />
                </div>
              </>}
            />
          )}

          {/* Mini-form nuovo apprendista */}
          {nuovoDip && (
            <MiniForm
              titolo="➕ Nuovo Apprendista"
              onSalva={creaNuovoDipendente}
              onAnnulla={() => setNuovoDip(false)}
              campi={<>
                <div>
                  <label style={{ ...labelStyle, color: '#0369a1' }}>Nome e Cognome *</label>
                  <input style={inputStyle} placeholder="Es. Rossi Mario"
                    value={newDip.cognome_nome} onChange={e => setNewDip(d => ({ ...d, cognome_nome: e.target.value }))} />
                </div>
                <div>
                  <label style={{ ...labelStyle, color: '#0369a1' }}>Codice Fiscale</label>
                  <input style={{ ...inputStyle, textTransform: 'uppercase' }} placeholder="Es. RSSMRA80A01H703Z"
                    value={newDip.codice_fiscale} onChange={e => setNewDip(d => ({ ...d, codice_fiscale: e.target.value }))} />
                </div>
                <div>
                  <label style={{ ...labelStyle, color: '#0369a1' }}>Mansione</label>
                  <input style={inputStyle} placeholder="Es. Operaio"
                    value={newDip.mansione} onChange={e => setNewDip(d => ({ ...d, mansione: e.target.value }))} />
                </div>
                <div>
                  <label style={{ ...labelStyle, color: '#0369a1' }}>Email</label>
                  <input style={inputStyle} placeholder="Es. mario@azienda.it"
                    value={newDip.email} onChange={e => setNewDip(d => ({ ...d, email: e.target.value }))} />
                </div>
              </>}
            />
          )}

          <div>
            <label style={labelStyle}>Data Inizio Contratto</label>
            <input type="date" style={inputStyle} value={form.data_inizio} onChange={e => set('data_inizio', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Data Fine Contratto</label>
            <input type="date" style={inputStyle} value={form.data_fine_contratto} onChange={e => set('data_fine_contratto', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Annualità Consegnate</label>
            <input style={inputStyle} value={form.annualita_consegnate} onChange={e => set('annualita_consegnate', e.target.value)} placeholder="Es. 1° e 2°" />
          </div>
          <div>
            <label style={labelStyle}>Annualità da Fare</label>
            <input style={inputStyle} value={form.annualita_da_fare} onChange={e => set('annualita_da_fare', e.target.value)} placeholder="Es. 3° a Maggio" />
          </div>
          <div>
            <label style={labelStyle}>Prossima Scadenza</label>
            <input type="date" style={inputStyle} value={form.prossima_scadenza} onChange={e => set('prossima_scadenza', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Stato</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.stato} onChange={e => set('stato', e.target.value)}>
              <option value="ATTIVO">✅ Attivo</option>
              <option value="IN_SCADENZA">⚠️ In scadenza</option>
              <option value="SCADUTO">❌ Scaduto</option>
              <option value="CESSATO">🚫 Cessato</option>
              <option value="COMPLETATO">🎓 Completato</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Note</label>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Note aggiuntive..." />
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onChiudi} style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
            Annulla
          </button>
          <button onClick={salva} disabled={loading} style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '600', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Salvataggio...' : 'Salva Apprendista'}
          </button>
        </div>
      </div>
    </div>
  )
}