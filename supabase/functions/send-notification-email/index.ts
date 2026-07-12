/* eslint-disable @typescript-eslint/no-explicit-any */
// Deno 2.0 compatibility shim for legacy smtp library
if (typeof (Deno as any).writeAll !== 'function') {
  (Deno as any).writeAll = async function (w: any, arr: Uint8Array) {
    let nwritten = 0;
    while (nwritten < arr.length) {
      nwritten += await w.write(arr.subarray(nwritten));
    }
  };
}

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { to, subject, html, eventType } = await req.json()

    if (!to || !subject || !html || !eventType) {
      return new Response(
        JSON.stringify({ error: 'Missing required email fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('NOTIFICATION_FROM_EMAIL') || 'Irookee <notifications@irookee.com>'

    if (!resendApiKey) {
      console.warn(`RESEND_API_KEY is not configured. Falling back to local SMTP (Mailpit/Inbucket)`)
      try {
        const { SmtpClient } = await import('https://deno.land/x/smtp@v0.7.0/mod.ts')
        const client = new SmtpClient()
        await client.connect({
          hostname: 'supabase_inbucket_jctawltvlnooqqkltjvb',
          port: 1025,
        })
        await client.send({
          from: fromEmail,
          to,
          subject,
          html,
        })
        await client.close()
        return new Response(
          JSON.stringify({ sent: true, fallback: 'mailpit' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (err) {
        console.error('Local SMTP failed:', err)
        return new Response(
          JSON.stringify({ error: `Local SMTP failed: ${err.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const details = await response.text()
      throw new Error(`Email provider rejected request: ${details}`)
    }

    return new Response(
      JSON.stringify({ sent: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Email notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
