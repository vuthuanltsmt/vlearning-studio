"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Lesson = { id: string; title: string; subject: string; grade: string; objectives: string };
type Draft = { draftText?: string; sourceText?: string };
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { credentials: "same-origin", cache: "no-store", ...init });
  if (!(r.headers.get("content-type") || "").includes("application/json")) throw new Error("API chưa sẵn sàng hoặc Preview yêu cầu đăng nhập Vercel.");
  const x = await r.json();
  if (!r.ok || !x.ok) throw new Error(x.error || "Yêu cầu thất bại.");
  return x.data as T;
}
export default function NotebookLmComposePage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonId, setLessonId] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [draftText, setDraftText] = useState("");
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<Lesson[]>("/api/ai-lessons").then(rows => { if (active) { setLessons(rows); setLessonId(rows[0]?.id ?? ""); } }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Không tải được giáo án."); });
    return () => { active = false; };
  }, []);
  const current = lessons.find(x => x.id === lessonId);
  async function run(fn: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Có lỗi xảy ra."); } finally { setBusy(false); }
  }
  function generate() {
    if (!current) { setError("Hãy tạo giáo án trong AI Lesson Studio trước."); return; }
    void run(async () => {
      const result = await api<{ text: string }>("/api/ai-lessons/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: current.title, subject: current.subject, grade: current.grade, objectives: current.objectives, sourceText, instruction }) });
      setDraftText(result.text);
      setNotice("AI đã tạo bản nháp. Vui lòng rà soát trước khi lưu.");
    });
  }
  function save() {
    if (!current) { setError("Hãy chọn giáo án trước khi lưu."); return; }
    void run(async () => {
      await api("/api/ai-lessons/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId, sourceText, draftText }) });
      setNotice("Đã lưu bản nháp riêng tư lên Cloud.");
    });
  }
  function loadDraft() {
    if (!current) return;
    void run(async () => {
      const d = await api<Draft>("/api/ai-lessons/" + encodeURIComponent(lessonId) + "/draft");
      setSourceText(d.sourceText ?? ""); setDraftText(d.draftText ?? ""); setNotice("Đã tải bản nháp từ Cloud.");
    });
  }
  return <main className="min-h-screen bg-[#06182f] px-4 py-8 text-slate-100">
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="rounded-xl border border-cyan-800 bg-[#102f55] p-5">
        <Link href="/ai-lessons" className="text-sm text-cyan-300">← AI Lesson Studio</Link><Link href="/ai-lessons/editor" className="ml-4 text-sm font-semibold text-emerald-300">Biên tập V13.2 / Xuất Word / Tạo trắc nghiệm</Link><Link href="/ai-lessons/editor" className="ml-4 text-sm font-bold text-emerald-300">Mở V13.2 · Biên tập / Word / Trắc nghiệm</Link>
        <h1 className="mt-3 text-2xl font-bold">Soạn bài bằng AI · Nhập NotebookLM</h1>
        <p className="mt-2 text-sm text-slate-300">V13.1 — Sao chép phần tổng hợp hoặc ghi chú từ NotebookLM, dán vào đây, sau đó tạo giáo án bằng AI hoặc tự chỉnh sửa. Chưa hỗ trợ đồng bộ trực tiếp tài khoản NotebookLM.</p>
      </header>
      {error && <div role="alert" className="rounded-lg border border-red-600 p-3 text-red-200">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-green-600 p-3 text-green-200">{notice}</div>}
      <label className="block space-y-2 text-sm">Giáo án Cloud
        <select className="w-full rounded-lg border border-blue-700 bg-[#102f55] p-3" value={lessonId} onChange={e => setLessonId(e.target.value)}>
          {!lessons.length && <option value="">Chưa có giáo án — hãy tạo ở AI Lesson Studio</option>}
          {lessons.map(x => <option key={x.id} value={x.id}>{x.title} · {x.subject || "Chưa có môn"}</option>)}
        </select>
      </label>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="space-y-3 rounded-xl border border-blue-800 bg-[#0c2a4d] p-4">
          <h2 className="font-bold">1. Nội dung từ NotebookLM</h2>
          <p className="text-xs text-slate-300">Xuất hoặc sao chép nội dung từ NotebookLM. Chỉ nhập tài liệu mà bạn được phép sử dụng. Kiểm tra lại các thông tin và trích dẫn từ nguồn gốc.</p>
          <textarea className="h-80 w-full rounded-lg border border-blue-700 bg-[#06182f] p-3 text-sm" maxLength={25000} value={sourceText} onChange={e => setSourceText(e.target.value)} placeholder="Dán tóm tắt, ghi chú, dàn ý từ NotebookLM..." />
          <p className="text-xs text-slate-400">{sourceText.length}/25.000 ký tự</p>
          <label className="block space-y-2 text-sm">Yêu cầu soạn thêm (tùy chọn)
            <textarea className="h-20 w-full rounded-lg border border-blue-700 bg-[#06182f] p-3" maxLength={2000} value={instruction} onChange={e => setInstruction(e.target.value)} placeholder="Ví dụ: thiết kế hoạt động nhóm, đánh giá năng lực..." />
          </label>
          <button disabled={busy || !current || !sourceText.trim()} onClick={generate} className="rounded-lg bg-cyan-600 px-4 py-3 font-semibold disabled:opacity-40">Soạn giáo án bằng AI</button>
        </section>
        <section className="space-y-3 rounded-xl border border-blue-800 bg-[#0c2a4d] p-4">
          <h2 className="font-bold">2. Bản nháp giáo án</h2>
          <p className="text-xs text-slate-300">Bạn có thể tự viết hoặc sửa kết quả AI trước khi lưu Cloud. Nội dung chưa được coi là giáo án đã duyệt.</p>
          <textarea className="h-96 w-full rounded-lg border border-blue-700 bg-[#06182f] p-3 text-sm" maxLength={25000} value={draftText} onChange={e => setDraftText(e.target.value)} placeholder="Nội dung giáo án xuất hiện tại đây..." />
          <div className="flex flex-wrap gap-3">
            <button disabled={busy || !current || !draftText.trim()} onClick={save} className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold disabled:opacity-40">Lưu bản nháp Cloud</button>
            <button disabled={busy || !current} onClick={loadDraft} className="rounded-lg border border-blue-600 px-4 py-3 disabled:opacity-40">Tải bản đã lưu</button>
          </div>
        </section>
      </div>
    </div>
  </main>;
}
