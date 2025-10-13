import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Request received`);

  try {
    // Auth validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log(`[${requestId}] Missing Authorization header`);
      return new Response(JSON.stringify({ error: 'Authorization header requerido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.log(`[${requestId}] Auth failed:`, authError?.message);
      return new Response(JSON.stringify({ error: 'Usuario no autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${requestId}] Authenticated user: ${user.email}`);

    // Check superadmin role
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isSuperAdmin = roles?.some(r => r.role === 'superadmin');

    if (!isSuperAdmin) {
      console.log(`[${requestId}] Permission denied for user ${user.email}`);
      return new Response(JSON.stringify({ error: 'Solo superadministradores pueden invitar usuarios' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Input validation
    const { email, role } = await req.json();
    
    if (!email || typeof email !== 'string' || !email.trim() || !email.includes('@')) {
      console.log(`[${requestId}] Invalid email: ${email}`);
      return new Response(JSON.stringify({ error: 'Email inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!role || typeof role !== 'string' || !role.trim()) {
      console.log(`[${requestId}] Invalid role: ${role}`);
      return new Response(JSON.stringify({ error: 'Rol requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validRoles = ['user', 'advisor', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      console.log(`[${requestId}] Invalid role value: ${role}`);
      return new Response(JSON.stringify({ error: `Rol inválido. Debe ser: ${validRoles.join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    console.log(`[${requestId}] Creating invitation for ${cleanEmail} with role ${role}`);

    // Create invitation via DB function
    const { data, error } = await supabaseClient.rpc('create_user_invitation', {
      p_email: cleanEmail,
      p_role: role
    });

    if (error) {
      console.error(`[${requestId}] RPC error:`, error);
      
      // Handle enum cast error
      if (error.code === '22P02' || error.message?.includes('invalid input value for enum')) {
        return new Response(JSON.stringify({ 
          error: 'Rol no válido para el sistema',
          details: error.message 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Handle duplicate
      if (error.code === '23505') {
        console.log(`[${requestId}] Duplicate invitation, retrieving existing`);
        const { data: existing, error: fetchError } = await supabaseClient
          .from('pending_invitations')
          .select('token')
          .eq('email', cleanEmail)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (fetchError || !existing) {
          console.error(`[${requestId}] Failed to retrieve existing:`, fetchError);
          return new Response(JSON.stringify({ 
            error: 'Invitación duplicada pero no se pudo recuperar',
            details: fetchError?.message 
          }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const invitationUrl = `${Deno.env.get('SUPABASE_URL')}/invite?token=${existing.token}`;
        console.log(`[${requestId}] Existing invitation returned for ${cleanEmail}`);
        
        return new Response(JSON.stringify({ 
          success: true, 
          invitation_id: existing.token,
          invitation_url: invitationUrl,
          message: 'Invitación ya existía, se devuelve el link existente'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Other DB errors
      return new Response(JSON.stringify({ 
        error: 'Error al crear invitación',
        details: error.message,
        code: error.code,
        hint: error.hint
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const invitationUrl = `${Deno.env.get('SUPABASE_URL')}/invite?token=${data}`;
    console.log(`[${requestId}] Success: invitation created by ${user.email} for ${cleanEmail}`);

    return new Response(JSON.stringify({ 
      success: true, 
      invitation_id: data,
      invitation_url: invitationUrl 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
