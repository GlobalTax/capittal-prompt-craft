import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get user email for logging
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user_id);
    const targetEmail = userData?.user?.email || 'unknown';

    console.log(`[admin-delete-user] Attempting to delete user: ${targetEmail} (${user_id})`);

    // Safety net: Pre-clean valuation_reports to avoid FK constraint errors
    console.log('[admin-delete-user] Pre-cleaning valuation_reports for user:', user_id);
    const { error: cleanError } = await supabaseAdmin
      .from('valuation_reports')
      .delete()
      .eq('generated_by', user_id);
    
    if (cleanError) {
      console.error('[admin-delete-user] Error cleaning valuation_reports:', cleanError);
      // Continue anyway - the CASCADE should handle it after migration
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

    // Log the deletion in security logs
    await supabaseAdmin
      .from('security_logs')
      .insert({
        event_type: 'user_deleted',
        severity: 'high',
        description: `Usuario ${targetEmail} eliminado por ${user.email}`,
        user_id: user.id,
        user_email: user.email,
        metadata: {
          deleted_user_id: user_id,
          deleted_user_email: targetEmail,
        },
      });

    console.log(`[admin-delete-user] Successfully deleted user: ${targetEmail}`);

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
