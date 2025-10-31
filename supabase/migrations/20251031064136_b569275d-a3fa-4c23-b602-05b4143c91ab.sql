-- Fix RLS policies for document_templates to allow admins to manage all templates

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can delete their own document templates" ON document_templates;
DROP POLICY IF EXISTS "Users can update their own document templates" ON document_templates;

-- Create new policy: Users can delete their own templates, admins can delete any
CREATE POLICY "Users can delete document templates"
  ON document_templates FOR DELETE
  USING (
    auth.uid() = created_by 
    OR has_role_secure(auth.uid(), 'admin'::app_role)
    OR has_role_secure(auth.uid(), 'superadmin'::app_role)
  );

-- Create new policy: Users can update their own templates, admins can update any
CREATE POLICY "Users can update document templates"
  ON document_templates FOR UPDATE
  USING (
    auth.uid() = created_by 
    OR has_role_secure(auth.uid(), 'admin'::app_role)
    OR has_role_secure(auth.uid(), 'superadmin'::app_role)
  );