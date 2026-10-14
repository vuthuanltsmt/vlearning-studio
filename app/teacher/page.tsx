import Link from "next/link";
import { redirect } from "next/navigation";
import { serverUserForGuard } from "@/lib/authServer";
import { canAuthor } from "@/lib/permissions";
import { roleHomeFor } from "@/lib/roleHome";

export default async function TeacherPage() {
  const user = await serverUserForGuard();
  if (!user) redirect("/projects?auth=required");
  if (!canAuthor(user.accessRole)) redirect(roleHomeFor(user.accessRole));

  const cards = [
    {
      href: "/teacher/publish",
      title: "Xuất bản bài giảng",
      text: "Chọn dự án Cloud để phát hành hoặc thu hồi khỏi cổng học viên.",
    },
    { href: "/projects", title: "Dự án của tôi", text: "Tạo, mở, sao lưu và đồng bộ bài giảng với Cloud." },
    { href: "/editor/demo", title: "Trình biên soạn", text: "Thiết kế trang học, video và câu hỏi tương tác." },
    { href: "/preview/demo", title: "Xem trước bài học", text: "Kiểm tra trải nghiệm học viên trước khi phát hành." },
    { href: "/learn", title: "Cổng học viên", text: "Xem hệ thống dưới góc nhìn người học." },
  ];

  return (
    <main className="min-h-screen bg-[#06182b] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[28px] border border-blue-700/40 bg-gradient-to-br from-[#103b68] via-[#153b6c] to-[#1d3264] p-7 shadow-2xl sm:p-10">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">VLearning Studio • Cổng giáo viên</div>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Không gian giảng dạy của {user.displayName}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">Thiết kế bài giảng tương tác, quản lý dự án, kiểm tra bản học viên và đồng bộ dữ liệu Cloud.</p>
          <div className="mt-5 inline-flex rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-300">
            {user.accessRole === "ADMIN" ? "ADMIN • Có quyền giáo viên" : "TEACHER"}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-6 transition hover:-translate-y-0.5 hover:border-cyan-500/50">
              <h2 className="text-xl font-black text-cyan-200">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{card.text}</p>
              <div className="mt-5 text-sm font-black text-blue-300">Mở →</div>
            </Link>
          ))}
        </section>

        {user.accessRole === "ADMIN" && (
          <div className="mt-6">
            <Link href="/admin" className="inline-flex rounded-xl border border-amber-400/30 bg-amber-500/10 px-5 py-3 text-sm font-black text-amber-200">← Quay lại cổng quản trị</Link>
          </div>
        )}
      </div>
    </main>
  );
}
