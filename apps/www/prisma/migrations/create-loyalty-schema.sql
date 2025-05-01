-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create dabao_tenant schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS dabao_tenant;

-- Set search path
SET search_path = dabao, dabao_tenant, public;

-- Add new enums for our loyalty program
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency') THEN
        CREATE TYPE "currency" AS ENUM ('USD', 'EUR', 'GBP', 'SGD', 'INR', 'AUD', 'CAD', 'JPY', 'CNY', 'MYR');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reward_type') THEN
        CREATE TYPE "reward_type" AS ENUM ('POINTS', 'DISCOUNT', 'FREEBIE', 'CASH_BACK', 'TIER_UPGRADE', 'CUSTOM');
    END IF;
END
$$;

-- Create the billing table in the dabao schema
CREATE TABLE IF NOT EXISTS dabao.billing (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES dabao.organizations(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  currency currency NOT NULL DEFAULT 'USD',
  amount DECIMAL NOT NULL DEFAULT 0,
  "interval" TEXT NOT NULL DEFAULT 'month',
  status TEXT NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMP,
  canceled_at TIMESTAMP,
  current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Project preferences for the loyalty program
CREATE TABLE IF NOT EXISTS dabao_tenant.project_preferences (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE REFERENCES dabao_tenant.projects(id) ON DELETE CASCADE,
  points_name TEXT NOT NULL DEFAULT 'Points',
  points_abbreviation TEXT NOT NULL DEFAULT 'pts',
  welcome_message TEXT,
  default_currency currency NOT NULL DEFAULT 'USD',
  enable_referrals BOOLEAN NOT NULL DEFAULT TRUE,
  enable_tiers BOOLEAN NOT NULL DEFAULT FALSE,
  enable_gameification BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Rewards table
CREATE TABLE IF NOT EXISTS dabao_tenant.rewards (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES dabao_tenant.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type reward_type NOT NULL,
  value INTEGER NOT NULL, -- Points value or discount percentage
  code TEXT, -- For discount codes
  active BOOLEAN NOT NULL DEFAULT TRUE,
  image TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, code)
);

-- Customers table
CREATE TABLE IF NOT EXISTS dabao_tenant.customers (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES dabao_tenant.projects(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  external_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, email),
  UNIQUE (project_id, external_id)
);

-- Customer rewards junction table
CREATE TABLE IF NOT EXISTS dabao_tenant.customer_rewards (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES dabao_tenant.customers(id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL REFERENCES dabao_tenant.rewards(id) ON DELETE CASCADE,
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at TIMESTAMP,
  redeemed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Customer activities table for tracking points and actions
CREATE TABLE IF NOT EXISTS dabao_tenant.customer_activities (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES dabao_tenant.customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- purchase, login, referral, etc.
  description TEXT,
  points_earned INTEGER,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Customer referrals table
CREATE TABLE IF NOT EXISTS dabao_tenant.customer_referrals (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES dabao_tenant.customers(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Referred users table
CREATE TABLE IF NOT EXISTS dabao_tenant.referred_users (
  id TEXT PRIMARY KEY,
  customer_referral_id TEXT NOT NULL REFERENCES dabao_tenant.customer_referrals(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  converted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Campaigns table for marketing campaigns
CREATE TABLE IF NOT EXISTS dabao_tenant.campaigns (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES dabao_tenant.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Campaign rewards junction table
CREATE TABLE IF NOT EXISTS dabao_tenant.campaign_rewards (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES dabao_tenant.campaigns(id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL REFERENCES dabao_tenant.rewards(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, reward_id)
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_customer_rewards_customer_id ON dabao_tenant.customer_rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_rewards_reward_id ON dabao_tenant.customer_rewards(reward_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer_id ON dabao_tenant.customer_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_type ON dabao_tenant.customer_activities(type);
CREATE INDEX IF NOT EXISTS idx_rewards_project_id ON dabao_tenant.rewards(project_id);
CREATE INDEX IF NOT EXISTS idx_customers_project_id ON dabao_tenant.customers(project_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_project_id ON dabao_tenant.campaigns(project_id);

-- Create functions for Row Level Security with Supabase
-- Function to add a user's permission for a project
CREATE OR REPLACE FUNCTION public.add_user_project_permissions(p_user_id UUID, p_project_id TEXT, p_role TEXT DEFAULT 'MEMBER')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_projects (id, user_id, project_id, role)
  VALUES (gen_random_uuid(), p_user_id, p_project_id, p_role)
  ON CONFLICT (user_id, project_id) DO UPDATE SET role = p_role;
  
  RETURN true;
END;
$$;

-- Function to check if a user has access to a project
CREATE OR REPLACE FUNCTION public.check_user_has_project_access(p_user_id UUID, p_project_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_projects
    WHERE user_id = p_user_id AND project_id = p_project_id
  );
END;
$$;

-- Function to get all projects a user has access to
CREATE OR REPLACE FUNCTION public.get_user_projects(p_user_id UUID)
RETURNS TABLE(project_id TEXT, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT up.project_id, up.role FROM public.user_projects up
  WHERE up.user_id = p_user_id;
END;
$$;

-- Create Row Level Security (RLS) policies
ALTER TABLE dabao_tenant.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE dabao_tenant.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dabao_tenant.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dabao_tenant.customer_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dabao_tenant.customer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dabao_tenant.customer_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dabao_tenant.campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
CREATE POLICY project_user_policy ON dabao_tenant.projects
  USING (
    EXISTS (
      SELECT 1 FROM public.user_projects up
      WHERE up.project_id = id AND up.user_id = auth.uid()
    )
  );

-- Create policies for rewards
CREATE POLICY reward_project_policy ON dabao_tenant.rewards
  USING (
    EXISTS (
      SELECT 1 FROM public.user_projects up
      WHERE up.project_id = project_id AND up.user_id = auth.uid()
    )
  );

-- Create policies for customers
CREATE POLICY customer_project_policy ON dabao_tenant.customers
  USING (
    EXISTS (
      SELECT 1 FROM public.user_projects up
      WHERE up.project_id = project_id AND up.user_id = auth.uid()
    )
  );

-- Create policies for customer_rewards
CREATE POLICY customer_reward_project_policy ON dabao_tenant.customer_rewards
  USING (
    EXISTS (
      SELECT 1 FROM dabao_tenant.customers c 
      JOIN public.user_projects up ON c.project_id = up.project_id
      WHERE c.id = customer_id AND up.user_id = auth.uid()
    )
  );

-- Create policies for customer_activities
CREATE POLICY customer_activity_project_policy ON dabao_tenant.customer_activities
  USING (
    EXISTS (
      SELECT 1 FROM dabao_tenant.customers c 
      JOIN public.user_projects up ON c.project_id = up.project_id
      WHERE c.id = customer_id AND up.user_id = auth.uid()
    )
  );

-- Create policies for campaigns
CREATE POLICY campaign_project_policy ON dabao_tenant.campaigns
  USING (
    EXISTS (
      SELECT 1 FROM public.user_projects up
      WHERE up.project_id = project_id AND up.user_id = auth.uid()
    )
  );