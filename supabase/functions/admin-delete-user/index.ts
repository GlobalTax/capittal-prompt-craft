import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { AdminDeleteUserSchema, validateInput, sanitizeError, redactEmail } from "../_shared/validation.ts";

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

    // Check user roles - Must be done BEFORE rate limiting
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    console.log(`[admin-delete-user] User roles for ${user.email}:`, roles);

    // Check if user has admin or superadmin role
    const isSuperAdmin = roles?.some(r => r.role === 'superadmin') || false;
    const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'superadmin') || false;

    if (rolesError || !isAdmin) {
      console.error('[admin-delete-user] User is not admin/superadmin:', user.email);
      return new Response(
        JSON.stringify({ error: 'Solo los administradores pueden eliminar usuarios' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: bypass para superadmin, 20/hora para admin
    if (isSuperAdmin) {
      console.log('[admin-delete-user] Superadmin - bypassing rate limit');
    } else {
      // Apply rate limit only to non-superadmin admins
      const { data: rateLimitOk, error: rateLimitError } = await supabaseAdmin
        .rpc('check_rate_limit_enhanced', {
          p_operation: 'admin_delete_user',
          p_identifier: user.id,
          p_max_requests: 20,
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
    }

    // Get and validate the user_id to delete from the request body
    const rawBody = await req.json();
    const validation = validateInput(AdminDeleteUserSchema, rawBody);

    if (!validation.success) {
      console.error('[admin-delete-user] Validation failed:', validation.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Datos inválidos', 
          details: validation.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id } = validation.data;

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

    // Extended pre-clean: Delete/nullify all user dependencies before auth deletion
    console.log('[admin-delete-user] Starting extended pre-clean for user:', user_id);
    
    // Pre-clean with different column possibilities
    const precleanConfig = [
      { table: 'security_logs', columns: ['user_id'] },
      { table: 'pending_invitations', columns: ['user_id', 'invited_by'] },
      { table: 'user_verification_status', columns: ['user_id'] },
      { table: 'user_profiles', columns: ['id'] },
      { table: 'advisor_profiles', columns: ['user_id'] },
      { table: 'booking_links', columns: ['user_id'] },
      { table: 'calendar_events', columns: ['user_id'] },
      { table: 'calendar_integrations', columns: ['user_id'] },
      { table: 'team_members', columns: ['user_id'] },
      { table: 'alert_rules', columns: ['user_id'] },
      { table: 'automation_rules', columns: ['created_by'] },
      { table: 'availability_patterns', columns: ['user_id'] },
      { table: 'document_notifications', columns: ['user_id'] },
      { table: 'document_permissions', columns: ['user_id'] },
      { table: 'document_presence', columns: ['user_id'] },
      { table: 'document_shares', columns: ['created_by'] },
      { table: 'document_comments', columns: ['created_by'] },
      { table: 'document_mentions', columns: ['mentioned_user_id'] },
      { table: 'document_approvals', columns: ['approver_id'] },
      { table: 'document_workflow_instances', columns: ['started_by'] },
      { table: 'document_status_history', columns: ['changed_by'] },
      { table: 'document_versions', columns: ['created_by'] },
      { table: 'proposals', columns: ['created_by'] },
      { table: 'automated_followups', columns: ['created_by'] },
      { table: 'lead_task_engine', columns: ['created_by', 'assigned_to'] },
      { table: 'lead_task_engine_notifications', columns: [] }, // Will be cleaned by cascade
      { table: 'commissions', columns: ['employee_id'] },
      { table: 'commission_calculations', columns: [] }, // Will be cleaned by cascade
      { table: 'collaborators', columns: ['user_id', 'created_by'] },
      { table: 'system_notifications', columns: ['user_id'] }
    ];

    for (const config of precleanConfig) {
      try {
        for (const column of config.columns) {
          const { error } = await supabaseAdmin
            .from(config.table)
            .delete()
            .eq(column, user_id);
          
          if (error && !error.message.includes('does not exist')) {
            console.log(`[admin-delete-user] Note: Could not pre-clean ${config.table}.${column}:`, error.message);
          } else if (!error) {
            console.log(`[admin-delete-user] Pre-cleaned ${config.table}.${column}`);
          }
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        if (!errorMsg.includes('does not exist')) {
          console.log(`[admin-delete-user] Warning: Table ${config.table} pre-clean failed:`, errorMsg);
        }
      }
    }

    // Special case: user_roles (must be deleted for target user)
    try {
      const { error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', user_id);
      
      if (rolesError) {
        console.log('[admin-delete-user] Note: Could not pre-clean user_roles:', rolesError.message);
      } else {
        console.log('[admin-delete-user] Pre-cleaned user_roles');
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      console.log('[admin-delete-user] Warning: user_roles pre-clean failed:', errorMsg);
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

    // Log the deletion using safe function (handles inet type properly)
    await supabaseAdmin
      .rpc('log_security_event_safe', {
        p_event_type: 'user_deleted',
        p_severity: 'high',
        p_description: `Usuario ${redactedTargetEmail} eliminado por ${redactEmail(user.email || 'unknown')}`,
        p_metadata: {
          deleted_user_id: user_id,
          deleted_user_email: redactedTargetEmail,
          source: 'edge_function',
          function_name: 'admin-delete-user'
        },
        p_user_id: user.id
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
    return new Response(
      JSON.stringify({ error: sanitizeError(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
