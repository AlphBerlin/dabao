-- RLS Policies for Multi-tenancy
-- This script sets up Row-Level Security policies to ensure:
-- 1. Organizations can only access their own projects
-- 2. Projects can only access their own data
-- 3. Users can only access organizations they belong to

-- Set search path to include both schemas
SET search_path = dabao, dabao_tenant, public;

-- ============================================
-- Helper Functions
-- ============================================

-- Function to get current user ID from JWT claims
CREATE OR REPLACE FUNCTION dabao.get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN nullif(current_setting('jwt.claims.sub', true), '')::TEXT;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current organization ID from JWT claims
CREATE OR REPLACE FUNCTION dabao.get_current_organization_id()
RETURNS TEXT AS $$
BEGIN
  RETURN nullif(current_setting('jwt.claims.org_id', true), '')::TEXT;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current project ID from JWT claims
CREATE OR REPLACE FUNCTION dabao.get_current_project_id()
RETURNS TEXT AS $$
BEGIN
  RETURN nullif(current_setting('jwt.claims.project_id', true), '')::TEXT;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user belongs to organization
CREATE OR REPLACE FUNCTION dabao.user_belongs_to_organization(org_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id TEXT := dabao.get_current_user_id();
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM dabao.user_organizations 
    WHERE organization_id = org_id AND user_id = dabao.get_current_user_id()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if project belongs to organization
CREATE OR REPLACE FUNCTION dabao.project_belongs_to_organization(project_id TEXT, org_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM dabao_tenant.projects 
    WHERE id = project_id AND organization_id = org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to project
CREATE OR REPLACE FUNCTION dabao.user_has_project_access(project_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id TEXT := dabao.get_current_user_id();
  org_id TEXT;
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT organization_id INTO org_id
  FROM dabao_tenant.projects
  WHERE id = project_id;
  
  RETURN dabao.user_belongs_to_organization(org_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Enable RLS on tables and create policies
-- ============================================

-- ======= Organization-level tables =======

-- Organizations table
ALTER TABLE dabao.organizations ENABLE ROW LEVEL SECURITY;

-- Users can only see organizations they belong to
CREATE POLICY organization_user_access ON dabao.organizations
  USING (dabao.user_belongs_to_organization(id));

-- User_Organizations table
ALTER TABLE dabao.user_organizations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own organization memberships
CREATE POLICY user_organizations_user_access ON dabao.user_organizations
  USING (user_id = dabao.get_current_user_id() OR 
         dabao.user_belongs_to_organization(organization_id));

-- Billing table
ALTER TABLE dabao.billing ENABLE ROW LEVEL SECURITY;

-- Users can only see billing for organizations they belong to
CREATE POLICY billing_user_access ON dabao.billing
  USING (dabao.user_belongs_to_organization(organization_id));

-- ======= Project-level tables =======

-- Projects table
ALTER TABLE dabao_tenant.projects ENABLE ROW LEVEL SECURITY;

-- Users can only see projects of organizations they belong to
CREATE POLICY project_user_access ON dabao_tenant.projects
  USING (dabao.user_belongs_to_organization(organization_id));

-- Project Invites
ALTER TABLE dabao_tenant.project_invites ENABLE ROW LEVEL SECURITY;

-- Users can only see invites for projects they have access to
CREATE POLICY project_invites_user_access ON dabao_tenant.project_invites
  USING (dabao.user_has_project_access(project_id));

-- API Keys
ALTER TABLE dabao_tenant.api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see API keys for projects they have access to
CREATE POLICY api_keys_user_access ON dabao_tenant.api_keys
  USING (dabao.user_has_project_access(project_id));

-- ======= Project data tables =======

-- For each project-related table, create a policy that restricts access to rows
-- based on the project_id field

-- Helper macro for creating project-scoped policies
DO $$ 
DECLARE
  tables TEXT[] := ARRAY[
    'project_preferences',
    'customers',
    'rewards',
    'customer_rewards',
    'customer_referrals',
    'referred_users',
    'campaigns',
    'campaign_rewards',
    'customer_activities',
    'membership_tiers',
    'customer_memberships',
    'vouchers',
    'voucher_redemptions',
    'customer_points_transactions',
    'stamp_cards',
    'stamps',
    'redemption_rules',
    'telegram_settings',
    'telegram_users',
    'telegram_campaigns',
    'telegram_messages',
    'telegram_commands',
    'telegram_menus',
    'branding_settings',
    'ai_images',
    'smtp_configs',
    'email_template_categories',
    'email_templates',
    'email_template_versions',
    'email_campaigns',
    'email_logs'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE dabao_tenant.%I ENABLE ROW LEVEL SECURITY', t);
    
    -- For tables with direct project_id columns
    IF t NOT IN ('stamps', 'email_template_versions') THEN
      EXECUTE format(
        'CREATE POLICY %I_project_access ON dabao_tenant.%I USING (project_id = dabao.get_current_project_id() OR dabao.user_has_project_access(project_id))',
        t, t
      );
    END IF;
  END LOOP;
  
  -- Special case for tables without direct project_id relation
  EXECUTE 'CREATE POLICY stamps_project_access ON dabao_tenant.stamps USING (
    EXISTS (
      SELECT 1 FROM dabao_tenant.stamp_cards
      WHERE stamp_cards.id = stamps.stamp_card_id
      AND (
        stamp_cards.project_id = dabao.get_current_project_id() OR
        dabao.user_has_project_access(stamp_cards.project_id)
      )
    )
  )';
  
  EXECUTE 'CREATE POLICY email_template_versions_project_access ON dabao_tenant.email_template_versions USING (
    EXISTS (
      SELECT 1 FROM dabao_tenant.email_templates
      WHERE email_templates.id = email_template_versions.template_id
      AND (
        email_templates.project_id = dabao.get_current_project_id() OR
        dabao.user_has_project_access(email_templates.project_id)
      )
    )
  )';
END $$;

-- ======= Authentication for service roles =======

-- Create policy for service roles which bypass RLS for authenticated services
-- This allows internal services with the right API key to access needed data

-- Function to check if current role is a service
CREATE OR REPLACE FUNCTION dabao.is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_setting('request.jwt.claims.role', true) = 'service_role';
EXCEPTION
  WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply service role bypass policies to all tables
DO $$ 
DECLARE
  schemas TEXT[] := ARRAY['dabao', 'dabao_tenant'];
  schema TEXT;
  tables TEXT[];
  t TEXT;
BEGIN
  FOREACH schema IN ARRAY schemas
  LOOP
    tables := ARRAY(
      SELECT tablename::TEXT 
      FROM pg_tables 
      WHERE schemaname = schema
    );
    
    FOREACH t IN ARRAY tables
    LOOP
      EXECUTE format('
        CREATE POLICY service_role_bypass ON %I.%I
        FOR ALL
        USING (dabao.is_service_role())
      ', schema, t);
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- Grant permissions to roles
-- ============================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA dabao TO authenticated;
GRANT USAGE ON SCHEMA dabao_tenant TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION dabao.get_current_user_id TO authenticated;
GRANT EXECUTE ON FUNCTION dabao.get_current_organization_id TO authenticated;
GRANT EXECUTE ON FUNCTION dabao.get_current_project_id TO authenticated;
GRANT EXECUTE ON FUNCTION dabao.user_belongs_to_organization TO authenticated;
GRANT EXECUTE ON FUNCTION dabao.project_belongs_to_organization TO authenticated;
GRANT EXECUTE ON FUNCTION dabao.user_has_project_access TO authenticated;
GRANT EXECUTE ON FUNCTION dabao.is_service_role TO authenticated;

-- ============================================
-- Set up JWT verification
-- ============================================

-- Ensure the JWT is validated and populated in the current settings
-- This needs to be configured with your auth provider (e.g., Supabase)
-- This is a placeholder for where you would configure JWT validation if not using Supabase