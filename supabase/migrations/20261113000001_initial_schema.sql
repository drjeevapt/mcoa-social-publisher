-- ====================================================================
-- MCOA Social Publisher - Initial Database Schema
-- Multi-workspace architecture, RLS, audit logs, and post tracking
-- ====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    settings JSONB NOT NULL DEFAULT '{"notifications": {"failed_post_alert": true, "weekly_summary": false}}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Workspace members table (RBAC: owner, manager, creator, reviewer)
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'creator', 'reviewer')) DEFAULT 'owner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(workspace_id, user_id)
);

-- 4. Connected Accounts table (Stores provider connection and encrypted tokens)
CREATE TABLE IF NOT EXISTS public.connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
    platform_account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_email TEXT,
    profile_picture_url TEXT,
    encrypted_access_token TEXT NOT NULL,
    token_iv TEXT NOT NULL,
    token_auth_tag TEXT NOT NULL,
    encrypted_refresh_token TEXT,
    refresh_token_iv TEXT,
    refresh_token_auth_tag TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('active', 'needs_reauth', 'revoked', 'expired', 'pending_approval')) DEFAULT 'active',
    status_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(workspace_id, platform, platform_account_id)
);

-- 5. Connected Destinations (Facebook Pages, IG Professional accounts, GBP locations)
CREATE TABLE IF NOT EXISTS public.connected_destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    connected_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'google_business')),
    destination_type TEXT NOT NULL CHECK (destination_type IN ('facebook_page', 'instagram_professional', 'google_location')),
    destination_name TEXT NOT NULL,
    platform_destination_id TEXT NOT NULL,
    encrypted_destination_token TEXT,
    destination_token_iv TEXT,
    destination_token_auth_tag TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    requires_approval BOOLEAN NOT NULL DEFAULT false,
    approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('approved', 'pending_api_access', 'denied')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(workspace_id, platform, platform_destination_id)
);

-- 6. Posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT,
    base_caption TEXT NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image/jpeg',
    media_filename TEXT,
    media_size_bytes BIGINT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'partially_published', 'failed', 'cancelled')) DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Post Destinations table (Granular per-platform state, idempotent retry keys, per-platform captions)
CREATE TABLE IF NOT EXISTS public.post_destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    destination_id UUID NOT NULL REFERENCES public.connected_destinations(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'google_business')),
    custom_caption TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'scheduled', 'publishing', 'published', 'failed', 'skipped', 'cancelled')) DEFAULT 'pending',
    platform_post_id TEXT,
    platform_permalink TEXT,
    idempotent_key TEXT NOT NULL UNIQUE,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempted_at TIMESTAMPTZ,
    error_code TEXT,
    error_message TEXT,
    error_details JSONB,
    uncertain_outcome BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(post_id, destination_id)
);

-- 8. Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- Indexes for High Performance
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_posts_workspace_status ON public.posts(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON public.posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_post_destinations_post_id ON public.post_destinations(post_id);
CREATE INDEX IF NOT EXISTS idx_post_destinations_status ON public.post_destinations(status);
CREATE INDEX IF NOT EXISTS idx_destinations_workspace ON public.connected_destinations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON public.audit_logs(workspace_id, created_at DESC);

-- ====================================================================
-- Row Level Security (RLS) Policies
-- ====================================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security function: Get all workspace IDs the authenticated user belongs to
CREATE OR REPLACE FUNCTION public.get_auth_workspaces()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid();
$$;

-- Workspaces Policies
CREATE POLICY "Users can view workspaces they are members of"
    ON public.workspaces FOR SELECT
    USING (id IN (SELECT get_auth_workspaces()));

CREATE POLICY "Workspace owners can update workspace details"
    ON public.workspaces FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_members.workspace_id = workspaces.id
              AND workspace_members.user_id = auth.uid()
              AND workspace_members.role IN ('owner', 'manager')
        )
    );

-- Workspace Members Policies
CREATE POLICY "Users can view members of their workspaces"
    ON public.workspace_members FOR SELECT
    USING (workspace_id IN (SELECT get_auth_workspaces()));

-- Connected Accounts Policies (Tokens NEVER exposed directly to anon/public)
CREATE POLICY "Workspace members can view connected accounts"
    ON public.connected_accounts FOR SELECT
    USING (workspace_id IN (SELECT get_auth_workspaces()));

CREATE POLICY "Workspace owners/managers can modify connected accounts"
    ON public.connected_accounts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_members.workspace_id = connected_accounts.workspace_id
              AND workspace_members.user_id = auth.uid()
              AND workspace_members.role IN ('owner', 'manager')
        )
    );

-- Connected Destinations Policies
CREATE POLICY "Workspace members can view connected destinations"
    ON public.connected_destinations FOR SELECT
    USING (workspace_id IN (SELECT get_auth_workspaces()));

CREATE POLICY "Workspace owners/managers can manage connected destinations"
    ON public.connected_destinations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_members.workspace_id = connected_destinations.workspace_id
              AND workspace_members.user_id = auth.uid()
              AND workspace_members.role IN ('owner', 'manager')
        )
    );

-- Posts Policies
CREATE POLICY "Workspace members can view posts"
    ON public.posts FOR SELECT
    USING (workspace_id IN (SELECT get_auth_workspaces()));

CREATE POLICY "Workspace members can insert posts"
    ON public.posts FOR INSERT
    WITH CHECK (workspace_id IN (SELECT get_auth_workspaces()));

CREATE POLICY "Workspace members can update posts"
    ON public.posts FOR UPDATE
    USING (workspace_id IN (SELECT get_auth_workspaces()));

CREATE POLICY "Workspace members can delete posts"
    ON public.posts FOR DELETE
    USING (workspace_id IN (SELECT get_auth_workspaces()));

-- Post Destinations Policies
CREATE POLICY "Workspace members can view post destinations"
    ON public.post_destinations FOR SELECT
    USING (workspace_id IN (SELECT get_auth_workspaces()));

CREATE POLICY "Workspace members can insert post destinations"
    ON public.post_destinations FOR INSERT
    WITH CHECK (workspace_id IN (SELECT get_auth_workspaces()));

CREATE POLICY "Workspace members can update post destinations"
    ON public.post_destinations FOR UPDATE
    USING (workspace_id IN (SELECT get_auth_workspaces()));

CREATE POLICY "Workspace members can delete post destinations"
    ON public.post_destinations FOR DELETE
    USING (workspace_id IN (SELECT get_auth_workspaces()));

-- Audit Logs Policies
CREATE POLICY "Workspace members can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (workspace_id IN (SELECT get_auth_workspaces()));

CREATE POLICY "Workspace members can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (workspace_id IN (SELECT get_auth_workspaces()));

-- ====================================================================
-- Role Permissions & Grants for Supabase API Roles
-- ====================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

