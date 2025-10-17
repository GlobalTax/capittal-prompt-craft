-- Migración simplificada: normalizar claves de meses en monthly_budgets
DO $$
DECLARE
  budget_rec RECORD;
  section_rec jsonb;
  row_rec jsonb;
  new_values jsonb;
  new_rows jsonb[];
  new_sections jsonb[];
  month_key text;
  month_value jsonb;
BEGIN
  -- Recorrer todos los presupuestos
  FOR budget_rec IN SELECT id, sections FROM monthly_budgets LOOP
    new_sections := ARRAY[]::jsonb[];
    
    -- Recorrer cada sección
    FOR section_rec IN SELECT * FROM jsonb_array_elements(budget_rec.sections) LOOP
      new_rows := ARRAY[]::jsonb[];
      
      -- Recorrer cada fila de la sección
      FOR row_rec IN SELECT * FROM jsonb_array_elements(section_rec->'rows') LOOP
        new_values := '{}'::jsonb;
        
        -- Recorrer cada par clave-valor en values
        FOR month_key, month_value IN SELECT * FROM jsonb_each(row_rec->'values') LOOP
          -- Normalizar la clave del mes
          month_key := CASE month_key
            WHEN 'Ene' THEN 'Enero'
            WHEN 'Feb' THEN 'Febrero'
            WHEN 'Mar' THEN 'Marzo'
            WHEN 'Abr' THEN 'Abril'
            WHEN 'May' THEN 'Mayo'
            WHEN 'Jun' THEN 'Junio'
            WHEN 'Jul' THEN 'Julio'
            WHEN 'Ago' THEN 'Agosto'
            WHEN 'Sep' THEN 'Septiembre'
            WHEN 'Oct' THEN 'Octubre'
            WHEN 'Nov' THEN 'Noviembre'
            WHEN 'Dic' THEN 'Diciembre'
            ELSE month_key
          END;
          
          -- Solo incluir meses válidos (evitar duplicados)
          IF month_key IN ('Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre') THEN
            new_values := new_values || jsonb_build_object(month_key, month_value);
          END IF;
        END LOOP;
        
        -- Agregar la fila modificada
        new_rows := new_rows || jsonb_set(row_rec, '{values}', new_values);
      END LOOP;
      
      -- Agregar la sección modificada
      new_sections := new_sections || jsonb_set(section_rec, '{rows}', to_jsonb(new_rows));
    END LOOP;
    
    -- Actualizar el presupuesto con las secciones normalizadas
    UPDATE monthly_budgets
    SET sections = to_jsonb(new_sections), updated_at = now()
    WHERE id = budget_rec.id;
  END LOOP;
END $$;