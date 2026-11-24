/**
 * Typed PostgreSQL schema contract matching `supabase/migrations/202611240001_m0_foundation.sql`.
 * Matches `supabase gen types typescript` non-circular format for `@supabase/postgrest-js` v2.
 * Regenerate automatically against Staging/Local Supabase with `npm run db:types`.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type VisibilityScope = "public" | "connections" | "organisation" | "private";
export type AvailabilityStatus =
  | "open_to_opportunities"
  | "actively_looking"
  | "mentoring"
  | "collaborating"
  | "unavailable";
export type OrgType =
  | "company"
  | "university"
  | "ngo"
  | "community"
  | "research_institute"
  | "government"
  | "other";
export type VerificationTier = "unverified" | "domain_verified" | "officially_verified";
export type OrgRole = "owner" | "admin" | "recruiter" | "member";
export type MembershipStatus = "invited" | "active" | "suspended";
export type ConsentType = "terms_and_privacy" | "ai_context_processing" | "marketing_emails";

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          handle: string | null;
          full_name: string;
          headline: string;
          bio: string;
          avatar_url: string | null;
          country_code: string | null;
          city: string | null;
          timezone: string;
          career_goal: string;
          availability_status: AvailabilityStatus;
          visibility_scope: VisibilityScope;
          ai_context_consent: boolean;
          profile_completion_score: number;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          handle?: string | null;
          full_name?: string;
          headline?: string;
          bio?: string;
          avatar_url?: string | null;
          country_code?: string | null;
          city?: string | null;
          timezone?: string;
          career_goal?: string;
          availability_status?: AvailabilityStatus;
          visibility_scope?: VisibilityScope;
          ai_context_consent?: boolean;
          profile_completion_score?: number;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          handle?: string | null;
          full_name?: string;
          headline?: string;
          bio?: string;
          avatar_url?: string | null;
          country_code?: string | null;
          city?: string | null;
          timezone?: string;
          career_goal?: string;
          availability_status?: AvailabilityStatus;
          visibility_scope?: VisibilityScope;
          ai_context_consent?: boolean;
          profile_completion_score?: number;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organisations: {
        Row: {
          id: string;
          slug: string;
          name: string;
          org_type: OrgType;
          description: string;
          country_code: string | null;
          website_url: string | null;
          logo_url: string | null;
          verification_tier: VerificationTier;
          domain_verified_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          org_type?: OrgType;
          description?: string;
          country_code?: string | null;
          website_url?: string | null;
          logo_url?: string | null;
          verification_tier?: VerificationTier;
          domain_verified_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          org_type?: OrgType;
          description?: string;
          country_code?: string | null;
          website_url?: string | null;
          logo_url?: string | null;
          verification_tier?: VerificationTier;
          domain_verified_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organisation_memberships: {
        Row: {
          id: string;
          organisation_id: string;
          user_id: string;
          role: OrgRole;
          status: MembershipStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          user_id: string;
          role?: OrgRole;
          status?: MembershipStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          user_id?: string;
          role?: OrgRole;
          status?: MembershipStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      consent_logs: {
        Row: {
          id: string;
          user_id: string;
          consent_type: ConsentType;
          policy_version: string;
          granted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          consent_type: ConsentType;
          policy_version: string;
          granted: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          consent_type?: ConsentType;
          policy_version?: string;
          granted?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          organisation_id: string | null;
          action: string;
          target_type: string;
          target_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          organisation_id?: string | null;
          action: string;
          target_type: string;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          organisation_id?: string | null;
          action?: string;
          target_type?: string;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_org_role: {
        Args: { p_org_id: string; p_roles: string[] };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
