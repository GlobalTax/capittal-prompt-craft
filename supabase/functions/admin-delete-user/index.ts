import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Función helper para redactar emails en logs (F04 - Seguridad)
const redactEmail = (email: string): string => {
  if (!email || !email.includes('@')) return 'unknown';
  const [local, domain] = email.split('@');
  const redactedLocal = local.length > 2 
    ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`
    : '*'.repeat(local.length);
  return `${redactedLocal}@${domain}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[admin-delete-user] Authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[admin-delete-user] Request from user: ${user.email}`);

    // Check if user has superadmin role
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    console.log(`[admin-delete-user] User roles for ${user.email}:`, roles);

    if (rolesError || !roles || !roles.some(r => r.role === 'superadmin')) {
      console.error('[admin-delete-user] User is not superadmin:', user.email);
      return new Response(
        JSON.stringify({ error: 'Solo los superadministradores pueden eliminar usuarios' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: 20 intentos por 60 minutos (F05)
    const { data: rateLimitOk, error: rateLimitError } = await supabaseAdmin
      .rpc('check_rate_limit', {
        p_identifier: user.id,
        p_action_type: 'delete_user',
        p_max_attempts: 20,
        p_window_minutes: 60
      });

    if (rateLimitError || !rateLimitOk) {
      console.error('[admin-delete-user] Rate limit exceeded for:', redactEmail(user.email || 'unknown'));
      return new Response(
        JSON.stringify({ 
          error: 'Demasiados intentos de eliminación. Intenta de nuevo en 1 hora.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user_id to delete from the request body
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (user_id === user.id) {
      console.error('[admin-delete-user] User attempted self-deletion:', user.email);
      return new Response(
        JSON.stringify({ error: 'No puedes eliminarte a ti mismo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user email for logging (redacted for security - F04)
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user_id);
    const targetEmail = userData?.user?.email || 'unknown';
    const redactedTargetEmail = redactEmail(targetEmail);

    console.log(`[admin-delete-user] Attempting to delete user: ${redactedTargetEmail} (${user_id})`);

    // Safety net: Pre-clean related tables to avoid FK constraint errors
    console.log('[admin-delete-user] Pre-cleaning valuation_reports for user:', user_id);
    const { error: reportsError } = await supabaseAdmin
      .from('valuation_reports')
      .delete()
      .eq('generated_by', user_id);
    
    if (reportsError) {
      console.error('[admin-delete-user] Error cleaning valuation_reports:', reportsError);
    }

    // Pre-clean security_logs
    console.log('[admin-delete-user] Pre-cleaning security_logs for user:', user_id);
    const { error: logsError } = await supabaseAdmin
      .from('security_logs')
      .delete()
      .eq('user_id', user_id);
    
    if (logsError) {
      console.error('[admin-delete-user] Error cleaning security_logs:', logsError);
    }

    // Delete the user using admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error('[admin-delete-user] Error deleting user:', deleteError);
      return new Response(
        JSON.stringify({ error: `Error al eliminar usuario: ${deleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the deletion in security logs (ip_address: null for Edge Function compatibility)
    await supabaseAdmin
      .from('security_logs')
      .insert({
        event_type: 'user_deleted',
        severity: 'high',
        description: `Usuario ${redactedTargetEmail} eliminado por ${redactEmail(user.email || 'unknown')}`,
        user_id: user.id,
        user_email: user.email,
        ip_address: null, // Edge Functions don't have direct DB access, set explicitly
        metadata: {
          deleted_user_id: user_id,
          deleted_user_email: redactedTargetEmail,
          source: 'edge_function',
          function_name: 'admin-delete-user'
        },
      });

    console.log(`[admin-delete-user] Successfully deleted user: ${redactedTargetEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Usuario eliminado correctamente'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[admin-delete-user] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
