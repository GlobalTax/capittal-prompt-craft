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
  console.log(`[${requestId}] Accept invitation request received`);

  try {
    const { token, first_name, last_name, password } = await req.json();

    // Input validation
    if (!token || !first_name || !last_name || !password) {
      console.log(`[${requestId}] Missing required fields`);
      return new Response(JSON.stringify({ 
        error: 'Todos los campos son requeridos' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (password.length < 6) {
      console.log(`[${requestId}] Password too short`);
      return new Response(JSON.stringify({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create service role client for admin operations
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

    // Validate invitation token
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('pending_invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (invitationError || !invitation) {
      console.log(`[${requestId}] Invalid invitation token:`, invitationError);
      return new Response(JSON.stringify({ 
        error: 'Token de invitación no válido' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already used
    if (invitation.used_at) {
      console.log(`[${requestId}] Invitation already used`);
      return new Response(JSON.stringify({ 
        error: 'Esta invitación ya ha sido utilizada' 
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      console.log(`[${requestId}] Invitation expired`);
      return new Response(JSON.stringify({ 
        error: 'Esta invitación ha expirado' 
      }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${requestId}] Creating user for email: ${invitation.email}`);

    // Create user with admin client
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
      }
    });

    if (signUpError) {
      console.error(`[${requestId}] Error creating user:`, signUpError);
      
      // Handle duplicate user
      if (signUpError.message?.includes('already registered')) {
        return new Response(JSON.stringify({ 
          error: 'Este email ya está registrado. Inicia sesión para vincular tu invitación.',
          code: 'EMAIL_EXISTS'
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        error: 'Error al crear el usuario',
        details: signUpError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!authData.user) {
      console.error(`[${requestId}] User creation returned no user data`);
      return new Response(JSON.stringify({ 
        error: 'Error al crear el usuario' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${requestId}] User created successfully: ${authData.user.id}`);

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: invitation.role
      });

    if (roleError) {
      console.error(`[${requestId}] Error assigning role:`, roleError);
      // Don't fail the whole process if role assignment fails
      // Admin can fix it manually
    } else {
      console.log(`[${requestId}] Role ${invitation.role} assigned successfully`);
    }

    // Mark invitation as used
    const { error: updateError } = await supabaseAdmin
      .from('pending_invitations')
      .update({
        used_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        user_id: authData.user.id
      })
      .eq('token', token);

    if (updateError) {
      console.error(`[${requestId}] Error updating invitation:`, updateError);
      // Don't fail the whole process if update fails
    }

    console.log(`[${requestId}] Invitation accepted successfully`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Cuenta creada exitosamente'
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
