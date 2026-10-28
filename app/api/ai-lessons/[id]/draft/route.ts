import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AuthError } from "@/lib/authServer";
import { requireLessonAuthor } from "@/lib/aiLessonAccess";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Context) {
  try {
    const user = await requireLessonAuthor();
    const { id } = await ctx.params;
    const row = await db.aiLessonPlan.findFirst({ where: { id, ownerUserId: user.id }, select: { contentJson: true } });
    if (!row) throw new AuthError("Không tìm thấy bài dạy.", 404);
    let data: unknown;
    try { data = JSON.parse(row.contentJson); } catch { data = {}; }
    const d = data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
    return NextResponse.json({ ok: true, data: { sourceText: typeof d.sourceText === "string" ? d.sourceText : "", draftText: typeof d.draftText === "string" ? d.draftText : "" } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    console.error("Read lesson draft failed", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ ok: false, error: "Không thể tải bản nháp." }, { status: 500 });
  }
}
