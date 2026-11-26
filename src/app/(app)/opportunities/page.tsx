import { OpportunitiesWorkspace } from "@/components/opportunities/opportunities-workspace";
import { requireUser } from "@/modules/identity/guards";
import { getOpportunityWorkspaceBundle } from "@/modules/opportunities/repo";

export default async function OpportunitiesPage() {
  const user = await requireUser("/opportunities");
  const bundle = await getOpportunityWorkspaceBundle(user.id);

  return <OpportunitiesWorkspace bundle={bundle} />;
}
