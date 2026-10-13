import { redirect } from "next/navigation";
import AdminPortalShell from "@/components/admin/AdminPortalShell";
import { serverUserForGuard } from "@/lib/authServer";
import { roleHomeFor } from "@/lib/roleHome";

export default async function AdminPage() {
  const user = await serverUserForGuard();
  if (!user) redirect("/projects?auth=required");
  if (user.accessRole !== "ADMIN") redirect(roleHomeFor(user.accessRole));

  return (
    <AdminPortalShell
      user={{ id: user.id, displayName: user.displayName, email: user.email }}
    />
  );
}
