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

type SourceInput = {
  name: string;
  kind: "image" | "file";
  mime: string;
  dataUrl: string;
};

function outputText(payload: any) {
  if (
    typeof payload?.output_text === "string" &&
    payload.output_text.trim()
  ) {
    return payload.output_text;
  }

  const output = Array.isArray(payload?.output)
    ? payload.output
    : [];

  for (const item of output) {
    const parts = Array.isArray(item?.content)
      ? item.content
      : [];

    for (const part of parts) {
      if (
        typeof part?.text === "string" &&
        part.text.trim()
      ) {
        return part.text;
      }
    }
  }

  return "";
}

function parseJson(value: string) {
  let cleaned = value.trim();
  const fence =
    String.fromCharCode(96, 96, 96);

  if (
    cleaned.charCodeAt(0) === 96 &&
    cleaned.startsWith(fence)
  ) {
    const firstBreak =
      cleaned.indexOf("\n");

    if (firstBreak >= 0) {
      cleaned =
        cleaned.slice(
          firstBreak + 1
        );
    }

    if (
      cleaned.endsWith(
        fence
      )
    ) {
      cleaned =
        cleaned.slice(
          0,
          -3
        );
    }
  }

  return JSON.parse(
    cleaned.trim()
  );
}

function assessmentInstructions(
  duration: number,
  totalScore: number
) {
  return [
    "Bạn là chuyên gia kiểm tra, đánh giá giáo dục phổ thông Việt Nam.",
    "",
    "Hãy đọc toàn bộ tài liệu người dùng cung cấp và tạo đồng bộ sản phẩm theo tinh thần, cấu trúc Phụ lục Công văn 7991/BGDĐT-GDTrH ngày 17/12/2024.",
    "",
    "PHẢI TẠO ĐỦ:",
    "1. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ.",
    "2. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ.",
    "3. ĐỀ KIỂM TRA MÃ 01.",
    "4. ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM MÃ 01.",
    "5. ĐỀ KIỂM TRA MÃ 02.",
    "6. ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM MÃ 02.",
    "",
    "Thông số:",
    "- Thời gian làm bài: " + duration + " phút.",
    "- Thang điểm: " + totalScore + ".",
    "- Chỉ dùng 3 mức độ: Biết, Hiểu, Vận dụng.",
    "- Không dùng mức Vận dụng cao.",
    "- Các dạng câu hỏi: TNKQ Nhiều lựa chọn; TNKQ Đúng - Sai; TNKQ Trả lời ngắn; Tự luận.",
    "- Cơ cấu điểm tham khảo: khoảng 3,0 điểm Nhiều lựa chọn; 2,0 điểm Đúng - Sai; 2,0 điểm Trả lời ngắn; 3,0 điểm Tự luận. Có thể điều chỉnh hợp lý theo môn nhưng tổng phải đúng bằng " + totalScore + ".",
    "- Cơ cấu mức độ tham khảo: khoảng 40% Biết, 30% Hiểu, 30% Vận dụng.",
    "- Chỉ sử dụng phạm vi kiến thức thực sự có trong tài liệu tải lên.",
    "- Tự xác định môn, lớp, tên bài/chủ đề nếu có đủ căn cứ; nếu không chắc thì để trống, không suy đoán.",
    "",
    "Yêu cầu đồng bộ:",
    "- Ma trận, bản đặc tả, Mã 01, Mã 02 và đáp án phải khớp tuyệt đối về chủ đề, đơn vị kiến thức, mức độ, dạng câu, số câu và điểm.",
    "- Mã 01 và Mã 02 phải tương đương về cấu trúc, độ khó, yêu cầu cần đạt và tổng điểm.",
    "- Mã 02 không được chỉ đổi tên mã đề. Hãy hoán đổi thứ tự câu/phương án hoặc thay số liệu, tình huống, ngữ liệu tương đương khi phù hợp.",
    "- Không làm thay đổi chuẩn kiến thức hoặc độ khó giữa hai mã.",
    "- Câu nhiều lựa chọn có 4 phương án A, B, C, D và đúng 1 đáp án.",
    "- Câu Đúng - Sai có 4 ý a, b, c, d và đáp án cho từng ý.",
    "- Câu trả lời ngắn có đáp án ngắn, xác định.",
    "- Câu tự luận có hướng dẫn chấm và điểm thành phần.",
    "",
    "Chỉ trả JSON thuần, không markdown.",
    "Schema bắt buộc:",
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
    '  "versions":[{',
    '    "code":"01",',
    '    "sections":[{',
    '      "title":"PHẦN I. Câu trắc nghiệm nhiều lựa chọn",',
    '      "type":"MCQ",',
    '      "questions":[{',
    '        "number":1,',
    '        "level":"Biết",',
    '        "topic":"",',
    '        "score":0.25,',
    '        "prompt":"",',
    '        "options":["A. ","B. ","C. ","D. "],',
    '        "answer":"A",',
    '        "markingGuide":""',
    "      }]",
    "    }],",
    '    "answerSummary":"",',
    '    "notes":""',
    "  },{",
    '    "code":"02",',
    '    "sections":[],',
    '    "answerSummary":"",',
    '    "notes":""',
    "  }],",
    '  "notes":""',
    "}",
    "",
    "Trước khi trả kết quả, tự kiểm tra:",
    "- Có đúng 2 mã đề 01 và 02.",
    "- Tổng điểm mỗi mã đúng bằng " + totalScore + ".",
    "- Không có mức Vận dụng cao.",
    "- Mọi câu hỏi đều xuất hiện đúng vị trí trong ma trận và bản đặc tả.",
    "- Đáp án và điểm thành phần khớp chính xác với từng mã."
  ].join("\n");
}

export async function POST(
  request: NextRequest
) {
  try {
    await requireSameOrigin(
      request
    );

    const user =
      await serverUserForGuard();

    if (!user) {
      throw new AuthError(
        "Chưa đăng nhập.",
        401
      );
    }

    if (
      !canAuthor(
        user.accessRole
      )
    ) {
      throw new AuthError(
        "Tài khoản không có quyền tạo đề kiểm tra.",
        403
      );
    }

    const body =
      await request.json();

    const apiKey =
      typeof body?.apiKey ===
      "string"
        ? body.apiKey.trim()
        : "";

    if (
      !apiKey.startsWith(
        "sk-"
      ) ||
      apiKey.length < 20
    ) {
      throw new AuthError(
        "API Key OpenAI chưa hợp lệ. Hãy nhập API Key cá nhân.",
        400
      );
    }

    const sources =
      Array.isArray(
        body?.sources
      )
        ? (body.sources as SourceInput[])
        : [];

    if (
      sources.length < 1 ||
      sources.length > 12
    ) {
      throw new AuthError(
        "Vui lòng chọn từ 1 đến 12 ảnh/tài liệu.",
        400
      );
    }

    let combinedLength = 0;

    for (
      const source of
      sources
    ) {
      if (
        !source ||
        typeof source.name !==
          "string" ||
        !source.name.trim() ||
        typeof source.dataUrl !==
          "string" ||
        typeof source.mime !==
          "string" ||
        (
          source.kind !==
            "image" &&
          source.kind !==
            "file"
        )
      ) {
        throw new AuthError(
          "Có tài liệu không hợp lệ.",
          400
        );
      }

      combinedLength +=
        source.dataUrl.length;

      if (
        source.kind ===
        "image"
      ) {
        if (
          !source.dataUrl.startsWith(
            "data:image/"
          ) ||
          source.dataUrl.length >
            2800000
        ) {
          throw new AuthError(
            "Có ảnh không hợp lệ hoặc quá lớn.",
            400
          );
        }
      } else {
        const allowed =
          source.mime ===
            "application/pdf" ||
          source.mime ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          source.mime ===
            "text/plain";

        if (
          !allowed ||
          !source.dataUrl.startsWith(
            "data:"
          ) ||
          source.dataUrl.length >
            8500000
        ) {
          throw new AuthError(
            "Tài liệu phải là PDF, DOCX hoặc TXT và không quá lớn.",
            400
          );
        }
      }
    }

    if (
      combinedLength >
      20000000
    ) {
      throw new AuthError(
        "Tổng dung lượng tài liệu quá lớn. Hãy giảm số lượng hoặc kích thước file.",
        400
      );
    }

    const duration =
      Math.max(
        15,
        Math.min(
          180,
          Number(
            body?.duration
          ) || 45
        )
      );

    const totalScore =
      Math.max(
        1,
        Math.min(
          100,
          Number(
            body?.totalScore
          ) || 10
        )
      );

    const content: any[] = [
      {
        type:
          "input_text",
        text:
          assessmentInstructions(
            duration,
            totalScore
          ),
      },
    ];

    for (
      const source of
      sources
    ) {
      if (
        source.kind ===
        "image"
      ) {
        content.push({
          type:
            "input_image",
          image_url:
            source.dataUrl,
          detail:
            "high",
        });
      } else {
        content.push({
          type:
            "input_file",
          file_data:
            source.dataUrl,
          filename:
            source.name,
        });
      }
    }

    const response =
      await fetch(
        "https://api.openai.com/v1/responses",
        {
          method:
            "POST",
          headers: {
            Authorization:
              "Bearer " +
              apiKey,
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              model:
                process.env.VLEARNING_AI_MODEL?.trim() ||
                "gpt-5.6",
              input: [
                {
                  role:
                    "user",
                  content,
                },
              ],
              max_output_tokens:
                30000,
            }),
          cache:
            "no-store",
        }
      );

    const payload =
      await response
        .json()
        .catch(
          () => null
        );

    if (
      !response.ok
    ) {
      console.error(
        "[ASSESSMENT AI] OpenAI request failed:",
        response.status
      );

      throw new Error(
        payload?.error
          ?.message ||
          "AI không thể tạo ma trận và đề kiểm tra."
      );
    }

    const text =
      outputText(
        payload
      );

    if (!text) {
      throw new Error(
        "AI không trả về nội dung."
      );
    }

    let result: any;

    try {
      result =
        parseJson(
          text
        );
    } catch {
      throw new Error(
        "AI trả về dữ liệu chưa đúng định dạng. Vui lòng thử lại."
      );
    }

    if (
      !Array.isArray(
        result?.versions
      ) ||
      result.versions.length <
        2
    ) {
      throw new Error(
        "AI chưa tạo đủ 2 mã đề. Vui lòng thử lại."
      );
    }

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    if (
      error instanceof
      AuthError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error.message,
        },
        {
          status:
            error.status,
        }
      );
    }

    console.error(
      "[ASSESSMENT AI] Generate failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof
          Error
            ? error.message
            : "Không thể tạo ma trận và đề kiểm tra.",
      },
      {
        status: 500,
      }
    );
  }
}
