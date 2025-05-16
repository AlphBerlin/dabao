-- Migration script to add ProjectDomain and ProjectClient tables
-- Run this after applying migrations normally with Prisma Migrate

-- First, add the new enums
CREATE TYPE "dabao_tenant"."DomainType" AS ENUM ('PRIMARY', 'SUBDOMAIN', 'CUSTOM_DOMAIN', 'ALIAS');
CREATE TYPE "dabao_tenant"."ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'EXPIRED');

-- Create ProjectDomain table
CREATE TABLE "dabao_tenant"."project_domains" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "type" "dabao_tenant"."DomainType" NOT NULL DEFAULT 'SUBDOMAIN',
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "verification_token" TEXT,
  "verified_at" TIMESTAMP(3),
  "dns_settings" JSONB,
  "ssl_enabled" BOOLEAN NOT NULL DEFAULT false,
  "ssl_certificate" TEXT,
  "ssl_expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "project_domains_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_domains_domain_key" UNIQUE ("domain"),
  CONSTRAINT "project_domains_project_id_domain_key" UNIQUE ("project_id", "domain"),
  CONSTRAINT "project_domains_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "dabao_tenant"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create ProjectClient table
CREATE TABLE "dabao_tenant"."project_clients" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "domain_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "client_id" TEXT NOT NULL,
  "client_secret" TEXT NOT NULL,
  "api_key" TEXT NOT NULL,
  "status" "dabao_tenant"."ClientStatus" NOT NULL DEFAULT 'ACTIVE',
  "access_scope" JSONB NOT NULL,
  "allowed_ips" TEXT[] NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "expires_at" TIMESTAMP(3),
  "last_used_at" TIMESTAMP(3),

  CONSTRAINT "project_clients_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_clients_client_id_key" UNIQUE ("client_id"),
  CONSTRAINT "project_clients_api_key_key" UNIQUE ("api_key"),
  CONSTRAINT "project_clients_project_id_client_id_key" UNIQUE ("project_id", "client_id"),
  CONSTRAINT "project_clients_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "dabao_tenant"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "project_clients_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "dabao_tenant"."project_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index on project_domains for faster queries
CREATE INDEX "project_domains_project_id_idx" ON "dabao_tenant"."project_domains"("project_id");
CREATE INDEX "project_domains_domain_idx" ON "dabao_tenant"."project_domains"("domain");

-- Create index on project_clients for faster queries
CREATE INDEX "project_clients_project_id_idx" ON "dabao_tenant"."project_clients"("project_id");
CREATE INDEX "project_clients_domain_id_idx" ON "dabao_tenant"."project_clients"("domain_id");
CREATE INDEX "project_clients_client_id_idx" ON "dabao_tenant"."project_clients"("client_id");

-- Add Row Level Security (RLS) policies for project_domains
ALTER TABLE "dabao_tenant"."project_domains" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_domains_select_policy"
ON "dabao_tenant"."project_domains"
FOR SELECT
USING (
  project_id = current_setting('jwt.claims.project_id')::text
);

CREATE POLICY "project_domains_insert_policy"
ON "dabao_tenant"."project_domains"
FOR INSERT
WITH CHECK (
  project_id = current_setting('jwt.claims.project_id')::text
);

CREATE POLICY "project_domains_update_policy"
ON "dabao_tenant"."project_domains"
FOR UPDATE
USING (
  project_id = current_setting('jwt.claims.project_id')::text
);

CREATE POLICY "project_domains_delete_policy"
ON "dabao_tenant"."project_domains"
FOR DELETE
USING (
  project_id = current_setting('jwt.claims.project_id')::text
);

-- Add Row Level Security (RLS) policies for project_clients
ALTER TABLE "dabao_tenant"."project_clients" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_clients_select_policy"
ON "dabao_tenant"."project_clients"
FOR SELECT
USING (
  project_id = current_setting('jwt.claims.project_id')::text
);

CREATE POLICY "project_clients_insert_policy"
ON "dabao_tenant"."project_clients"
FOR INSERT
WITH CHECK (
  project_id = current_setting('jwt.claims.project_id')::text
);

CREATE POLICY "project_clients_update_policy"
ON "dabao_tenant"."project_clients"
FOR UPDATE
USING (
  project_id = current_setting('jwt.claims.project_id')::text
);

CREATE POLICY "project_clients_delete_policy"
ON "dabao_tenant"."project_clients"
FOR DELETE
USING (
  project_id = current_setting('jwt.claims.project_id')::text
);

-- Create domain-based request validation function
CREATE OR REPLACE FUNCTION "dabao_tenant"."get_project_id_from_domain"(domain_name text)
RETURNS text AS $$
DECLARE
  project_id text;
BEGIN
  SELECT pd.project_id INTO project_id
  FROM "dabao_tenant"."project_domains" pd
  WHERE pd.domain = domain_name;
  
  RETURN project_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to authenticate client API keys
CREATE OR REPLACE FUNCTION "dabao_tenant"."authenticate_client_api_key"(api_key text, domain_name text)
RETURNS boolean AS $$
DECLARE
  valid boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM "dabao_tenant"."project_clients" pc
    JOIN "dabao_tenant"."project_domains" pd ON pc.domain_id = pd.id
    WHERE pc.api_key = api_key
    AND pd.domain = domain_name
    AND pc.status = 'ACTIVE'
  ) INTO valid;
  
  -- Update the last_used_at timestamp if valid
  IF valid THEN
    UPDATE "dabao_tenant"."project_clients"
    SET last_used_at = CURRENT_TIMESTAMP
    WHERE api_key = api_key;
  END IF;
  
  RETURN valid;
END;
$$ LANGUAGE plpgsql;

-- Create view for active domains with their client information
CREATE OR REPLACE VIEW "dabao_tenant"."active_domain_clients" AS
SELECT
  pd.domain,
  pd.type,
  pd.is_primary,
  pc.client_id,
  pc.name AS client_name,
  p.id AS project_id,
  p.name AS project_name
FROM "dabao_tenant"."project_domains" pd
JOIN "dabao_tenant"."project_clients" pc ON pd.id = pc.domain_id
JOIN "dabao_tenant"."projects" p ON pd.project_id = p.id
WHERE 
  pd.is_verified = true
  AND pc.status = 'ACTIVE'
  AND (pc.expires_at IS NULL OR pc.expires_at > CURRENT_TIMESTAMP);
