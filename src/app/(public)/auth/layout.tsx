import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2 bg-canvas">
      {/* Desktop Brand Value Panel (hidden on mobile to preserve Screen 3-5 clean simplicity) */}
      <aside
        className="hidden lg:flex flex-col justify-between p-12 text-white"
        style={{ background: "var(--color-brand-gradient)" }}
      >
        <Link href="/" className="inline-flex items-center gap-2.5 text-white">
          <BrandMark size={36} showWordmark={false} />
          <span className="text-lg font-bold tracking-tight">DG NEXUS</span>
        </Link>

        <div className="max-w-md space-y-6">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Where Ideas Meet Impact.
          </h1>
          <p className="text-sm text-blue-100 leading-relaxed">
            One connected professional operating environment uniting verified global
            opportunities, proof-of-work competency profiles, and explainable Nexus AI.
          </p>
          <ul className="space-y-3 text-sm text-blue-50">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <span>Curated global &amp; regional opportunities with clear eligibility</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <span>Granular privacy controls aligned with GDPR &amp; NDPA</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <span>Permission-scoped AI that never makes autonomous rejections</span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-blue-200">
          DG NEXUS · by DGConcept · Connecting People. Creating Possibilities.
        </p>
      </aside>

      {/* Responsive Form Column */}
      <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="mb-6 lg:hidden">
          <Link href="/">
            <BrandMark size={34} showWordmark />
          </Link>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
