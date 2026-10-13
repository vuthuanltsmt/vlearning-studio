import Link from "next/link";
import { redirect } from "next/navigation";
import { serverUserForGuard } from "@/lib/authServer";

export default async function LearnPage() {
  const user = await serverUserForGuard();
  if (!user) redirect("/projects?auth=required");

  return (
    <main className="min-h-screen bg-[#06182b] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[28px] border border-blue-700/40 bg-gradient-to-br from-[#153b6c] via-[#173b78] to-[#25296c] p-7 shadow-2xl sm:p-10">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">VLearning Studio • Cổng học viên</div>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Chào {user.displayName}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">Đây là không gian học tập. Học viên chỉ xem và thực hiện nội dung được phát hành; không có quyền tạo hoặc chỉnh sửa bài giảng.</p>
          <div className="mt-5 inline-flex rounded-full bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-200">Quyền hiện tại: {user.accessRole}</div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <Link href="/preview/demo" className="rounded-[22px] border border-purple-500/30 bg-[#0c2b50] p-7 transition hover:-translate-y-0.5 hover:border-purple-400/60">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-purple-300">Bài học đang có</div>
            <h2 className="mt-3 text-2xl font-black">Bài giảng tương tác đầu tiên</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Mở bài học mẫu hiện tại và thực hiện các hoạt động tương tác.</p>
            <div className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-black">Bắt đầu học →</div>
          </Link>

          <div className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-7">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">Tài khoản</div>
            <h2 className="mt-3 text-xl font-black">Hồ sơ học tập</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Quản lý thông tin cá nhân và phiên đăng nhập trong khu vực tài khoản.</p>
            <Link href="/projects" className="mt-6 inline-flex rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-5 py-3 text-sm font-black text-cyan-100">Mở tài khoản</Link>
          </div>
        </section>

        {user.accessRole !== "LEARNER" && (
          <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">
            Bạn đang xem cổng học viên bằng tài khoản {user.accessRole}.{" "}
            <Link className="font-black underline" href={user.accessRole === "ADMIN" ? "/admin" : "/teacher"}>Quay lại cổng chính</Link>
          </div>
        )}
      </div>
    </main>
  );
}
