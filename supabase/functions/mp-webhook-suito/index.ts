import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')

serve(async (req) => {
  try {
    const payload = await req.json()
    console.log('Webhook received:', payload)

    // Verification: We only care about subscription (preapproval) and payment events
    const { action, type, data } = payload
    
    if (type === 'subscription_preapproval' || type === 'preapproval') {
      const resourceId = data.id
      
      // 1. Fetch the actual status from Mercado Pago (don't trust payload alone)
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
      })
      const subscription = await mpResponse.json()

      if (subscription.status === 'authorized') {
        const businessId = subscription.external_reference
        
        // 2. Initialize Supabase
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') || '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        )

        // 3. Update business status
        const nextPaymentDate = new Date();
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

        const { error } = await supabase
          .from('businesses')
          .update({
            subscription_status: 'active',
            paid_until: nextPaymentDate.toISOString(),
            // Ensure legacy flag is also updated for 100% compatibility
            is_premium: true,
            fecha_vencimiento: nextPaymentDate.toISOString().split('T')[0]
          })
          .eq('id', businessId)

        if (error) throw error
        console.log(`Business ${businessId} upgraded to ACTIVE from Webhook.`)
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('Webhook error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    })
  }
})
