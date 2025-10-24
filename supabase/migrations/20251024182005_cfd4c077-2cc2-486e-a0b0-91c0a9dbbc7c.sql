-- =====================================================
-- FASE 3.3 CORREGIDA: Mejorar funciones SECURITY DEFINER existentes
-- =====================================================

-- Eliminar función existente
DROP FUNCTION IF EXISTS public.log_security_event(text, text, text, jsonb);

-- Recrear log_security_event mejorado
CREATE FUNCTION public.log_security_event(
  p_event_type text,
  p_severity text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role app_role;
  v_log_id uuid;
BEGIN
  -- Obtener usuario (permitir eventos de sistema)
  v_user_id := auth.uid();
  
  -- Para eventos críticos de usuarios autenticados, validar rol
  IF p_severity IN ('critical', 'high') AND v_user_id IS NOT NULL THEN
    SELECT role INTO v_user_role
    FROM user_roles
    WHERE user_id = v_user_id
    ORDER BY 
      CASE role
        WHEN 'superadmin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'advisor' THEN 3
        ELSE 4
      END
    LIMIT 1;
    
    -- Solo admins+ pueden crear eventos críticos manualmente (no desde triggers)
    IF v_user_role NOT IN ('admin', 'superadmin') AND TG_NAME IS NULL THEN
      RAISE EXCEPTION 'Insufficient privileges for % severity events', p_severity;
    END IF;
  END IF;
  
  -- Sanitizar event_type
  IF p_event_type !~ '^[a-z_]+$' THEN
    RAISE EXCEPTION 'Invalid event_type format: must be lowercase with underscores only';
  END IF;
  
  -- Insertar log
  INSERT INTO security_logs (
    event_type, severity, description, 
    metadata, user_id, ip_address
  ) VALUES (
    p_event_type, p_severity, p_description,
    p_metadata, v_user_id, inet_client_addr()
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Mejorar check_duplicate_collaborator si existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_duplicate_collaborator') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.check_duplicate_collaborator()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    DECLARE
      existing_collaborator_id UUID;
      user_id_from_email UUID;
    BEGIN
      IF NEW.email IS NOT NULL THEN
        -- Normalizar email
        NEW.email := LOWER(TRIM(NEW.email));
        
        -- Verificar email duplicado
        SELECT id INTO existing_collaborator_id
        FROM public.collaborators
        WHERE email = NEW.email
          AND id != COALESCE(NEW.id, ''00000000-0000-0000-0000-000000000000''::uuid);
        
        IF existing_collaborator_id IS NOT NULL THEN
          -- Log el intento de duplicado
          PERFORM log_security_event(
            ''duplicate_collaborator_blocked'',
            ''medium'',
            format(''Intento de crear colaborador duplicado: %s'', NEW.email),
            jsonb_build_object(
              ''email'', NEW.email,
              ''existing_id'', existing_collaborator_id,
              ''attempted_by'', auth.uid()
            )
          );
          
          RAISE EXCEPTION ''Ya existe un colaborador con el email: %. ID: %'', 
            NEW.email, existing_collaborator_id
          USING HINT = ''Revisa el colaborador existente antes de crear uno nuevo'';
        END IF;
        
        -- Auto-vincular user_id si existe usuario con ese email
        IF NEW.user_id IS NULL THEN
          SELECT id INTO user_id_from_email
          FROM auth.users
          WHERE LOWER(email) = NEW.email;
          
          IF user_id_from_email IS NOT NULL THEN
            NEW.user_id := user_id_from_email;
          END IF;
        END IF;
      END IF;
      
      RETURN NEW;
    END;
    $func$;
    ';
  END IF;
END $$;