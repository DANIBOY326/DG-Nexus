import crypto from "node:crypto";
import type { EvidenceEntityType } from "@/lib/supabase/database.types";
import {
  ALLOWED_AVATAR_MIME_TYPES,
  ALLOWED_EVIDENCE_MIME_TYPES,
  MAX_AVATAR_BYTES,
  MAX_IMAGE_EVIDENCE_BYTES,
  MAX_PDF_EVIDENCE_BYTES,
} from "@/modules/portfolio/constants";

export type AllowedEvidenceMime = (typeof ALLOWED_EVIDENCE_MIME_TYPES)[number];

export interface EvidenceFileValidationResult {
  ok: true;
  detectedMime: AllowedEvidenceMime;
  extension: "jpg" | "png" | "webp" | "pdf";
  sanitisedFileName: string;
}

export interface EvidenceFileValidationError {
  ok: false;
  error: string;
}

/**
 * Inspects actual leading binary magic bytes so spoofed file extensions
 * (e.g., an executable, HTML, or SVG renamed to `.png` or `.pdf`) are rejected server-side.
 */
export function detectAllowedFileSignature(bytes: Uint8Array): AllowedEvidenceMime | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  // PDF: %PDF- (25 50 44 46 2D)
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return "application/pdf";
  }

  return null;
}

const MIME_TO_EXT: Record<AllowedEvidenceMime, "jpg" | "png" | "webp" | "pdf"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function sanitiseDisplayFileName(rawName: string): string {
  const base = rawName.split(/[\\/]/).pop() ?? "evidence-file";
  const cleaned = base
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned || "evidence-file";
}

export function validateEvidenceUpload(input: {
  entityType: EvidenceEntityType;
  claimedMimeType: string;
  fileName: string;
  byteLength: number;
  headerBytes: Uint8Array;
}): EvidenceFileValidationResult | EvidenceFileValidationError {
  if (input.byteLength <= 0) {
    return { ok: false, error: "File is empty." };
  }

  const detectedMime = detectAllowedFileSignature(input.headerBytes);
  if (!detectedMime) {
    return {
      ok: false,
      error:
        "Unsupported or invalid file content. Only genuine JPEG, PNG, WebP images and PDF documents are permitted.",
    };
  }

  if (input.entityType === "avatar") {
    if (!(ALLOWED_AVATAR_MIME_TYPES as readonly string[]).includes(detectedMime)) {
      return {
        ok: false,
        error: "Profile photographs must be JPEG, PNG, or WebP images.",
      };
    }
    if (input.byteLength > MAX_AVATAR_BYTES) {
      return { ok: false, error: "Profile photograph must be 2 MB or smaller." };
    }
  } else {
    if (!(ALLOWED_EVIDENCE_MIME_TYPES as readonly string[]).includes(detectedMime)) {
      return {
        ok: false,
        error: "Only JPEG, PNG, WebP images and PDF documents are allowed.",
      };
    }
    const maxBytes =
      detectedMime === "application/pdf" ? MAX_PDF_EVIDENCE_BYTES : MAX_IMAGE_EVIDENCE_BYTES;
    if (input.byteLength > maxBytes) {
      const mb = Math.round(maxBytes / (1024 * 1024));
      return {
        ok: false,
        error: `File exceeds the ${mb} MB limit for ${detectedMime === "application/pdf" ? "PDF documents" : "images"}.`,
      };
    }
  }

  // Reject clear MIME spoofing (e.g. client claims text/html or image/svg+xml)
  const claimed = input.claimedMimeType.trim().toLowerCase();
  if (claimed && claimed !== "application/octet-stream" && claimed !== detectedMime) {
    // Allow image/jpg alias for image/jpeg
    const isJpegAlias = claimed === "image/jpg" && detectedMime === "image/jpeg";
    if (!isJpegAlias) {
      return {
        ok: false,
        error: "File content does not match its declared MIME type.",
      };
    }
  }

  return {
    ok: true,
    detectedMime,
    extension: MIME_TO_EXT[detectedMime],
    sanitisedFileName: sanitiseDisplayFileName(input.fileName),
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Generates an opaque, traversal-proof Storage key strictly scoped under `{userId}/...`.
 * User-supplied filenames are NEVER interpolated into storage paths.
 */
export function buildSafeEvidenceStoragePath(input: {
  userId: string;
  entityType: EvidenceEntityType;
  parentId?: string | null;
  extension: "jpg" | "png" | "webp" | "pdf";
}): string {
  if (!UUID_REGEX.test(input.userId)) {
    throw new Error("Invalid user identifier for storage path.");
  }
  if (input.parentId && !UUID_REGEX.test(input.parentId)) {
    throw new Error("Invalid parent entity identifier for storage path.");
  }
  const fileUuid = crypto.randomUUID();
  const folder = input.parentId ? `${input.entityType}/${input.parentId}` : input.entityType;
  return `${input.userId}/${folder}/${fileUuid}.${input.extension}`;
}
