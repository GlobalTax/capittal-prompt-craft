import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] Request received to link invitation`);

    // Get authenticated user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[${requestId}] Missing authorization header`);
      return new Response(
        JSON.stringify({ error: 'No autorizado', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Initialize regular client to get authenticated user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error(`[${requestId}] Failed to get authenticated user:`, userError);
      return new Response(
        JSON.stringify({ error: 'No autorizado', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Authenticated user: ${user.email}`);

    // Parse request body
    const { token } = await req.json();

    if (!token) {
      console.error(`[${requestId}] Missing token in request`);
      return new Response(
        JSON.stringify({ error: 'Token requerido', code: 'MISSING_TOKEN' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Validating invitation token: ${token.substring(0, 8)}...`);

    // Validate the invitation token
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('pending_invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (invitationError) {
      console.error(`[${requestId}] Error fetching invitation:`, invitationError);
      return new Response(
        JSON.stringify({ error: 'Error al validar la invitación', code: 'VALIDATION_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!invitation) {
      console.error(`[${requestId}] Invitation not found`);
      return new Response(
        JSON.stringify({ error: 'Invitación no encontrada o inválida', code: 'INVALID_TOKEN' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invitation is already used
    if (invitation.used_at) {
      console.error(`[${requestId}] Invitation already used at: ${invitation.used_at}`);
      return new Response(
        JSON.stringify({ error: 'Esta invitación ya ha sido utilizada', code: 'ALREADY_USED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invitation is expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      console.error(`[${requestId}] Invitation expired at: ${invitation.expires_at}`);
      return new Response(
        JSON.stringify({ error: 'Esta invitación ha expirado', code: 'EXPIRED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the email matches
    if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
      console.error(`[${requestId}] Email mismatch - invitation: ${invitation.email}, user: ${user.email}`);
      return new Response(
        JSON.stringify({ 
          error: 'Esta invitación no corresponde a tu email', 
          code: 'EMAIL_MISMATCH' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Email verified, assigning role: ${invitation.role}`);

    // Check if user already has this role
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', invitation.role)
      .maybeSingle();

    if (!existingRole) {
      // Assign the role to the user
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: invitation.role
        });

      if (roleError) {
        console.error(`[${requestId}] Error assigning role:`, roleError);
        return new Response(
          JSON.stringify({ error: 'Error al asignar el rol', code: 'ROLE_ASSIGNMENT_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log(`[${requestId}] Role assigned successfully`);
    } else {
      console.log(`[${requestId}] User already has this role`);
    }

    // Mark invitation as used
    const { error: updateError } = await supabaseAdmin
      .from('pending_invitations')
      .update({
        used_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        accepted_by_user_id: user.id
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error(`[${requestId}] Error marking invitation as used:`, updateError);
      return new Response(
        JSON.stringify({ error: 'Error al actualizar la invitación', code: 'UPDATE_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Invitation linked successfully for user: ${user.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitación vinculada exitosamente',
        role: invitation.role
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor', 
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
