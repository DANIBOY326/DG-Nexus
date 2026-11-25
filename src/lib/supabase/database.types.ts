/**
 * Typed PostgreSQL schema contract matching M0 + M1 migrations:
 * - 202611240001_m0_foundation.sql
 * - 202611240002_m0_role_grants.sql
 * - 202611250001_m1_onboarding_skills_privacy.sql
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
export type SkillProficiency = "beginner" | "intermediate" | "advanced" | "expert";
export type SkillEvidenceStatus = "self_reported" | "portfolio_backed" | "verified";
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
          interests: string[];
          career_goals: string[];
          career_goal: string;
          availability_status: AvailabilityStatus;
          visibility_scope: VisibilityScope;
          ai_context_consent: boolean;
          profile_completion_score: number;
          onboarding_step: number;
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
          interests?: string[];
          career_goals?: string[];
          career_goal?: string;
          availability_status?: AvailabilityStatus;
          visibility_scope?: VisibilityScope;
          ai_context_consent?: boolean;
          profile_completion_score?: number;
          onboarding_step?: number;
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
          interests?: string[];
          career_goals?: string[];
          career_goal?: string;
          availability_status?: AvailabilityStatus;
          visibility_scope?: VisibilityScope;
          ai_context_consent?: boolean;
          profile_completion_score?: number;
          onboarding_step?: number;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          slug: string;
          name: string;
          normalised_name: string;
          category: string;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          category: string;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          category?: string;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profile_skills: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          proficiency_level: SkillProficiency;
          evidence_status: SkillEvidenceStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: string;
          proficiency_level?: SkillProficiency;
          evidence_status?: SkillEvidenceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          skill_id?: string;
          proficiency_level?: SkillProficiency;
          evidence_status?: SkillEvidenceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_skills_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
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
          target_type: string;
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
