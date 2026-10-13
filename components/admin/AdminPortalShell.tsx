"use client";

import Link from "next/link";
import AdminUsersPanel from "@/components/admin/UserAdminPanel";

type AdminPortalShellProps = {
  user: {
    id: string;
    displayName: string;
    email: string;
  };
};

export default function AdminPortalShell({ user }: AdminPortalShellProps) {
  return (
    <main className="min-h-screen bg-[#06182b] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <section className="rounded-[28px] border border-blue-700/40 bg-gradient-to-r from-[#103b68] via-[#153b6c] to-[#1d3264] p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
                VLearning Studio • Cổng quản trị
              </div>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Xin chào {user.displayName}
              </h1>
              <p className="mt-3 text-sm text-slate-300">
                {user.email} • Quyền hệ thống: ADMIN
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/teacher" className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-100">
                Không gian giáo viên
              </Link>
              <Link href="/projects" className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
                Quản lý bài giảng
              </Link>
              <Link href="/learn" className="rounded-xl border border-purple-400/30 bg-purple-500/10 px-4 py-3 text-sm font-black text-purple-100">
                Xem cổng học viên
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <AdminUsersPanel onOpenMenu={() => {}} currentUserId={user.id} />
        </div>
      </div>
    </main>
  );
}
