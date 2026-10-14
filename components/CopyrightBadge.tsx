import Link from "next/link";

export default function CopyrightBadge() {
  return (
    <div className="fixed bottom-3 right-3 z-[9999] max-w-[290px] rounded-2xl border border-cyan-400/20 bg-[#06182b]/90 px-4 py-3 text-right shadow-2xl backdrop-blur-md">
      <Link
        href="/copyright"
        className="block"
        aria-label="Thông tin bản quyền VLearning Studio"
      >
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
          © 2026 VLearning Studio
        </div>

        <div className="mt-1 text-[11px] font-bold text-white">
          Tác giả: Vũ Trọng Thuấn
        </div>

        <div className="mt-0.5 text-[11px] text-slate-400">
          SĐT: 0972348298
        </div>

        <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
          All rights reserved
        </div>
      </Link>
    </div>
  );
}
