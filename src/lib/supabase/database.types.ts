/**
 * Typed PostgreSQL schema contract matching M0 + M1 + M2 migrations:
 * - 202611240001_m0_foundation.sql
 * - 202611240002_m0_role_grants.sql
 * - 202611250001_m1_onboarding_skills_privacy.sql
 * - 202611260001_m2_profiles_portfolio_evidence.sql
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type VisibilityScope = "public" | "connections" | "organisation" | "private";
export type RecordVisibilityScope = "public" | "connections" | "private";
export type AvailabilityStatus =
  | "open_to_opportunities"
  | "actively_looking"
  | "mentoring"
  | "collaborating"
  | "unavailable";
export type WorkArrangement = "onsite" | "hybrid" | "remote" | "flexible";
export type RoleWorkArrangement = "onsite" | "hybrid" | "remote";
export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "freelance"
  | "internship"
  | "volunteer"
  | "fellowship"
  | "apprenticeship"
  | "other";
export type EducationPathwayType =
  | "degree"
  | "diploma"
  | "bootcamp"
  | "vocational"
  | "professional_training"
  | "certification_programme"
  | "self_directed"
  | "other";
export type CredentialVerificationStatus =
  | "self_reported"
  | "evidence_submitted"
  | "under_review"
  | "verified"
  | "rejected"
  | "expired";
export type ProjectType =
  | "personal"
  | "client_professional"
  | "academic"
  | "open_source"
  | "collaborative"
  | "volunteer"
  | "research";
export type ProjectStatus = "in_progress" | "completed" | "ongoing" | "archived";
export type EvidenceEntityType = "project" | "credential" | "education" | "avatar";
export type SkillProficiency = "beginner" | "intermediate" | "advanced" | "expert";
export type SkillEvidenceStatus =
  | "self_reported"
  | "portfolio_supported"
  | "assessed"
  | "mentor_reviewed"
  | "credential_verified";
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
          current_focus: string;
          work_arrangement: WorkArrangement;
          achievements: string[];
          contact_links: Json;
          allow_search_indexing: boolean;
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
          current_focus?: string;
          work_arrangement?: WorkArrangement;
          achievements?: string[];
          contact_links?: Json;
          allow_search_indexing?: boolean;
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
          current_focus?: string;
          work_arrangement?: WorkArrangement;
          achievements?: string[];
          contact_links?: Json;
          allow_search_indexing?: boolean;
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
      project_categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profile_experiences: {
        Row: {
          id: string;
          user_id: string;
          organisation_name: string;
          role_title: string;
          employment_type: EmploymentType;
          location: string;
          work_arrangement: RoleWorkArrangement;
          start_date: string;
          end_date: string | null;
          is_current: boolean;
          description: string;
          responsibilities: string[];
          achievements: string[];
          display_order: number;
          visibility_scope: RecordVisibilityScope;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organisation_name: string;
          role_title: string;
          employment_type?: EmploymentType;
          location?: string;
          work_arrangement?: RoleWorkArrangement;
          start_date: string;
          end_date?: string | null;
          is_current?: boolean;
          description?: string;
          responsibilities?: string[];
          achievements?: string[];
          display_order?: number;
          visibility_scope?: RecordVisibilityScope;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organisation_name?: string;
          role_title?: string;
          employment_type?: EmploymentType;
          location?: string;
          work_arrangement?: RoleWorkArrangement;
          start_date?: string;
          end_date?: string | null;
          is_current?: boolean;
          description?: string;
          responsibilities?: string[];
          achievements?: string[];
          display_order?: number;
          visibility_scope?: RecordVisibilityScope;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_experiences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      experience_skills: {
        Row: {
          id: string;
          experience_id: string;
          skill_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          experience_id: string;
          skill_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          experience_id?: string;
          skill_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "experience_skills_experience_id_fkey";
            columns: ["experience_id"];
            isOneToOne: false;
            referencedRelation: "profile_experiences";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "experience_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_educations: {
        Row: {
          id: string;
          user_id: string;
          institution: string;
          qualification: string;
          pathway_type: EducationPathwayType;
          field_of_study: string;
          start_year: number;
          end_year: number | null;
          is_current: boolean;
          description: string;
          achievements: string[];
          display_order: number;
          visibility_scope: RecordVisibilityScope;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          institution: string;
          qualification: string;
          pathway_type?: EducationPathwayType;
          field_of_study?: string;
          start_year: number;
          end_year?: number | null;
          is_current?: boolean;
          description?: string;
          achievements?: string[];
          display_order?: number;
          visibility_scope?: RecordVisibilityScope;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          institution?: string;
          qualification?: string;
          pathway_type?: EducationPathwayType;
          field_of_study?: string;
          start_year?: number;
          end_year?: number | null;
          is_current?: boolean;
          description?: string;
          achievements?: string[];
          display_order?: number;
          visibility_scope?: RecordVisibilityScope;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_educations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      profile_credentials: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          issuing_organisation: string;
          issue_date: string | null;
          expiry_date: string | null;
          credential_id_code: string;
          verification_url: string | null;
          verification_status: CredentialVerificationStatus;
          visibility_scope: RecordVisibilityScope;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          issuing_organisation: string;
          issue_date?: string | null;
          expiry_date?: string | null;
          credential_id_code?: string;
          verification_url?: string | null;
          verification_status?: CredentialVerificationStatus;
          visibility_scope?: RecordVisibilityScope;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          issuing_organisation?: string;
          issue_date?: string | null;
          expiry_date?: string | null;
          credential_id_code?: string;
          verification_url?: string | null;
          verification_status?: CredentialVerificationStatus;
          visibility_scope?: RecordVisibilityScope;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_credentials_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      credential_skills: {
        Row: {
          id: string;
          credential_id: string;
          skill_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          credential_id: string;
          skill_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          credential_id?: string;
          skill_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credential_skills_credential_id_fkey";
            columns: ["credential_id"];
            isOneToOne: false;
            referencedRelation: "profile_credentials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credential_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      portfolio_projects: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          title: string;
          summary: string;
          description: string;
          category_slug: string;
          project_type: ProjectType;
          project_status: ProjectStatus;
          start_date: string | null;
          completion_date: string | null;
          associated_organisation: string;
          is_collaborative: boolean;
          member_role: string;
          member_contribution: string;
          team_members: string[];
          outcomes: string[];
          achievements: string[];
          tools_used: string[];
          project_url: string | null;
          repository_url: string | null;
          visibility_scope: RecordVisibilityScope;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slug: string;
          title: string;
          summary: string;
          description?: string;
          category_slug: string;
          project_type?: ProjectType;
          project_status?: ProjectStatus;
          start_date?: string | null;
          completion_date?: string | null;
          associated_organisation?: string;
          is_collaborative?: boolean;
          member_role?: string;
          member_contribution?: string;
          team_members?: string[];
          outcomes?: string[];
          achievements?: string[];
          tools_used?: string[];
          project_url?: string | null;
          repository_url?: string | null;
          visibility_scope?: RecordVisibilityScope;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slug?: string;
          title?: string;
          summary?: string;
          description?: string;
          category_slug?: string;
          project_type?: ProjectType;
          project_status?: ProjectStatus;
          start_date?: string | null;
          completion_date?: string | null;
          associated_organisation?: string;
          is_collaborative?: boolean;
          member_role?: string;
          member_contribution?: string;
          team_members?: string[];
          outcomes?: string[];
          achievements?: string[];
          tools_used?: string[];
          project_url?: string | null;
          repository_url?: string | null;
          visibility_scope?: RecordVisibilityScope;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "portfolio_projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "portfolio_projects_category_slug_fkey";
            columns: ["category_slug"];
            isOneToOne: false;
            referencedRelation: "project_categories";
            referencedColumns: ["slug"];
          },
        ];
      };
      portfolio_project_skills: {
        Row: {
          id: string;
          project_id: string;
          skill_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          skill_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          skill_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "portfolio_project_skills_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "portfolio_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "portfolio_project_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      evidence_files: {
        Row: {
          id: string;
          user_id: string;
          entity_type: EvidenceEntityType;
          project_id: string | null;
          credential_id: string | null;
          education_id: string | null;
          storage_bucket: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          file_size_bytes: number;
          caption: string;
          visibility_scope: RecordVisibilityScope;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: EvidenceEntityType;
          project_id?: string | null;
          credential_id?: string | null;
          education_id?: string | null;
          storage_bucket?: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          file_size_bytes: number;
          caption?: string;
          visibility_scope?: RecordVisibilityScope;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_type?: EvidenceEntityType;
          project_id?: string | null;
          credential_id?: string | null;
          education_id?: string | null;
          storage_bucket?: string;
          storage_path?: string;
          file_name?: string;
          mime_type?: string;
          file_size_bytes?: number;
          caption?: string;
          visibility_scope?: RecordVisibilityScope;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evidence_files_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "evidence_files_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "portfolio_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_files_credential_id_fkey";
            columns: ["credential_id"];
            isOneToOne: false;
            referencedRelation: "profile_credentials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_files_education_id_fkey";
            columns: ["education_id"];
            isOneToOne: false;
            referencedRelation: "profile_educations";
            referencedColumns: ["id"];
          },
        ];
      };
      verification_records: {
        Row: {
          id: string;
          subject_user_id: string;
          target_type: "credential" | "profile_skill" | "project";
          target_id: string;
          verification_method: string;
          resulting_status: string;
          reviewer_user_id: string | null;
          notes: string;
          verified_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_user_id: string;
          target_type: "credential" | "profile_skill" | "project";
          target_id: string;
          verification_method: string;
          resulting_status: string;
          reviewer_user_id?: string | null;
          notes?: string;
          verified_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_user_id?: string;
          target_type?: "credential" | "profile_skill" | "project";
          target_id?: string;
          verification_method?: string;
          resulting_status?: string;
          reviewer_user_id?: string | null;
          notes?: string;
          verified_at?: string;
          created_at?: string;
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
      is_profile_public: {
        Args: { p_user_id: string };
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
