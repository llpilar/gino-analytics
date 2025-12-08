import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VAPID keys for push notifications
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, subscription, userId, sale } = body;

    console.log(`Push notifications action: ${action}`);

    switch (action) {
      case 'get-vapid-key':
        if (!VAPID_PUBLIC_KEY) {
          console.error('VAPID_PUBLIC_KEY not configured');
          return new Response(
            JSON.stringify({ error: 'VAPID keys not configured', publicKey: null }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('Returning VAPID public key');
        return new Response(
          JSON.stringify({ publicKey: VAPID_PUBLIC_KEY }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'subscribe':
        if (!subscription || !userId) {
          throw new Error('Missing subscription or userId');
        }

        console.log('Saving subscription for user:', userId);

        // Save subscription to database
        const { error: insertError } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (insertError) {
          console.error('Error saving subscription:', insertError);
          throw insertError;
        }

        console.log(`Subscription saved for user ${userId}`);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'unsubscribe':
        if (!userId) {
          throw new Error('Missing userId');
        }

        const { error: deleteError } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error('Error deleting subscription:', deleteError);
          throw deleteError;
        }

        console.log(`Subscription deleted for user ${userId}`);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'send-test':
        if (!userId) {
          throw new Error('Missing userId');
        }

        console.log(`Test notification requested for user: ${userId}`);
        
        // For now, just confirm the subscription exists
        const { data: testSub, error: testError } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (testError || !testSub) {
          throw new Error('Subscription not found. Please enable notifications first.');
        }

        // The actual push will be sent when we integrate with Shopify webhooks
        // For now, show a local notification
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Notificações configuradas! Você receberá alertas de novas vendas.',
            subscriptionFound: true 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'notify-sale':
        // Get all subscriptions
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*');

        console.log(`Found ${subscriptions?.length || 0} subscriptions to notify`);

        return new Response(
          JSON.stringify({ success: true, subscriptions: subscriptions?.length || 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
