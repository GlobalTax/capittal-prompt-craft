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

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar permisos
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuario no autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obtener TODOS los roles del usuario (puede tener múltiples roles)
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    // Verificar si tiene rol superadmin
    const isSuperAdmin = roles?.some(r => r.role === 'superadmin');

    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Solo superadmins pueden invitar usuarios' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obtener datos de la petición
    const { email, role } = await req.json();

    if (!email || !role) {
      return new Response(JSON.stringify({ error: 'Email y rol son requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Crear invitación usando la función de base de datos
    const { data, error } = await supabaseClient.rpc('create_user_invitation', {
      p_email: email,
      p_role: role
    });

    if (error) throw error;

    // Generar link de invitación
    const invitationUrl = `${Deno.env.get('SUPABASE_URL')}/invite?token=${data}`;

    console.log(`Invitation created by ${user.email} for ${email} with role ${role}`);

    return new Response(JSON.stringify({ 
      success: true, 
      invitation_id: data,
      invitation_url: invitationUrl 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-user-invitation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
