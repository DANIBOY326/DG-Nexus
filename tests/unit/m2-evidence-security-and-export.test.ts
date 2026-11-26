import { describe, expect, it } from "vitest";
import {
  buildSafeEvidenceStoragePath,
  detectAllowedFileSignature,
  sanitiseDisplayFileName,
  validateEvidenceUpload,
} from "@/modules/portfolio/evidence-security";
import { buildPersonalDataExportPayload } from "@/modules/profiles/export";

const USER_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const PROJECT_UUID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const PNG_HEADER = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);
const JPEG_HEADER = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);
const PDF_HEADER = new Uint8Array([
  0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, 0x25, 0xe2, 0xe3,
]);
const FAKE_HTML_HEADER = new TextEncoder().encode("<html><script>alert(1)</script></html>");
const FAKE_SVG_HEADER = new TextEncoder().encode("<svg onload=alert(1)></svg>");

describe("M2.5–M2.7 evidence file magic-byte security, path safety & M2 JSON export", () => {
  it("validates genuine magic bytes and rejects spoofed HTML/SVG/executable payloads", () => {
    expect(detectAllowedFileSignature(PNG_HEADER)).toBe("image/png");
    expect(detectAllowedFileSignature(JPEG_HEADER)).toBe("image/jpeg");
    expect(detectAllowedFileSignature(PDF_HEADER)).toBe("application/pdf");
    expect(detectAllowedFileSignature(FAKE_HTML_HEADER)).toBeNull();
    expect(detectAllowedFileSignature(FAKE_SVG_HEADER)).toBeNull();

    const spoofed = validateEvidenceUpload({
      entityType: "project",
      claimedMimeType: "image/png",
      fileName: "malware.png",
      byteLength: 512,
      headerBytes: FAKE_HTML_HEADER,
    });
    expect(spoofed.ok).toBe(false);

    const mimeMismatch = validateEvidenceUpload({
      entityType: "project",
      claimedMimeType: "text/html",
      fileName: "preview.png",
      byteLength: 1024,
      headerBytes: PNG_HEADER,
    });
    expect(mimeMismatch.ok).toBe(false);

    const pdfAsAvatar = validateEvidenceUpload({
      entityType: "avatar",
      claimedMimeType: "application/pdf",
      fileName: "avatar.pdf",
      byteLength: 1024,
      headerBytes: PDF_HEADER,
    });
    expect(pdfAsAvatar.ok).toBe(false);

    const oversizedImage = validateEvidenceUpload({
      entityType: "project",
      claimedMimeType: "image/jpeg",
      fileName: "huge.jpg",
      byteLength: 6 * 1024 * 1024,
      headerBytes: JPEG_HEADER,
    });
    expect(oversizedImage.ok).toBe(false);

    const validPdf = validateEvidenceUpload({
      entityType: "credential",
      claimedMimeType: "application/pdf",
      fileName: "../../evil/certificate.pdf",
      byteLength: 2048,
      headerBytes: PDF_HEADER,
    });
    expect(validPdf.ok).toBe(true);
    if (validPdf.ok) {
      expect(validPdf.detectedMime).toBe("application/pdf");
      expect(validPdf.sanitisedFileName).toBe("certificate.pdf");
    }
  });

  it("generates opaque traversal-proof storage paths strictly scoped to the owner UUID", () => {
    const path = buildSafeEvidenceStoragePath({
      userId: USER_UUID,
      entityType: "project",
      parentId: PROJECT_UUID,
      extension: "png",
    });
    expect(path.startsWith(`${USER_UUID}/project/${PROJECT_UUID}/`)).toBe(true);
    expect(path.endsWith(".png")).toBe(true);
    expect(path.includes("..")).toBe(false);

    expect(() =>
      buildSafeEvidenceStoragePath({
        userId: "../other-user",
        entityType: "avatar",
        extension: "jpg",
      })
    ).toThrow();

    expect(sanitiseDisplayFileName("../../etc/passwd")).toBe("passwd");
  });

  it("includes M2 portfolio, experience, education, credentials and evidence metadata in JSON export without leaking storage paths", () => {
    const payload = buildPersonalDataExportPayload({
      account: {
        userId: USER_UUID,
        email: "daniel@example.com",
        authProvider: "google",
        emailConfirmedAt: "2026-11-26T09:00:00Z",
        accountCreatedAt: "2026-11-26T09:00:00Z",
      },
      profile: {
        user_id: USER_UUID,
        handle: "daniel-ojo",
        full_name: "Daniel Ojo",
        headline: "Product Designer",
        bio: "Designing resilient civic tools.",
        current_focus: "Design Systems",
        work_arrangement: "remote",
        achievements: ["Launched DG NEXUS design system"],
        contact_links: [{ kind: "github", label: "GitHub", url: "https://github.com/example" }],
        allow_search_indexing: false,
        avatar_url: null,
        country_code: "NG",
        city: "Lokoja",
        timezone: "Africa/Lagos",
        interests: ["design"],
        career_goals: ["build-portfolio"],
        career_goal: "Build proof-of-work portfolio",
        availability_status: "actively_looking",
        visibility_scope: "public",
        ai_context_consent: false,
        profile_completion_score: 80,
        onboarding_step: 4,
        onboarding_completed_at: "2026-11-26T09:10:00Z",
        created_at: "2026-11-26T09:00:00Z",
        updated_at: "2026-11-26T09:20:00Z",
      },
      skills: [],
      experiences: [
        {
          id: "exp-1",
          user_id: USER_UUID,
          organisation_name: "DGConcept",
          role_title: "Lead Designer",
          employment_type: "full_time",
          location: "Lagos",
          work_arrangement: "hybrid",
          start_date: "2024-01-01",
          end_date: null,
          is_current: true,
          description: "Design leadership",
          responsibilities: ["Design tokens"],
          achievements: ["Zero WCAG AA contrast regressions"],
          display_order: 0,
          visibility_scope: "public",
          created_at: "2026-11-26T09:00:00Z",
          updated_at: "2026-11-26T09:00:00Z",
          skills: [{ skillId: "s-1", slug: "figma", name: "Figma", category: "Design" }],
        },
      ],
      portfolioProjects: [
        {
          id: PROJECT_UUID,
          user_id: USER_UUID,
          slug: "flood-monitoring-web-app",
          title: "Flood Monitoring Web Application",
          summary: "Real-time flood monitoring platform.",
          description: "Full case study.",
          category_slug: "software-development",
          categoryName: "Software Development",
          project_type: "collaborative",
          project_status: "completed",
          start_date: "2025-01-01",
          completion_date: "2025-06-01",
          associated_organisation: "Civic Lab",
          is_collaborative: true,
          member_role: "Lead UI/UX Designer",
          member_contribution: "Designed all mobile alert flows.",
          team_members: ["Ada Nwosu"],
          outcomes: ["Faster community flood warnings"],
          achievements: ["Best Civic Tech Award"],
          tools_used: ["Figma", "React"],
          project_url: "https://example.com",
          repository_url: null,
          visibility_scope: "public",
          display_order: 0,
          created_at: "2026-11-26T09:00:00Z",
          updated_at: "2026-11-26T09:00:00Z",
          skills: [{ skillId: "s-1", slug: "figma", name: "Figma", category: "Design" }],
          evidenceFiles: [],
        },
      ],
      evidenceFiles: [
        {
          id: "ev-1",
          user_id: USER_UUID,
          entity_type: "project",
          project_id: PROJECT_UUID,
          credential_id: null,
          education_id: null,
          storage_bucket: "portfolio-evidence",
          storage_path: `${USER_UUID}/project/${PROJECT_UUID}/secret-uuid.pdf`,
          file_name: "case-study.pdf",
          mime_type: "application/pdf",
          file_size_bytes: 120000,
          caption: "Final case study",
          visibility_scope: "private",
          created_at: "2026-11-26T09:00:00Z",
          updated_at: "2026-11-26T09:00:00Z",
        },
      ],
      organisations: [],
      consentLogs: [],
    });

    expect(payload.export_metadata.schema_version).toBe("2.0.0-m2");
    expect(payload.experiences).toHaveLength(1);
    expect(payload.portfolio_projects[0]?.linked_skills).toEqual(["Figma"]);
    expect(payload.evidence_files[0]?.file_name).toBe("case-study.pdf");
    // Ensure internal storage_path is never leaked in JSON export
    expect(JSON.stringify(payload)).not.toContain("secret-uuid.pdf");
    expect(
      payload.unavailable_categories.some(
        (c) => c.category === "evidence_binary_file_contents"
      )
    ).toBe(true);
  });
});
