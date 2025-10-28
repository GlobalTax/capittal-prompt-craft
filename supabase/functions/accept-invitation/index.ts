import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod schema for validation
const AcceptInvitationSchema = z.object({
  token: z.string().uuid("Token inválido"),
  first_name: z.string().trim().min(1, "El nombre es requerido").max(50, "Nombre demasiado largo"),
  last_name: z.string().trim().min(1, "El apellido es requerido").max(50, "Apellido demasiado largo"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100, "Contraseña demasiado larga"),
});

// Error sanitization
function sanitizeError(error: any): string {
  console.error('[Internal Error]', error);
  
  if (error instanceof z.ZodError) {
    return error.errors.map(e => e.message).join(', ');
  }
  
  return 'Error al procesar la solicitud';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Accept invitation request received`);

  try {
    const rawData = await req.json();
    
    // Validate with Zod
    const validationResult = AcceptInvitationSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.log(`[${requestId}] Validation error:`, validationResult.error.errors);
      return new Response(JSON.stringify({ 
        error: 'Datos inválidos',
        details: validationResult.error.errors.map(e => e.message).join(', ')
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { token, first_name, last_name, password } = validationResult.data;

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
      console.log(`[${requestId}] Invalid invitation token`);
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
        first_name: first_name,
        last_name: last_name,
      }
    });

    if (signUpError) {
      console.error(`[${requestId}] Error creating user:`, signUpError.code);
      
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
        error: 'Error al crear la cuenta'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!authData.user) {
      console.error(`[${requestId}] User creation returned no user data`);
      return new Response(JSON.stringify({ 
        error: 'Error al crear la cuenta' 
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
      console.error(`[${requestId}] Error assigning role:`, roleError.code);
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
      console.error(`[${requestId}] Error updating invitation:`, updateError.code);
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
    console.error(`[${requestId}] Unexpected error`);
    return new Response(JSON.stringify({ 
      error: sanitizeError(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});