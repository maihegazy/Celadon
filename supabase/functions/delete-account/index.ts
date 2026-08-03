// Celadon — account deletion.
//
// Deleting an auth user needs the service-role key, which must never ship in
// the app. This edge function does it server-side: it verifies the caller's
// token, then deletes that user (the profiles row goes with it via
// `on delete cascade`).
//
// Deploy with:
//   supabase functions deploy delete-account
//
// It reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, which Supabase injects
// into deployed functions automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return json({ error: 'Missing authorization header' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Identify the caller using their own token — never trust an id from the body.
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: 'Not signed in' }, 401);
  }

  const admin = createClient(url, serviceRoleKey);
  const { error } = await admin.auth.admin.deleteUser(userData.user.id);
  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({ deleted: true }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
