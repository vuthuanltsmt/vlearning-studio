import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { db } from "@/lib/db";
import { serverUserForGuard } from "@/lib/authServer";

type SnapshotInfo = { pageCount: number; questionCount: number; pageTitles: string[] };

function inspectSnapshot(snapshotJson: string): SnapshotInfo {
  try {
    const root = JSON.parse(snapshotJson);
    const pages = Array.isArray(root?.pages) ? root.pages : Array.isArray(root?.project?.pages) ? root.project.pages : Array.isArray(root?.data?.pages) ? root.data.pages : [];
    const pageTitles = pages.map((page: any, index: number) => String(page?.title || page?.name || `Trang ${index + 1}`));
    const questionCount = pages.reduce((total: number, page: any) => {
      const candidates = [page?.questions, page?.quizzes, page?.quiz];
      return total + candidates.reduce((sum: number, value: any) => sum + (Array.isArray(value) ? value.length : 0), 0);
    }, 0);
    return { pageCount: pages.length, questionCount, pageTitles };
  } catch {
    return { pageCount: 0, questionCount: 0, pageTitles: [] };
  }
}

export default async function PublishedLessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await serverUserForGuard();
  if (!user) redirect("/projects?auth=required");
  const { slug } = await params;

  const project = await db.cloudProject.findFirst({
    where: { publicSlug: slug, isPublished: true },
  });
  if (!project) notFound();

  const info = inspectSnapshot(project.snapshotJson);

  return (
    <main className="min-h-screen bg-[#06182b] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/learn" className="text-sm font-black text-cyan-300">← Danh sách bài học</Link>
        <section className="mt-4 rounded-[28px] border border-blue-700/40 bg-gradient-to-br from-[#103b68] via-[#153b6c] to-[#25296c] p-7 shadow-2xl sm:p-10">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">Bài học đã xuất bản</div>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">{project.title}</h1>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-black/15 p-4"><div className="text-xs text-slate-400">Nội dung</div><div className="mt-1 text-2xl font-black">{info.pageCount}</div></div>
            <div className="rounded-xl bg-black/15 p-4"><div className="text-xs text-slate-400">Câu hỏi</div><div className="mt-1 text-2xl font-black">{info.questionCount}</div></div>
            <div className="rounded-xl bg-black/15 p-4"><div className="text-xs text-slate-400">Trạng thái</div><div className="mt-1 text-sm font-black text-emerald-300">ĐANG PHÁT HÀNH</div></div>
          </div>
        </section>

        <section className="mt-6 rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-7">
          <h2 className="text-xl font-black">Cấu trúc bài học</h2>
          {info.pageTitles.length > 0 ? (
            <ol className="mt-5 space-y-3">
              {info.pageTitles.map((title, index) => (
                <li key={`${index}-${title}`} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-black">{index + 1}</span>
                  <span className="font-bold">{title}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-slate-400">Snapshot bài giảng đã có trên Cloud. Bước tiếp theo sẽ nối snapshot này trực tiếp với Player.</p>
          )}
          <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm leading-6 text-cyan-100">Đã hoàn tất luồng Xuất bản → Cổng học viên. Bước kế tiếp là Player Cloud.</div>
        </section>
      </div>
    </main>
  );
}
