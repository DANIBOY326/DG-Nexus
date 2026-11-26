import { CheckCircle2, Circle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProfileCompletenessReport } from "@/modules/portfolio/completeness";

interface CompletenessCardProps {
  report: ProfileCompletenessReport;
  compact?: boolean;
}

export function CompletenessCard({ report, compact = false }: CompletenessCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">Profile Completeness</CardTitle>
          <Badge
            variant={report.score >= 80 ? "verified" : "primary"}
            className="tabular-nums"
          >
            {report.score}% · {report.completedCount}/{report.totalSections}
          </Badge>
        </div>
        <CardDescription>
          Transparent checklist of documented profile sections.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-subtle"
          role="progressbar"
          aria-valuenow={report.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Profile completeness percentage"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300"
            style={{ width: `${report.score}%` }}
          />
        </div>

        <ul className="space-y-2">
          {report.sections.map((section) => (
            <li key={section.key} className="flex items-start gap-2 text-xs">
              {section.completed ? (
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-success"
                  aria-hidden="true"
                />
              ) : (
                <Circle
                  className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={
                      section.completed
                        ? "font-medium text-ink"
                        : "font-medium text-ink-secondary"
                    }
                  >
                    {section.label}
                  </span>
                  <span className="text-[11px] text-ink-muted tabular-nums">
                    {section.weight}%
                  </span>
                </div>
                {!section.completed && !compact && (
                  <p className="mt-0.5 text-[11px] text-ink-muted">{section.hint}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-start gap-2 rounded-lg bg-subtle/80 p-2.5 text-[11px] text-ink-secondary">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
          <p>{report.disclaimer}</p>
        </div>
      </CardContent>
    </Card>
  );
}
