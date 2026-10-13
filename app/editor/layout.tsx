import { redirect } from "next/navigation";
import { serverUserForGuard } from "@/lib/authServer";
import { canAuthor } from "@/lib/permissions";
import { roleHomeFor } from "@/lib/roleHome";

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const user = await serverUserForGuard();
  if (!user) redirect("/projects?auth=required");
  if (!canAuthor(user.accessRole)) redirect(roleHomeFor(user.accessRole));
  return children;
}
