import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AuthError, requireSameOrigin } from "@/lib/authServer";
import { requireLessonAuthor } from "@/lib/aiLessonAccess";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    await requireSameOrigin(req);
    const user = await requireLessonAuthor();
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthError("Nội dung không hợp lệ.", 400);
    const obj = body as Record<string, unknown>;
    if (typeof obj.lessonId !== "string" || typeof obj.sourceText !== "string" || typeof obj.draftText !== "string") throw new AuthError("Thiếu dữ liệu.", 400);
    if (obj.sourceText.length > 25000 || obj.draftText.length > 25000 || !obj.draftText.trim()) throw new AuthError("Bản nháp phải có nội dung và tối đa 25.000 ký tự.", 400);
    const lesson = await db.aiLessonPlan.findFirst({ where: { id: obj.lessonId, ownerUserId: user.id }, select: { id: true } });
    if (!lesson) throw new AuthError("Không tìm thấy giáo án của bạn.", 404);
    const sourceText = obj.sourceText.trim();
    const draftText = obj.draftText.trim();
    const contentJson = JSON.stringify({ version: 1, origin: "notebooklm-import", sourceText, draftText, reviewed: false });
    await db.aiLessonPlan.updateMany({ where: { id: lesson.id, ownerUserId: user.id }, data: { contentJson, status: "DRAFT" } });
    return NextResponse.json({ ok: true, data: { saved: true } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    console.error("Save lesson draft failed", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ ok: false, error: "Không thể lưu bản nháp." }, { status: 500 });
  }
}
