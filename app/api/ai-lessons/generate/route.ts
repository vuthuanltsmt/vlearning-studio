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
    const token = process.env.GEMINI_API_KEY?.trim();
    if (!token) return NextResponse.json({ ok: false, error: "Chưa cấu hình GEMINI_API_KEY trên Vercel Preview V13.1." }, { status: 503 });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    const system = "Bạn là trợ lý soạn giáo án tiếng Việt. Dựa vào nguồn NotebookLM do giáo viên cung cấp, không tự tạo dẫn chứng hay số liệu. Khi thiếu thông tin ghi [Cần giáo viên bổ sung]. Trình bày: I. Mục tiêu; II. Chuẩn bị; III. Tiến trình dạy học với khởi động, hình thành kiến thức, luyện tập, vận dụng, đánh giá; mô tả hoạt động giáo viên và học sinh. Ghi rõ bản nháp cần giáo viên kiểm duyệt.";
    const model = process.env.GEMINI_LESSON_MODEL?.trim() || "gemini-2.5-flash";
    if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new AuthError("Tên mô hình Gemini không hợp lệ.", 500);
    let response: Response;
    try {
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
        method: "POST",
        signal: controller.signal,
        headers: { "x-goog-api-key": token, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: JSON.stringify({ title, subject, grade, objectives, sourceText, instruction }) }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4000 }
        })
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      const messages: Record<number,string> = {
        400: "Yêu cầu Gemini không hợp lệ hoặc mô hình không hỗ trợ.",
        401: "Gemini từ chối API Key. Kiểm tra khóa Google AI Studio.",
        403: "Gemini không cho phép sử dụng khóa hoặc mô hình này.",
        404: "Không tìm thấy mô hình Gemini. Kiểm tra GEMINI_LESSON_MODEL.",
        429: "Gemini đã hết hạn mức miễn phí hoặc vượt giới hạn tốc độ. Hãy thử lại sau.",
        503: "Dịch vụ Gemini tạm thời quá tải."
      };
      return NextResponse.json({ ok: false, error: messages[response.status] || "Gemini trả HTTP " + response.status + "." }, { status: 502 });
    }
    const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }> };
    const candidate = result.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text || "").join("").trim();
    if (!text) return NextResponse.json({ ok: false, error: "Gemini không trả về văn bản. Hãy thử nguồn ngắn hơn hoặc kiểm tra giới hạn đầu ra." }, { status: 502 });
    return NextResponse.json({ ok: true, data: { text } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    if (err instanceof Error && err.name === "AbortError") return NextResponse.json({ ok: false, error: "AI xử lý quá thời gian cho phép." }, { status: 504 });
    console.error("AI lesson generation failed", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ ok: false, error: "Không thể tạo giáo án." }, { status: 500 });
  }
}
