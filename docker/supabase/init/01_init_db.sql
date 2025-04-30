-- Initialize Supabase database with multi-tenant schema support
-- This script runs when the PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS _tenants; -- Schema to store tenant metadata

-- Set up Row Level Security (RLS)
ALTER DATABASE postgres SET "anon.tenant_id" TO '';
ALTER DATABASE postgres SET "service_role.bypass_rls" TO 'true';

-- Create tenant management tables
CREATE TABLE IF NOT EXISTS _tenants.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    schema_name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    config JSONB DEFAULT '{}'::JSONB,
    owner_id UUID NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

-- Create function to create a new tenant schema
CREATE OR REPLACE FUNCTION _tenants.create_tenant_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Create schema dynamically
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    
    -- Create basic tenant tables in the new schema
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            auth_id UUID NOT NULL,
            email TEXT UNIQUE NOT NULL,
            first_name TEXT,
            last_name TEXT,
            phone TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            metadata JSONB DEFAULT ''{}'',
            active BOOLEAN DEFAULT TRUE
        )', schema_name);
    
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.rewards (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            description TEXT,
            points_required INTEGER NOT NULL,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            image_url TEXT,
            metadata JSONB DEFAULT ''{}''
        )', schema_name);
    
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.user_points (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES %I.users(id),
            points_balance INTEGER NOT NULL DEFAULT 0,
            total_points_earned INTEGER NOT NULL DEFAULT 0,
            total_points_spent INTEGER NOT NULL DEFAULT 0,
            last_activity_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', schema_name, schema_name);
    
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.point_transactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES %I.users(id),
            points INTEGER NOT NULL,
            transaction_type TEXT NOT NULL CHECK (transaction_type IN (''earn'', ''spend'', ''expire'', ''adjustment'')),
            reference_id UUID,
            description TEXT,
            metadata JSONB DEFAULT ''{}'',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', schema_name, schema_name);
    
    -- Set up Row Level Security (RLS) for the tenant schema
    EXECUTE format('ALTER TABLE %I.users ENABLE ROW LEVEL SECURITY', schema_name);
    EXECUTE format('ALTER TABLE %I.rewards ENABLE ROW LEVEL SECURITY', schema_name);
    EXECUTE format('ALTER TABLE %I.user_points ENABLE ROW LEVEL SECURITY', schema_name);
    EXECUTE format('ALTER TABLE %I.point_transactions ENABLE ROW LEVEL SECURITY', schema_name);
    
    -- Create RLS policies
    -- Users can only see their own data
    EXECUTE format('
        CREATE POLICY user_isolation ON %I.users
        FOR ALL
        USING (auth_id = auth.uid())
        WITH CHECK (auth_id = auth.uid())
    ', schema_name);
    
    EXECUTE format('
        CREATE POLICY user_points_isolation ON %I.user_points
        FOR ALL
        USING (user_id IN (SELECT id FROM %I.users WHERE auth_id = auth.uid()))
        WITH CHECK (user_id IN (SELECT id FROM %I.users WHERE auth_id = auth.uid()))
    ', schema_name, schema_name, schema_name);
    
    EXECUTE format('
        CREATE POLICY point_transactions_isolation ON %I.point_transactions
        FOR ALL
        USING (user_id IN (SELECT id FROM %I.users WHERE auth_id = auth.uid()))
        WITH CHECK (user_id IN (SELECT id FROM %I.users WHERE auth_id = auth.uid()))
    ', schema_name, schema_name, schema_name);
    
    -- Everyone can see active rewards
    EXECUTE format('
        CREATE POLICY rewards_visibility ON %I.rewards
        FOR SELECT
        USING (active = true)
    ', schema_name);
    
    -- Only admins can manage rewards
    EXECUTE format('
        CREATE POLICY rewards_admin ON %I.rewards
        FOR ALL
        USING (pg_has_role(auth.uid(), ''%I_admin'', ''member''))
        WITH CHECK (pg_has_role(auth.uid(), ''%I_admin'', ''member''))
    ', schema_name, schema_name, schema_name);
END;
$$ LANGUAGE plpgsql;

-- Create function to register a new tenant
CREATE OR REPLACE FUNCTION _tenants.register_tenant(
    tenant_name TEXT,
    tenant_slug TEXT,
    owner_id UUID
) RETURNS UUID AS $$
DECLARE
    schema_name TEXT;
    tenant_id UUID;
BEGIN
    -- Generate schema name from slug
    schema_name := 'tenant_' || tenant_slug;
    
    -- Insert tenant record
    INSERT INTO _tenants.projects (name, slug, schema_name, owner_id)
    VALUES (tenant_name, tenant_slug, schema_name, owner_id)
    RETURNING id INTO tenant_id;
    
    -- Create the tenant schema and tables
    PERFORM _tenants.create_tenant_schema(schema_name);
    
    -- Create tenant-specific role
    EXECUTE format('CREATE ROLE %I_admin', schema_name);
    
    -- Grant the tenant owner the admin role
    EXECUTE format('GRANT %I_admin TO authenticated', schema_name);
    
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get current tenant
CREATE OR REPLACE FUNCTION auth.get_tenant_id() RETURNS UUID AS $$
DECLARE
    tenant_slug TEXT;
    tenant_id UUID;
BEGIN
    -- Extract tenant from request headers or JWT claims
    tenant_slug := NULLIF(current_setting('request.headers.x-tenant-id', TRUE), '');
    
    -- If not found in headers, try JWT claims
    IF tenant_slug IS NULL THEN
        tenant_slug := NULLIF(current_setting('request.jwt.claims.tenant_id', TRUE), '');
    END IF;
    
    -- If still not found, return NULL (no tenant context)
    IF tenant_slug IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Look up the tenant ID from the slug
    SELECT id INTO tenant_id
    FROM _tenants.projects
    WHERE slug = tenant_slug AND active = TRUE;
    
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get current tenant schema
CREATE OR REPLACE FUNCTION auth.get_tenant_schema() RETURNS TEXT AS $$
DECLARE
    tenant_slug TEXT;
    schema_name TEXT;
BEGIN
    -- Extract tenant from request headers or JWT claims
    tenant_slug := NULLIF(current_setting('request.headers.x-tenant-id', TRUE), '');
    
    -- If not found in headers, try JWT claims
    IF tenant_slug IS NULL THEN
        tenant_slug := NULLIF(current_setting('request.jwt.claims.tenant_id', TRUE), '');
    END IF;
    
    -- If still not found, return NULL (no tenant context)
    IF tenant_slug IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Look up the schema name from the slug
    SELECT schema_name INTO schema_name
    FROM _tenants.projects
    WHERE slug = tenant_slug AND active = TRUE;
    
    RETURN schema_name;
END;
$$ LANGUAGE plpgsql;

-- Set permissions
ALTER SCHEMA _tenants OWNER TO postgres;
GRANT USAGE ON SCHEMA _tenants TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA _tenants TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA _tenants TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA _tenants TO service_role;

-- Create sample tenants for development
DO $$
DECLARE
    owner_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Only create sample tenants in development mode
    IF current_database() = 'postgres' THEN
        PERFORM _tenants.register_tenant('Demo Company', 'demo', owner_id);
        PERFORM _tenants.register_tenant('Test Business', 'test', owner_id);
    END IF;
END $$;