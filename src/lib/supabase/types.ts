export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          timezone: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          timezone?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          timezone?: string;
          settings?: Json;
          updated_at?: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'manager' | 'creator' | 'reviewer';
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: 'owner' | 'manager' | 'creator' | 'reviewer';
          created_at?: string;
        };
        Update: {
          role?: 'owner' | 'manager' | 'creator' | 'reviewer';
        };
      };
      connected_accounts: {
        Row: {
          id: string;
          workspace_id: string;
          platform: 'meta' | 'google';
          platform_account_id: string;
          account_name: string;
          account_email: string | null;
          profile_picture_url: string | null;
          encrypted_access_token: string;
          token_iv: string;
          token_auth_tag: string;
          encrypted_refresh_token: string | null;
          refresh_token_iv: string | null;
          refresh_token_auth_tag: string | null;
          token_expires_at: string | null;
          scopes: Json;
          status: 'active' | 'needs_reauth' | 'revoked' | 'expired' | 'pending_approval';
          status_message: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          platform: 'meta' | 'google';
          platform_account_id: string;
          account_name: string;
          account_email?: string | null;
          profile_picture_url?: string | null;
          encrypted_access_token: string;
          token_iv: string;
          token_auth_tag: string;
          encrypted_refresh_token?: string | null;
          refresh_token_iv?: string | null;
          refresh_token_auth_tag?: string | null;
          token_expires_at?: string | null;
          scopes?: Json;
          status?: 'active' | 'needs_reauth' | 'revoked' | 'expired' | 'pending_approval';
          status_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          account_name?: string;
          profile_picture_url?: string | null;
          encrypted_access_token?: string;
          token_iv?: string;
          token_auth_tag?: string;
          token_expires_at?: string | null;
          status?: 'active' | 'needs_reauth' | 'revoked' | 'expired' | 'pending_approval';
          status_message?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
      };
      connected_destinations: {
        Row: {
          id: string;
          workspace_id: string;
          connected_account_id: string;
          platform: 'facebook' | 'instagram' | 'google_business';
          destination_type: 'facebook_page' | 'instagram_professional' | 'google_location';
          destination_name: string;
          platform_destination_id: string;
          encrypted_destination_token: string | null;
          destination_token_iv: string | null;
          destination_token_auth_tag: string | null;
          is_enabled: boolean;
          requires_approval: boolean;
          approval_status: 'approved' | 'pending_api_access' | 'denied';
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          connected_account_id: string;
          platform: 'facebook' | 'instagram' | 'google_business';
          destination_type: 'facebook_page' | 'instagram_professional' | 'google_location';
          destination_name: string;
          platform_destination_id: string;
          encrypted_destination_token?: string | null;
          destination_token_iv?: string | null;
          destination_token_auth_tag?: string | null;
          is_enabled?: boolean;
          requires_approval?: boolean;
          approval_status?: 'approved' | 'pending_api_access' | 'denied';
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          destination_name?: string;
          encrypted_destination_token?: string | null;
          destination_token_iv?: string | null;
          destination_token_auth_tag?: string | null;
          is_enabled?: boolean;
          approval_status?: 'approved' | 'pending_api_access' | 'denied';
          metadata?: Json;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          workspace_id: string;
          author_id: string | null;
          title: string | null;
          base_caption: string;
          media_url: string;
          media_type: string;
          media_filename: string | null;
          media_size_bytes: number | null;
          status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'partially_published' | 'failed' | 'cancelled';
          scheduled_at: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          author_id?: string | null;
          title?: string | null;
          base_caption: string;
          media_url: string;
          media_type?: string;
          media_filename?: string | null;
          media_size_bytes?: number | null;
          status?: 'draft' | 'scheduled' | 'publishing' | 'published' | 'partially_published' | 'failed' | 'cancelled';
          scheduled_at?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          base_caption?: string;
          media_url?: string;
          status?: 'draft' | 'scheduled' | 'publishing' | 'published' | 'partially_published' | 'failed' | 'cancelled';
          scheduled_at?: string | null;
          published_at?: string | null;
          updated_at?: string;
        };
      };
      post_destinations: {
        Row: {
          id: string;
          post_id: string;
          workspace_id: string;
          destination_id: string;
          platform: 'facebook' | 'instagram' | 'google_business';
          custom_caption: string | null;
          status: 'pending' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'skipped' | 'cancelled';
          platform_post_id: string | null;
          platform_permalink: string | null;
          idempotent_key: string;
          attempts: number;
          last_attempted_at: string | null;
          error_code: string | null;
          error_message: string | null;
          error_details: Json | null;
          uncertain_outcome: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          workspace_id: string;
          destination_id: string;
          platform: 'facebook' | 'instagram' | 'google_business';
          custom_caption?: string | null;
          status?: 'pending' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'skipped' | 'cancelled';
          platform_post_id?: string | null;
          platform_permalink?: string | null;
          idempotent_key: string;
          attempts?: number;
          last_attempted_at?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          error_details?: Json | null;
          uncertain_outcome?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'skipped' | 'cancelled';
          platform_post_id?: string | null;
          platform_permalink?: string | null;
          attempts?: number;
          last_attempted_at?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          error_details?: Json | null;
          uncertain_outcome?: boolean;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string;
          metadata: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id: string;
          metadata?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
