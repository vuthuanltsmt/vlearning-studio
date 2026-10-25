import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  AuthError,
  requireSameOrigin,
  serverUserForGuard,
} from "@/lib/authServer";

import {
  canAuthor,
} from "@/lib/permissions";

export const runtime = "nodejs";

type ImageInput = {
  name: string;
  dataUrl: string;
};

function outputText(payload: any) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === "string" && part.text.trim()) {
        return part.text;
      }
    }
  }
  return "";
}

function parseJson(value: string) {
  return JSON.parse(
    value
      .trim()
      .replace(/^\`\`\`json\\s*/i, "")
      .replace(/^\`\`\`\\s*/i, "")
      .replace(/\\s*\`\`\`$/, "")
      .trim()
  );
}

export async function POST(request: NextRequest) {
  try {
    await requireSameOrigin(request);

    const user = await serverUserForGuard();
    if (!user) {
      throw new AuthError("Chưa đăng nhập.", 401);
    }

    if (!canAuthor(user.accessRole)) {
      throw new AuthError("Tài khoản không có quyền tạo đề kiểm tra.", 403);
    }

    const body = await request.json();

    const apiKey =
      typeof body?.apiKey === "string"
        ? body.apiKey.trim()
        : "";

    if (!apiKey.startsWith("sk-") || apiKey.length < 20) {
      throw new AuthError(
        "API Key OpenAI chưa hợp lệ. Hãy nhập API Key cá nhân.",
        400
      );
    }

    const images =
      Array.isArray(body?.images)
        ? (body.images as ImageInput[])
        : [];

    if (images.length < 1 || images.length > 15) {
      throw new AuthError(
        "Vui lòng chọn từ 1 đến 15 ảnh tài liệu.",
        400
      );
    }

    for (const image of images) {
      if (
        typeof image?.dataUrl !== "string" ||
        !image.dataUrl.startsWith("data:image/") ||
        image.dataUrl.length > 2800000
      ) {
        throw new AuthError(
          "Có ảnh tài liệu không hợp lệ hoặc quá lớn.",
          400
        );
      }
    }

    const duration =
      Math.max(15, Math.min(180, Number(body?.duration) || 45));

    const totalScore =
      Math.max(1, Math.min(100, Number(body?.totalScore) || 10));

    const instructions = [
      "Bạn là chuyên gia kiểm tra, đánh giá giáo dục phổ thông Việt Nam.",
      "",
      "Đọc toàn bộ ảnh bài học/tài liệu người dùng cung cấp và tạo đồng bộ 4 sản phẩm theo đúng tinh thần và cấu trúc Phụ lục Công văn 7991/BGDĐT-GDTrH ngày 17/12/2024:",
      "1. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ.",
      "2. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ.",
      "3. ĐỀ KIỂM TRA HOÀN CHỈNH.",
      "4. ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM.",
      "",
      "Thông số:",
      "- Thời gian: " + duration + " phút.",
      "- Thang điểm: " + totalScore + ".",
      "- Chỉ dùng 3 mức độ đánh giá theo mẫu 7991: Biết, Hiểu, Vận dụng.",
      "- Các dạng câu hỏi theo mẫu 7991: TNKQ Nhiều lựa chọn; TNKQ Đúng - Sai; TNKQ Trả lời ngắn; Tự luận.",
      "- Cơ cấu điểm tham khảo: khoảng 3,0 điểm Nhiều lựa chọn; 2,0 điểm Đúng - Sai; 2,0 điểm Trả lời ngắn; 3,0 điểm Tự luận; điều chỉnh hợp lý theo môn nhưng tổng phải bằng " + totalScore + ".",
      "- Cơ cấu mức độ tham khảo: khoảng 40% Biết, 30% Hiểu, 30% Vận dụng.",
      "- Ma trận, đặc tả, đề và hướng dẫn chấm phải khớp tuyệt đối về chủ đề, đơn vị kiến thức, mức độ, dạng câu, số câu và điểm.",
      "- Chỉ sử dụng phạm vi kiến thức có trong tài liệu tải lên.",
      "- Tự xác định môn, lớp, tên bài/chủ đề nếu có thể; nếu không chắc thì để trống.",
      "- Bản đặc tả phải nêu rõ yêu cầu cần đạt theo từng đơn vị kiến thức và phân bố câu hỏi theo từng dạng/mức độ.",
      "- Câu nhiều lựa chọn có 4 phương án A, B, C, D và 1 đáp án đúng.",
      "- Câu Đúng - Sai có 4 ý a, b, c, d và đáp án cho từng ý.",
      "- Câu trả lời ngắn có đáp án ngắn, xác định.",
      "- Câu tự luận có hướng dẫn chấm và điểm thành phần.",
      "",
      "Chỉ trả JSON thuần, không markdown, theo schema:",
      "{",
      '  "subject":"",',
      '  "grade":"",',
      '  "testTitle":"",',
      '  "duration":' + duration + ",",
      '  "totalScore":' + totalScore + ",",
      '  "scope":[""],',
      '  "matrix":[{',
      '    "topic":"",',
      '    "knowledgeUnit":"",',
      '    "multipleChoice":{"know":0,"understand":0,"apply":0,"score":0},',
      '    "trueFalse":{"know":0,"understand":0,"apply":0,"score":0},',
      '    "shortAnswer":{"know":0,"understand":0,"apply":0,"score":0},',
      '    "essay":{"know":0,"understand":0,"apply":0,"score":0},',
      '    "totalQuestions":0,',
      '    "totalScore":0,',
      '    "percent":0',
      "  }],",
      '  "matrixTotals":{"multipleChoiceScore":0,"trueFalseScore":0,"shortAnswerScore":0,"essayScore":0,"knowScore":0,"understandScore":0,"applyScore":0},',
      '  "specification":[{',
      '    "topic":"",',
      '    "knowledgeUnit":"",',
      '    "requirements":{"know":"","understand":"","apply":""},',
      '    "allocation":{',
      '      "multipleChoice":{"know":"","understand":"","apply":""},',
      '      "trueFalse":{"know":"","understand":"","apply":""},',
      '      "shortAnswer":{"know":"","understand":"","apply":""},',
      '      "essay":{"know":"","understand":"","apply":""}',
      "    }",
      "  }],",
      '  "sections":[{',
      '    "title":"PHẦN I. Câu trắc nghiệm nhiều lựa chọn",',
      '    "type":"MCQ",',
      '    "questions":[{',
      '      "number":1,',
      '      "level":"Biết",',
      '      "topic":"",',
      '      "score":0.25,',
      '      "prompt":"",',
      '      "options":["A. ","B. ","C. ","D. "],',
      '      "answer":"A",',
      '      "markingGuide":""',
      "    }]",
      "  }],",
      '  "answerSummary":"",',
      '  "notes":""',
      "}",
      "",
      "Trước khi trả kết quả, tự kiểm tra:",
      "- Tổng điểm đúng bằng " + totalScore + ".",
      '- Không có mức "Vận dụng cao".',
      "- Mọi câu hỏi đều xuất hiện đúng vị trí trong ma trận và bản đặc tả."
    ].join("\\n");

    const content: any[] = [
      {
        type: "input_text",
        text: instructions,
      },
    ];

    for (const image of images) {
      content.push({
        type: "input_image",
        image_url: image.dataUrl,
        detail: "high",
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model:
            process.env.VLEARNING_AI_MODEL?.trim() ||
            "gpt-5.6",
          input: [
            {
              role: "user",
              content,
            },
          ],
          max_output_tokens: 24000,
        }),
        cache: "no-store",
      }
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      console.error(
        "[ASSESSMENT AI] OpenAI request failed:",
        response.status
      );

      throw new Error(
        payload?.error?.message ||
          "AI không thể tạo ma trận và đề kiểm tra."
      );
    }

    const text = outputText(payload);
    if (!text) {
      throw new Error("AI không trả về nội dung.");
    }

    let result: unknown;

    try {
      result = parseJson(text);
    } catch {
      throw new Error(
        "AI trả về dữ liệu chưa đúng định dạng. Vui lòng thử lại."
      );
    }

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        {
          status: error.status,
        }
      );
    }

    console.error("[ASSESSMENT AI] Generate failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Không thể tạo ma trận và đề kiểm tra.",
      },
      {
        status: 500,
      }
    );
  }
}
