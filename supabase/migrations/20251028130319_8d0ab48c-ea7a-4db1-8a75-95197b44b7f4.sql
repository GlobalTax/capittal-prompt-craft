-- =====================================================
-- FASE 4.2: CORREGIR FUNCIONES SECURITY DEFINER SIN SET search_path
-- =====================================================
-- Fecha: 2025-10-28
-- Descripción: Agregar SET search_path a funciones SECURITY DEFINER restantes

-- ============================================
-- 1. CREATE_COMMENT_NOTIFICATIONS (TRIGGER)
-- ============================================
CREATE OR REPLACE FUNCTION public.create_comment_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_owner_id UUID;
  mention_user_id UUID;
BEGIN
  -- Notificar al dueño del documento si no es quien comentó
  SELECT created_by INTO doc_owner_id 
  FROM documents 
  WHERE id = NEW.document_id;
  
  IF doc_owner_id != NEW.created_by THEN
    INSERT INTO public.document_notifications (
      user_id, document_id, comment_id, notification_type, title, message
    ) VALUES (
      doc_owner_id, 
      NEW.document_id, 
      NEW.id, 
      'comment',
      'Nuevo comentario en documento',
      'Se ha añadido un nuevo comentario en tu documento'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_comment_notifications() IS 
  'Trigger para crear notificaciones cuando se agrega un comentario a un documento. SECURITY DEFINER es necesario para insertar notificaciones.';

-- ============================================
-- 2. CREATE_MENTION_NOTIFICATIONS (TRIGGER)
-- ============================================
CREATE OR REPLACE FUNCTION public.create_mention_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_id UUID;
  comment_content TEXT;
BEGIN
  -- Obtener información del comentario
  SELECT document_id, content INTO doc_id, comment_content
  FROM document_comments 
  WHERE id = NEW.comment_id;
  
  -- Crear notificación de mención
  INSERT INTO public.document_notifications (
    user_id, document_id, comment_id, notification_type, title, message
  ) VALUES (
    NEW.mentioned_user_id,
    doc_id,
    NEW.comment_id,
    'mention',
    'Te han mencionado en un comentario',
    'Has sido mencionado en un comentario de documento'
  );
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_mention_notifications() IS 
  'Trigger para crear notificaciones cuando un usuario es mencionado en un comentario. SECURITY DEFINER es necesario para insertar notificaciones.';

-- ============================================
-- 3. CREATE_MANDATE_FROM_LEAD
-- ============================================
CREATE OR REPLACE FUNCTION public.create_mandate_from_lead(lead_id uuid, mandate_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_mandate_id UUID;
  result JSONB;
BEGIN
  -- Validar autenticación
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Generate new UUID for mandate
  new_mandate_id := gen_random_uuid();
  
  -- Create mandate record
  INSERT INTO mandates (
    id,
    company_name,
    contact_name,
    contact_email,
    contact_phone,
    mandate_type,
    sector,
    ebitda_range,
    location,
    status,
    source_lead_id,
    created_from_lead,
    created_at,
    updated_at
  ) VALUES (
    new_mandate_id,
    mandate_data->>'company_name',
    mandate_data->>'contact_name',
    mandate_data->>'contact_email',
    mandate_data->>'contact_phone',
    mandate_data->>'mandate_type',
    mandate_data->>'sector',
    mandate_data->>'ebitda_range',
    mandate_data->>'location',
    mandate_data->>'status',
    lead_id,
    true,
    now(),
    now()
  );
  
  -- Return the new mandate ID
  result := jsonb_build_object('id', new_mandate_id);
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.create_mandate_from_lead(uuid, jsonb) IS 
  'Crea un mandato desde un lead. SECURITY DEFINER es necesario para crear mandatos con permisos elevados.';

-- ============================================
-- 4. CREATE_VALUATION_FROM_LEAD
-- ============================================
CREATE OR REPLACE FUNCTION public.create_valuation_from_lead(lead_id uuid, valuation_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_valuation_id UUID;
  result JSONB;
BEGIN
  -- Validar autenticación
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Generate new UUID for valuation
  new_valuation_id := gen_random_uuid();
  
  -- Create valuation record
  INSERT INTO valuations (
    id,
    company_name,
    contact_name,
    contact_email,
    contact_phone,
    valuation_purpose,
    company_stage,
    revenue_range,
    status,
    source_lead_id,
    created_from_lead,
    created_at,
    updated_at
  ) VALUES (
    new_valuation_id,
    valuation_data->>'company_name',
    valuation_data->>'contact_name',
    valuation_data->>'contact_email',
    valuation_data->>'contact_phone',
    valuation_data->>'valuation_purpose',
    valuation_data->>'company_stage',
    valuation_data->>'revenue_range',
    valuation_data->>'status',
    lead_id,
    true,
    now(),
    now()
  );
  
  -- Return the new valuation ID
  result := jsonb_build_object('id', new_valuation_id);
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.create_valuation_from_lead(uuid, jsonb) IS 
  'Crea una valoración desde un lead. SECURITY DEFINER es necesario para crear valoraciones con permisos elevados.';