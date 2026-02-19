import { useEffect, useState } from 'react'
import { supabase, statoLabel } from '../lib/supabase'
import FormAttestato from './FormAttestato'
import FormApprendistato from './FormApprendistato'
import * as XLSX from 'xlsx'

const S = {
  // Colori sistema
  blue: '#2563eb',
  blueDark: '#1d4ed8',
  blueLight: '#eff6ff',
  green: '#16a34a',
  greenLight: '#f0fdf4',
  amber: '#d97706',
  amberLight: '#fffbeb',
  orange: '#ea580c',
  orangeLight: '#fff7ed',
  red: '#dc2626',
  redLight: '#fef2f2',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray700: '#334155',
  gray900: '#0f172a',
  white: '#ffffff',
}

export default function Dashboard() {
  const [attestati, setAttestati] = useState<any[]>([])
  const [apprendisti, setApprendisti] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStato, setFiltroStato] = useState('')
  const [filtroAzienda, setFiltroAzienda] = useState('')
  const [ricerca, setRicerca] = useState('')
  const [aziende, setAziende] = useState<any[]>([])
  const [tab, setTab] = useState<'attestati' | 'apprendisti'>('attestati')
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
    XLSX.writeFile(wb, `Scadenzario_${new Date().toLocaleDateString('it-IT').replace(/\//g, '-')}.xlsx`)
  }

  const statoColorInline: Record<string, { bg: string; color: string; border: string }> = {
    VALIDO:           { bg: S.greenLight,  color: S.green,  border: '#bbf7d0' },
    IN_SCADENZA_6M:  { bg: S.amberLight,  color: S.amber,  border: '#fde68a' },
    IN_SCADENZA_12M: { bg: S.orangeLight, color: S.orange, border: '#fed7aa' },
    SCADUTO:         { bg: S.redLight,    color: S.red,    border: '#fecaca' },
    ATTIVO:          { bg: S.greenLight,  color: S.green,  border: '#bbf7d0' },
    IN_SCADENZA:     { bg: S.amberLight,  color: S.amber,  border: '#fde68a' },
    CESSATO:         { bg: S.gray100,     color: S.gray500, border: S.gray200 },
    COMPLETATO:      { bg: S.blueLight,   color: S.blue,   border: '#bfdbfe' },
  }

  function StatoBadge({ stato }: { stato: string }) {
    const c = statoColorInline[stato] || { bg: S.gray100, color: S.gray500, border: S.gray200 }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
        background: c.bg, color: c.color, border: `1px solid ${c.border}`,
        whiteSpace: 'nowrap',
      }}>
        {statoLabel(stato)}
      </span>
    )
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        width: '40px', height: '40px', border: `3px solid ${S.gray200}`,
        borderTop: `3px solid ${S.blue}`, borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: S.gray400, fontSize: '14px' }}>Caricamento dati...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const inputStyle: React.CSSProperties = {
    background: S.white, border: `1px solid ${S.gray200}`,
    borderRadius: '8px', padding: '8px 12px',
    fontSize: '13px', color: S.gray700, outline: 'none',
    transition: 'border-color 0.15s',
  }

  const btnPrimary: React.CSSProperties = {
    background: `linear-gradient(135deg, ${S.blue}, ${S.blueDark})`,
    border: 'none', borderRadius: '8px', padding: '9px 18px',
    color: S.white, fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
    boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
    whiteSpace: 'nowrap' as const,
  }

  const btnGreen: React.CSSProperties = {
    background: `linear-gradient(135deg, #16a34a, #15803d)`,
    border: 'none', borderRadius: '8px', padding: '9px 18px',
    color: S.white, fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
    boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
    whiteSpace: 'nowrap' as const,
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '10px 16px',
    fontSize: '11px', fontWeight: '600', color: S.gray400,
    textTransform: 'uppercase', letterSpacing: '0.8px',
    background: S.gray50, borderBottom: `1px solid ${S.gray200}`,
    whiteSpace: 'nowrap',
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: '13px',
    color: S.gray700, borderBottom: `1px solid ${S.gray100}`,
    verticalAlign: 'middle',
  }

  const kpiCards = [
    { label: 'Attestati Validi', value: kpi.valido, icon: '✅', bg: S.greenLight, accent: S.green, border: '#bbf7d0', sub: 'In regola' },
    { label: 'In Scadenza 6 Mesi', value: kpi.scad6m, icon: '⚠️', bg: S.amberLight, accent: S.amber, border: '#fde68a', sub: 'Urgente' },
    { label: 'In Scadenza 12 Mesi', value: kpi.scad12m, icon: '🔶', bg: S.orangeLight, accent: S.orange, border: '#fed7aa', sub: 'Attenzione' },
    { label: 'Attestati Scaduti', value: kpi.scaduto, icon: '❌', bg: S.redLight, accent: S.red, border: '#fecaca', sub: 'Da rinnovare' },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>

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

      {/* Header pagina */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: S.gray900, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
          Scadenzario Formazione
        </h2>
        <p style={{ fontSize: '14px', color: S.gray400, margin: 0 }}>
          Monitoraggio certificazioni e apprendistato — aggiornato al {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {kpiCards.map(k => (
          <div key={k.label} style={{
            background: S.white, borderRadius: '14px',
            border: `1px solid ${S.gray200}`,
            padding: '20px 24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: '16px',
            transition: 'box-shadow 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}
          >
            <div style={{
              width: '52px', height: '52px', borderRadius: '12px',
              background: k.bg, border: `1px solid ${k.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', flexShrink: 0,
            }}>
              {k.icon}
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: k.accent, lineHeight: 1, letterSpacing: '-1px' }}>
                {k.value}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: S.gray700, marginTop: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '11px', color: S.gray400 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex', gap: '4px',
        background: S.gray100, borderRadius: '10px',
        padding: '4px', marginBottom: '24px',
        width: 'fit-content',
      }}>
        {[
          { key: 'attestati', label: '🏅 Formazione Sicurezza', count: attestati.length },
          { key: 'apprendisti', label: '📋 Apprendistato', count: apprendisti.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              transition: 'all 0.15s',
              background: tab === t.key ? S.white : 'transparent',
              color: tab === t.key ? S.gray900 : S.gray400,
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t.label}
            <span style={{
              marginLeft: '8px', fontSize: '11px', fontWeight: '700',
              background: tab === t.key ? S.blue : S.gray200,
              color: tab === t.key ? S.white : S.gray500,
              padding: '2px 7px', borderRadius: '20px',
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Contenuto Tab Attestati */}
      {tab === 'attestati' && (
        <div>
          {/* Toolbar */}
          <div style={{
            display: 'flex', gap: '10px', marginBottom: '16px',
            alignItems: 'center', flexWrap: 'wrap',
          }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: S.gray400, fontSize: '14px' }}>🔍</span>
              <input
                style={{ ...inputStyle, paddingLeft: '32px', width: '200px' }}
                placeholder="Cerca nominativo..."
                value={ricerca}
                onChange={e => setRicerca(e.target.value)}
              />
            </div>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={filtroStato} onChange={e => setFiltroStato(e.target.value)}>
              <option value="">Tutti gli stati</option>
              <option value="VALIDO">✅ Valido</option>
              <option value="IN_SCADENZA_6M">⚠️ In scadenza (6 mesi)</option>
              <option value="IN_SCADENZA_12M">🔶 In scadenza (12 mesi)</option>
              <option value="SCADUTO">❌ Scaduto</option>
            </select>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={filtroAzienda} onChange={e => setFiltroAzienda(e.target.value)}>
              <option value="">Tutte le aziende</option>
              {aziende.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
            {(filtroStato || filtroAzienda || ricerca) && (
              <button
                onClick={() => { setFiltroStato(''); setFiltroAzienda(''); setRicerca('') }}
                style={{ background: 'transparent', border: 'none', color: S.gray400, fontSize: '13px', cursor: 'pointer', padding: '4px 8px' }}
              >
                ✕ Azzera
              </button>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button style={btnGreen} onClick={esportaExcel}>
                📥 Esporta Excel
              </button>
              <button style={btnPrimary} onClick={() => { setAttestatoSel(null); setFormAttestato(true) }}>
                + Nuovo Attestato
              </button>
            </div>
          </div>

          {/* Risultati */}
          <div style={{ fontSize: '12px', color: S.gray400, marginBottom: '8px' }}>
            {attestatiFiltrati.length} risultati su {attestati.length} totali
          </div>

          {/* Tabella */}
          <div style={{
            background: S.white, borderRadius: '14px',
            border: `1px solid ${S.gray200}`,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Nominativo</th>
                    <th style={thStyle}>Azienda</th>
                    <th style={thStyle}>Corso</th>
                    <th style={thStyle}>Protocollo</th>
                    <th style={thStyle}>Scadenza</th>
                    <th style={thStyle}>Giorni</th>
                    <th style={thStyle}>Stato</th>
                    <th style={thStyle}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {attestatiFiltrati.map((a, i) => (
                    <tr key={a.id}
                      style={{ background: i % 2 === 0 ? S.white : S.gray50 }}
                      onMouseEnter={e => (e.currentTarget.style.background = S.blueLight)}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? S.white : S.gray50)}
                    >
                      <td style={{ ...tdStyle, fontWeight: '600', color: S.gray900 }}>{a.cognome_nome}</td>
                      <td style={tdStyle}>
                        <span style={{
                          background: S.blueLight, color: S.blue,
                          padding: '2px 8px', borderRadius: '6px',
                          fontSize: '12px', fontWeight: '500',
                        }}>{a.nome_azienda}</span>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: '200px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.nome_corso}>
                          {a.nome_corso}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: S.gray400 }}>{a.protocollo || '—'}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        {a.data_scadenza ? new Date(a.data_scadenza).toLocaleDateString('it-IT') : '—'}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: '600', color: (a.giorni_residui ?? 999) < 0 ? S.red : (a.giorni_residui ?? 999) < 180 ? S.amber : S.gray700 }}>
                        {a.giorni_residui ?? '—'}
                      </td>
                      <td style={tdStyle}><StatoBadge stato={a.stato_live} /></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => { setAttestatoSel(a); setFormAttestato(true) }}
                            style={{ background: 'transparent', border: `1px solid ${S.gray200}`, borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: S.blue, cursor: 'pointer', fontWeight: '500' }}
                          >
                            Modifica
                          </button>
                          <button
                            onClick={() => eliminaAttestato(a.id)}
                            style={{ background: 'transparent', border: 'none', fontSize: '12px', color: S.gray400, cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attestatiFiltrati.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px', color: S.gray400 }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                  <div style={{ fontSize: '14px' }}>Nessun risultato trovato</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contenuto Tab Apprendistato */}
      {tab === 'apprendisti' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button style={btnPrimary} onClick={() => { setAppSel(null); setFormApp(true) }}>
              + Nuovo Apprendista
            </button>
          </div>
          <div style={{
            background: S.white, borderRadius: '14px',
            border: `1px solid ${S.gray200}`, overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Nominativo</th>
                    <th style={thStyle}>Azienda</th>
                    <th style={thStyle}>Inizio</th>
                    <th style={thStyle}>Fine Contratto</th>
                    <th style={thStyle}>Annualità Consegnate</th>
                    <th style={thStyle}>Da Fare</th>
                    <th style={thStyle}>Prossima Scadenza</th>
                    <th style={thStyle}>Stato</th>
                    <th style={thStyle}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {apprendisti.map((a, i) => (
                    <tr key={a.id}
                      style={{ background: i % 2 === 0 ? S.white : S.gray50 }}
                      onMouseEnter={e => (e.currentTarget.style.background = S.blueLight)}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? S.white : S.gray50)}
                    >
                      <td style={{ ...tdStyle, fontWeight: '600', color: S.gray900 }}>{a.cognome_nome}</td>
                      <td style={tdStyle}>
                        <span style={{ background: S.blueLight, color: S.blue, padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
                          {a.nome_azienda}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{a.data_inizio ? new Date(a.data_inizio).toLocaleDateString('it-IT') : '—'}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{a.data_fine_contratto ? new Date(a.data_fine_contratto).toLocaleDateString('it-IT') : '—'}</td>
                      <td style={tdStyle}>{a.annualita_consegnate || '—'}</td>
                      <td style={{ ...tdStyle, color: S.amber, fontWeight: '500' }}>{a.annualita_da_fare || '—'}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{a.prossima_scadenza ? new Date(a.prossima_scadenza).toLocaleDateString('it-IT') : '—'}</td>
                      <td style={tdStyle}><StatoBadge stato={a.stato_live} /></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => { setAppSel(a); setFormApp(true) }}
                            style={{ background: 'transparent', border: `1px solid ${S.gray200}`, borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: S.blue, cursor: 'pointer', fontWeight: '500' }}
                          >
                            Modifica
                          </button>
                          <button
                            onClick={() => eliminaApp(a.id)}
                            style={{ background: 'transparent', border: 'none', fontSize: '12px', color: S.gray400, cursor: 'pointer' }}
                          >
                            ✕
                          </button>
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
