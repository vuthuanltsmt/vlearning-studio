import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { serverUserForGuard } from "@/lib/authServer";
import { canAuthor } from "@/lib/permissions";
import { roleHomeFor } from "@/lib/roleHome";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function requireAuthor() {
  const user = await serverUserForGuard();
  if (!user) redirect("/projects?auth=required");
  if (!canAuthor(user.accessRole)) redirect(roleHomeFor(user.accessRole));
  return user;
}

async function publishProject(formData: FormData) {
  "use server";
  const user = await requireAuthor();
  const id = String(formData.get("id") || "");

  const project = await db.cloudProject.findFirst({
    where: { id, ownerUserId: user.id },
  });
  if (!project) return;

  const base = slugify(project.title) || "bai-hoc";
  const suffix = project.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toLowerCase();
  const publicSlug = project.publicSlug || `${base}-${suffix}`;

  await db.cloudProject.update({
    where: { id: project.id },
    data: {
      isPublished: true,
      publicSlug,
      publishedAt: new Date(),
    },
  });

  revalidatePath("/teacher/publish");
  revalidatePath("/learn");
  revalidatePath(`/learn/${publicSlug}`);
}

async function unpublishProject(formData: FormData) {
  "use server";
  const user = await requireAuthor();
  const id = String(formData.get("id") || "");

  const project = await db.cloudProject.findFirst({
    where: { id, ownerUserId: user.id },
  });
  if (!project) return;

  await db.cloudProject.update({
    where: { id: project.id },
    data: { isPublished: false, publishedAt: null },
  });

  revalidatePath("/teacher/publish");
  revalidatePath("/learn");
  if (project.publicSlug) revalidatePath(`/learn/${project.publicSlug}`);
}

export default async function TeacherPublishPage() {
  const user = await requireAuthor();
  const projects = await db.cloudProject.findMany({
    where: { ownerUserId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-[#06182b] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
              VLearning Studio • Giáo viên
            </div>
            <h1 className="mt-2 text-3xl font-black">Xuất bản bài giảng</h1>
            <p className="mt-2 text-sm text-slate-400">Chỉ bài đã đẩy lên Cloud mới xuất hiện tại đây.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/projects" className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black">Dự án của tôi</Link>
            <Link href="/teacher" className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-100">Cổng giáo viên</Link>
          </div>
        </div>

        {projects.length === 0 ? (
          <section className="rounded-[24px] border border-blue-800/70 bg-[#0c2b50] p-8 text-center">
            <h2 className="text-2xl font-black">Chưa có dự án Cloud</h2>
            <p className="mt-3 text-sm text-slate-400">Vào “Dự án của tôi”, tạo hoặc mở bài giảng rồi dùng chức năng ĐẨY LÊN CLOUD.</p>
            <Link href="/projects" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-black">Đi tới Dự án của tôi</Link>
          </section>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <article key={project.id} className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black">{project.title}</h2>
                      <span className={project.isPublished ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300" : "rounded-full bg-slate-500/10 px-3 py-1 text-xs font-black text-slate-400"}>
                        {project.isPublished ? "ĐÃ XUẤT BẢN" : "BẢN NHÁP"}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">Cập nhật: {project.updatedAt.toLocaleString("vi-VN")}</div>
                    {project.isPublished && project.publicSlug && (
                      <Link href={`/learn/${project.publicSlug}`} className="mt-3 inline-flex text-sm font-black text-cyan-300 underline">Xem bài trên cổng học viên →</Link>
                    )}
                  </div>

                  <form action={project.isPublished ? unpublishProject : publishProject}>
                    <input type="hidden" name="id" value={project.id} />
                    <button type="submit" className={project.isPublished ? "rounded-xl border border-rose-400/30 bg-rose-500/10 px-5 py-3 text-sm font-black text-rose-200" : "rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-black"}>
                      {project.isPublished ? "Hủy xuất bản" : "Xuất bản cho học viên"}
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
