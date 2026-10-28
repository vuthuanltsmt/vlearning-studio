import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireSameOrigin } from "@/lib/authServer";
import { requireLessonAuthor } from "@/lib/aiLessonAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireSameOrigin(req);
    await requireLessonAuthor();
    const input: unknown = await req.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json({ ok: false, error: "Yêu cầu không hợp lệ." }, { status: 400 });
    }
    const data = input as Record<string, unknown>;
    const read = (key: string, limit: number) => {
      const value = data[key];
      if (typeof value !== "string" || value.length > limit) throw new AuthError("Nội dung " + key + " không hợp lệ.", 400);
      return value.trim();
    };
    const title = read("title", 200);
    const subject = read("subject", 100);
    const grade = read("grade", 30);
    const objectives = read("objectives", 5000);
    const sourceText = read("sourceText", 25000);
    const instruction = read("instruction", 2000);
    if (!title || !sourceText) return NextResponse.json({ ok: false, error: "Cần nhập tên bài và nội dung nguồn NotebookLM." }, { status: 400 });
    const token = process.env.OPENAI_API_KEY;
    if (!token) return NextResponse.json({ ok: false, error: "Chưa cấu hình OPENAI_API_KEY phía máy chủ. Bạn vẫn có thể lưu bản nhập từ NotebookLM." }, { status: 503 });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);
    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OPENAI_LESSON_MODEL || "gpt-4.1-mini",
          temperature: 0.3,
          max_tokens: 2600,
          messages: [
            { role: "system", content: "Bạn là trợ lý soạn giáo án tiếng Việt cho giáo viên. Chỉ sử dụng nội dung nguồn người dùng cung cấp làm căn cứ. Không bịa dẫn chứng, số liệu, trang SGK hay trích dẫn. Nếu thiếu dữ kiện, ghi [Cần giáo viên bổ sung]. Soạn có cấu trúc: I. Mục tiêu; II. Chuẩn bị; III. Tiến trình (khởi động, hình thành kiến thức, luyện tập, vận dụng), hoạt động của giáo viên/học sinh và đánh giá. Đánh dấu rõ đây là bản nháp cần giáo viên kiểm duyệt." },
            { role: "user", content: JSON.stringify({ title, subject, grade, objectives, sourceText, instruction }) }
          ]
        })
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) return NextResponse.json({ ok: false, error: "Dịch vụ AI chưa phản hồi thành công (" + response.status + ")." }, { status: 502 });
    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = result.choices?.[0]?.message?.content?.trim();
    if (!text) return NextResponse.json({ ok: false, error: "AI trả nội dung trống." }, { status: 502 });
    return NextResponse.json({ ok: true, data: { text } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    if (err instanceof Error && err.name === "AbortError") return NextResponse.json({ ok: false, error: "AI xử lý quá thời gian cho phép." }, { status: 504 });
    console.error("AI lesson generation failed", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ ok: false, error: "Không thể tạo giáo án." }, { status: 500 });
  }
}
