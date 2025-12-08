import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VAPID keys for push notifications
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = 'mailto:admin@ginoanalytics.com';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, subscription, userId } = await req.json();

    console.log(`Push notifications action: ${action}`);

    switch (action) {
      case 'get-vapid-key':
        return new Response(
          JSON.stringify({ publicKey: VAPID_PUBLIC_KEY }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'subscribe':
        if (!subscription || !userId) {
          throw new Error('Missing subscription or userId');
        }

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

        await sendPushToUser(supabase, userId, {
          title: '🎉 Teste de Notificação',
          body: 'As notificações estão funcionando!',
          icon: '/app-icon.png',
          tag: 'test',
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'notify-sale':
        const { sale } = await req.json();
        
        // Get all subscriptions
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*');

        if (subscriptions && subscriptions.length > 0) {
          const payload = {
            title: '💰 Nova Venda!',
            body: `Venda de ${sale?.total || 'R$ ???'} - ${sale?.customer || 'Cliente'}`,
            icon: '/app-icon.png',
            tag: 'sale',
            data: { url: '/', saleId: sale?.id },
          };

          for (const sub of subscriptions) {
            try {
              await sendPush(sub, payload);
              console.log(`Notification sent to ${sub.endpoint}`);
            } catch (error) {
              console.error(`Failed to send to ${sub.endpoint}:`, error);
            }
          }
        }

        return new Response(
          JSON.stringify({ success: true, sent: subscriptions?.length || 0 }),
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

async function sendPushToUser(supabase: any, userId: string, payload: any) {
  const { data: subscription } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!subscription) {
    throw new Error('No subscription found for user');
  }

  await sendPush(subscription, payload);
}

async function sendPush(subscription: any, payload: any) {
  const webPushPayload = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  // Using web-push library logic manually for Deno
  // This is a simplified version - in production you'd use proper VAPID signing
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TTL': '86400',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Push failed: ${response.status} - ${text}`);
  }
}
