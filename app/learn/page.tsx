import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { serverUserForGuard } from "@/lib/authServer";

export default async function LearnPage() {
  const user = await serverUserForGuard();
  if (!user) redirect("/projects?auth=required");

  const lessons = await db.cloudProject.findMany({
    where: { isPublished: true, publicSlug: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, publicSlug: true, publishedAt: true, updatedAt: true },
  });

  return (
    <main className="min-h-screen bg-[#06182b] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[28px] border border-blue-700/40 bg-gradient-to-br from-[#153b6c] via-[#173b78] to-[#25296c] p-7 shadow-2xl sm:p-10">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">VLearning Studio • Cổng học viên</div>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Xin chào {user.displayName}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">Chọn bài giảng đã được giáo viên xuất bản để bắt đầu học.</p>
          <div className="mt-5 inline-flex rounded-full bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-200">{lessons.length} bài đang phát hành</div>
        </section>

        {lessons.length === 0 ? (
          <section className="mt-6 rounded-[24px] border border-blue-800/70 bg-[#0c2b50] p-10 text-center">
            <div className="text-5xl">📚</div>
            <h2 className="mt-4 text-2xl font-black">Chưa có bài học được xuất bản</h2>
            <p className="mt-3 text-sm text-slate-400">Khi giáo viên phát hành bài giảng, bài sẽ tự xuất hiện tại đây.</p>
          </section>
        ) : (
          <section className="mt-6 grid gap-4 md:grid-cols-2">
            {lessons.map((lesson) => (
              <Link key={lesson.id} href={`/learn/${lesson.publicSlug}`} className="rounded-[22px] border border-purple-500/20 bg-[#0c2b50] p-7 transition hover:-translate-y-0.5 hover:border-purple-400/60">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-purple-300">Bài giảng đã xuất bản</div>
                <h2 className="mt-3 text-2xl font-black">{lesson.title}</h2>
                <p className="mt-3 text-sm text-slate-400">Phát hành: {lesson.publishedAt ? lesson.publishedAt.toLocaleString("vi-VN") : "Đang cập nhật"}</p>
                <div className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-black">Vào bài học →</div>
              </Link>
            ))}
          </section>
        )}

        {user.accessRole !== "LEARNER" && (
          <div className="mt-6 text-sm text-slate-400">
            Bạn đang xem cổng học viên bằng tài khoản {user.accessRole}.{" "}
            <Link className="font-black text-cyan-300 underline" href={user.accessRole === "ADMIN" ? "/admin" : "/teacher"}>Quay lại cổng chính</Link>
          </div>
        )}
      </div>
    </main>
  );
}
