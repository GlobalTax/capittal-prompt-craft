import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

export interface AuthResult {
  authenticated: boolean;
  user?: any;
  hasRole?: boolean;
  error?: string;
}

/**
 * Valida que el usuario esté autenticado y tenga el rol requerido
 */
export async function validateUserRole(
  req: Request,
  supabase: SupabaseClient,
  requiredRole: 'admin' | 'superadmin' | 'advisor'
): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return {
      authenticated: false,
      error: "Missing authorization header"
    };
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return {
      authenticated: false,
      error: "Invalid or expired token"
    };
  }

  const { data: hasRole, error: roleError } = await supabase.rpc("has_role_secure", {
    _user_id: user.id,
    _required_role: requiredRole,
  });

  if (roleError) {
    console.error("[Auth] Error checking role:", roleError);
    return {
      authenticated: true,
      user,
      hasRole: false,
      error: "Error checking permissions"
    };
  }

  return {
    authenticated: true,
    user,
    hasRole: hasRole === true
  };
}
