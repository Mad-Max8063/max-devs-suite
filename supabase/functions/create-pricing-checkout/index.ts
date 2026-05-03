import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { business_id, plan_type } = await req.json()
    const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')

    if (!MP_ACCESS_TOKEN) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured')
    }

    // 1. Initialize Supabase
    // Note: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically available in production
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // 2. Fetch business data
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', business_id)
      .single()

    if (bizError || !business) throw new Error('Business not found')

    // 3. Resolve price — DB pricing table is the source of truth
    const now = new Date();
    const isLocked = business.price_lock_ends_at && new Date(business.price_lock_ends_at) > now;

    let price: number;

    if (isLocked && business.locked_price) {
      price = business.locked_price;
    } else {
      const { data: pricingRow, error: pricingError } = await supabase
        .from('pricing')
        .select('monthly')
        .eq('id', plan_type)
        .single();

      if (pricingError || !pricingRow) {
        const fallbackPrices: Record<string, number> = { tarjeta: 6500, turnos: 9900, combo: 12900 };
        price = fallbackPrices[plan_type] || 6500;
      } else {
        price = Number(pricingRow.monthly);
      }
    }

    // 4. Create Mercado Pago Subscription (Preapproval)
    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: `Suito Premium - Plan ${plan_type.toUpperCase()}`,
        auto_recurring: {
          currency_id: 'ARS',
          transaction_amount: price,
          frequency: 1,
          frequency_type: 'months',
        },
        back_url: `https://suito.pro/admin/dashboard-v2030.html?status=success&business=${business.slug}`,
        payer_email: business.email || 'hola@suito.pro',
        external_reference: business.id, // Linking back to our DB
        status: 'pending'
      })
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error('MP Error:', mpData)
      throw new Error(mpData.message || 'Mercado Pago error')
    }

    // init_point is the URL to send the user to
    return new Response(
      JSON.stringify({ checkout_url: mpData.init_point }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
