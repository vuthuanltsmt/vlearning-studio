import { redirect } from "next/navigation";
import { serverUserForGuard } from "@/lib/authServer";
import { roleHomeFor } from "@/lib/roleHome";

export default async function PortalPage() {
  const user = await serverUserForGuard();
  if (!user) redirect("/projects?auth=required");
  redirect(roleHomeFor(user.accessRole));
}
