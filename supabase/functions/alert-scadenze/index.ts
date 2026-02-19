import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const EMAIL_DESTINATARIO = 'stefanoelia1991@gmail.com'

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Prendi tutti gli attestati in scadenza a 180 o 365 giorni ESATTI oggi
  const oggi = new Date()

  const scadenze180 = new Date(oggi)
  scadenze180.setDate(scadenze180.getDate() + 180)

  const scadenze365 = new Date(oggi)
  scadenze365.setDate(scadenze365.getDate() + 365)

  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const { data: att180 } = await supabase
    .from('v_scadenzario')
    .select('*')
    .eq('data_scadenza', fmt(scadenze180))

  const { data: att365 } = await supabase
    .from('v_scadenzario')
    .select('*')
    .eq('data_scadenza', fmt(scadenze365))

  const tutti = [...(att180 || []), ...(att365 || [])]

  if (tutti.length === 0) {
    return new Response('Nessuna scadenza oggi', { status: 200 })
  }

  // Costruisci tabella HTML email
  const righe = tutti.map(a => `
    <tr style="border-bottom:1px solid #e2e8f0">
      <td style="padding:10px 14px;font-weight:600">${a.cognome_nome}</td>
      <td style="padding:10px 14px;color:#64748b">${a.nome_azienda}</td>
      <td style="padding:10px 14px;color:#64748b">${a.nome_corso}</td>
      <td style="padding:10px 14px;color:#64748b">${a.data_scadenza}</td>
      <td style="padding:10px 14px">
        <span style="background:${a.giorni_residui <= 180 ? '#fef3c7' : '#fff7ed'};color:${a.giorni_residui <= 180 ? '#d97706' : '#ea580c'};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600">
          ${a.giorni_residui} giorni
        </span>
      </td>
    </tr>
  `).join('')

  const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:700px;margin:0 auto">
      <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:32px;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">⏰ Alert Scadenze FormaPro</h1>
        <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px">
          ${tutti.length} attestato/i in scadenza — ${new Date().toLocaleDateString('it-IT')}
        </p>
      </div>
      <div style="background:white;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:10px 14px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Nominativo</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Azienda</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Corso</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Scadenza</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Giorni</th>
            </tr>
          </thead>
          <tbody>${righe}</tbody>
        </table>
        <div style="padding:20px 24px;background:#f8fafc;border-top:1px solid #e2e8f0">
          <a href="https://formapro-khaki.vercel.app" style="background:linear-gradient(135deg,#1e3a8a,#2563eb);color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
            Apri FormaPro →
          </a>
        </div>
      </div>
    </div>
  `

  // Invia email via Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'FormaPro <onboarding@resend.dev>',
      to: [EMAIL_DESTINATARIO],
      subject: `⏰ ${tutti.length} attestato/i in scadenza — FormaPro`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return new Response(`Errore invio email: ${err}`, { status: 500 })
  }

  return new Response(`Email inviata per ${tutti.length} attestati`, { status: 200 })
})