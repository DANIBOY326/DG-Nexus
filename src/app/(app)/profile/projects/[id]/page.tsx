import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  GitBranch,
  Globe,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EvidenceUploader } from "@/components/profile/evidence-uploader";
import { requireUser } from "@/modules/identity/guards";
import { PROJECT_TYPE_OPTIONS } from "@/modules/portfolio/constants";
import { getMemberProjectById } from "@/modules/portfolio/repo";

export default async function ProjectDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("/profile");
  const { id } = await props.params;

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    notFound();
  }

  const project = await getMemberProjectById(user.id, id);
  if (!project) {
    notFound();
  }

  const typeLabel =
    PROJECT_TYPE_OPTIONS.find((t) => t.value === project.project_type)?.label ??
    project.project_type;
  const imageFiles = project.evidenceFiles.filter((f) =>
    f.mime_type.startsWith("image/")
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/profile">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Profile &amp; Portfolio
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {project.project_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4" aria-hidden="true" />
                Live Demo
              </a>
            </Button>
          )}
          {project.repository_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.repository_url} target="_blank" rel="noopener noreferrer">
                <GitBranch className="h-4 w-4" aria-hidden="true" />
                Repository
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Case Study Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">{project.categoryName}</Badge>
            <Badge variant="default">{typeLabel}</Badge>
            <Badge variant="default" className="capitalize">
              {project.project_status.replace("_", " ")}
            </Badge>
            <Badge variant="default" className="capitalize">
              Visibility: {project.visibility_scope}
            </Badge>
          </div>
          <CardTitle className="mt-2 text-2xl">{project.title}</CardTitle>
          <CardDescription className="text-sm text-ink-secondary">
            {project.summary}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border-base bg-canvas/60 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Your Role
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">{project.member_role}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Timeline
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-secondary">
                <Calendar className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
                {project.start_date || "Start N/A"} —{" "}
                {project.completion_date || "Ongoing"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Collaboration
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-secondary">
                <Users className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
                {project.is_collaborative ? "Collaborative team project" : "Individual project"}
              </p>
            </div>
          </div>

          {project.associated_organisation && (
            <p className="text-sm text-ink-secondary">
              <strong className="text-ink">Associated organisation / client:</strong>{" "}
              {project.associated_organisation}
            </p>
          )}

          {project.member_contribution && (
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-ink">Specific Contribution &amp; Attribution</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-secondary">
                {project.member_contribution}
              </p>
            </div>
          )}

          {project.team_members.length > 0 && (
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-ink">Collaborators</h2>
              <div className="flex flex-wrap gap-1.5">
                {project.team_members.map((member, idx) => (
                  <Badge key={idx} variant="default">
                    {member}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {project.description && (
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-ink">Case Study &amp; Approach</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-secondary">
                {project.description}
              </p>
            </div>
          )}

          {project.outcomes.length > 0 && (
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-ink">Project Outcomes</h2>
              <ul className="space-y-1.5 text-sm text-ink-secondary">
                {project.outcomes.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {project.achievements.length > 0 && (
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-ink">Key Achievements</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink-secondary">
                {project.achievements.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-border-base bg-canvas/50 p-4">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-brand" aria-hidden="true" />
                <h2 className="text-sm font-bold text-ink">
                  Linked Canonical Skills ({project.skills.length})
                </h2>
              </div>
              <p className="text-xs text-ink-muted">
                These skills are marked <strong>Portfolio-Supported (Level 2)</strong> on your profile.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {project.skills.length > 0 ? (
                  project.skills.map((skill) => (
                    <Badge key={skill.skillId} variant="primary">
                      {skill.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-ink-muted">No skills linked yet.</span>
                )}
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border-base bg-canvas/50 p-4">
              <div className="flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                <h2 className="text-sm font-bold text-ink">Tools &amp; Technologies</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {project.tools_used.length > 0 ? (
                  project.tools_used.map((tool, idx) => (
                    <Badge key={idx} variant="default">
                      {tool}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-ink-muted">No tools specified.</span>
                )}
              </div>
            </div>
          </div>

          {imageFiles.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-ink">Visual Evidence Gallery</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {imageFiles.map((file) => (
                  <figure
                    key={file.id}
                    className="overflow-hidden rounded-xl border border-border-base bg-surface"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/evidence/${file.id}/url`}
                      alt={file.caption || file.file_name}
                      className="h-52 w-full object-cover"
                    />
                    <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-ink-secondary">
                      <span className="truncate">{file.caption || file.file_name}</span>
                      <Badge variant="default" className="capitalize">
                        {file.visibility_scope}
                      </Badge>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          <EvidenceUploader
            entityType="project"
            parentId={project.id}
            files={project.evidenceFiles}
            title="Manage Project Evidence Files"
            defaultVisibility="private"
          />
        </CardContent>
      </Card>
    </div>
  );
}
