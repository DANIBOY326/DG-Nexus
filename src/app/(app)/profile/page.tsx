import { redirect } from "next/navigation";
import { ProfileWorkspace } from "@/components/profile/profile-workspace";
import { listCanonicalSkills } from "@/modules/graph/skills-repo";
import { requireUser } from "@/modules/identity/guards";
import {
  getMemberPortfolioBundle,
  listProjectCategories,
} from "@/modules/portfolio/repo";

export default async function ProfilePage() {
  const user = await requireUser("/profile");

  const [bundle, categories, skillCatalogue] = await Promise.all([
    getMemberPortfolioBundle(user.id),
    listProjectCategories(),
    listCanonicalSkills(),
  ]);

  if (!bundle) {
    redirect("/onboarding");
  }

  return (
    <ProfileWorkspace
      bundle={bundle}
      categories={categories}
      skillCatalogue={skillCatalogue}
    />
  );
}
