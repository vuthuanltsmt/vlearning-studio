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

export const runtime =
  "nodejs";

type ImageInput = {
  name: string;
  dataUrl: string;
};

async function requireAuthor() {
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
      "Tài khoản không có quyền soạn giáo án.",
      403
    );
  }
}

function extractOutputText(
  payload: any
) {
  if (
    typeof payload?.output_text ===
      "string" &&
    payload.output_text.trim()
  ) {
    return payload.output_text;
  }

  const output =
    Array.isArray(
      payload?.output
    )
      ? payload.output
      : [];

  for (
    const item of
    output
  ) {
    const content =
      Array.isArray(
        item?.content
      )
        ? item.content
        : [];

    for (
      const part of
      content
    ) {
      if (
        typeof part?.text ===
          "string" &&
        part.text.trim()
      ) {
        return part.text;
      }
    }
  }

  return "";
}

function parseJsonText(
  value: string
) {
  const cleaned =
    value
      .trim()
      .replace(
        /^\`\`\`json\s*/i,
        ""
      )
      .replace(
        /^\`\`\`\s*/i,
        ""
      )
      .replace(
        /\s*\`\`\`$/,
        ""
      )
      .trim();

  return JSON.parse(
    cleaned
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    await requireSameOrigin(
      request
    );

    await requireAuthor();

    const body =
      await request.json();

    const apiKey =
      typeof body?.apiKey ===
        "string"
        ? body.apiKey.trim()
        : "";

    if (
      apiKey.length <
        20 ||
      !apiKey.startsWith(
        "sk-"
      )
    ) {
      throw new AuthError(
        "API Key OpenAI chưa hợp lệ. Hãy nhập API Key cá nhân của bạn.",
        400
      );
    }

    const images =
      Array.isArray(
        body?.images
      )
        ? body.images as
          ImageInput[]
        : [];

    if (
      images.length <
        1 ||
      images.length >
        10
    ) {
      throw new AuthError(
        "Vui lòng chọn từ 1 đến 10 ảnh tài liệu.",
        400
      );
    }

    for (
      const image of
      images
    ) {
      if (
        typeof image?.dataUrl !==
          "string" ||
        !image.dataUrl.startsWith(
          "data:image/"
        ) ||
        image.dataUrl.length >
          2_800_000
      ) {
        throw new AuthError(
          "Ảnh tài liệu không hợp lệ hoặc quá lớn.",
          400
        );
      }
    }

    const instructions =
      `Bạn là chuyên gia giáo dục phổ thông Việt Nam và chuyên gia thiết kế kế hoạch bài dạy.

NHIỆM VỤ:
Đọc toàn bộ ảnh tài liệu người dùng cung cấp (thường là trang SGK, tài liệu môn học hoặc nội dung bài học) và tự soạn MỘT KẾ HOẠCH BÀI DẠY HOÀN CHỈNH theo định hướng Công văn 5512/BGDĐT-GDTrH, đồng thời tích hợp năng lực số theo Thông tư 02/2025/TT-BGDĐT.

YÊU CẦU:
1. Không yêu cầu người dùng điền biểu mẫu.
2. Tự xác định tối đa có thể từ tài liệu: môn học, lớp, tên bài/chủ đề, nội dung trọng tâm, số tiết hợp lý.
3. Không bịa tên trường hoặc tên giáo viên. Nếu ảnh không có thông tin này, dùng chuỗi rỗng.
4. Viết bằng tiếng Việt, văn phong giáo viên, cụ thể và có thể dùng ngay.
5. Cấu trúc bắt buộc:
   I. Mục tiêu: kiến thức; năng lực chung; năng lực đặc thù; phẩm chất; năng lực số.
   II. Thiết bị dạy học và học liệu.
   III. Tiến trình dạy học gồm 4 hoạt động: Mở đầu; Hình thành kiến thức mới; Luyện tập; Vận dụng.
6. Mỗi hoạt động phải có đủ:
   a) Mục tiêu
   b) Nội dung
   c) Sản phẩm
   d) Tổ chức thực hiện
   Trong "Tổ chức thực hiện", mô tả rõ 4 bước: Chuyển giao nhiệm vụ; Thực hiện nhiệm vụ; Báo cáo/thảo luận; Kết luận/nhận định.
7. Tích hợp năng lực số thực chất vào từng hoạt động, chỉ chọn năng lực phù hợp, không gắn cho đủ.
8. Dùng mã năng lực số theo 6 miền và 24 năng lực thành phần; có thể dùng các mã: 1.1-1.3, 2.1-2.6, 3.1-3.4, 4.1-4.4, 5.1-5.4, 6.1-6.3.
9. Có phần đánh giá/sản phẩm học tập đủ rõ để giáo viên triển khai.
10. Kết quả phải là JSON THUẦN, không markdown, đúng schema sau:

{
  "school": "",
  "teacher": "",
  "subject": "",
  "grade": "",
  "lessonTitle": "",
  "periods": "1",
  "objectives": {
    "knowledge": "",
    "generalCompetencies": "",
    "specificCompetencies": "",
    "qualities": "",
    "digitalCompetencies": [
      {"code":"1.1","name":"","evidence":""}
    ]
  },
  "equipment": "",
  "activities": [
    {
      "title": "Hoạt động 1. Mở đầu",
      "objective": "",
      "content": "",
      "product": "",
      "organization": {
        "transfer": "",
        "perform": "",
        "report": "",
        "conclude": ""
      },
      "digitalCompetencies": [
        {"code":"1.1","name":"","evidence":""}
      ]
    },
    {
      "title": "Hoạt động 2. Hình thành kiến thức mới",
      "objective": "",
      "content": "",
      "product": "",
      "organization": {
        "transfer": "",
        "perform": "",
        "report": "",
        "conclude": ""
      },
      "digitalCompetencies": []
    },
    {
      "title": "Hoạt động 3. Luyện tập",
      "objective": "",
      "content": "",
      "product": "",
      "organization": {
        "transfer": "",
        "perform": "",
        "report": "",
        "conclude": ""
      },
      "digitalCompetencies": []
    },
    {
      "title": "Hoạt động 4. Vận dụng",
      "objective": "",
      "content": "",
      "product": "",
      "organization": {
        "transfer": "",
        "perform": "",
        "report": "",
        "conclude": ""
      },
      "digitalCompetencies": []
    }
  ],
  "assessment": "",
  "notes": ""
}

Hãy ưu tiên độ chính xác theo nội dung ảnh và tạo giáo án đủ chi tiết để xuất Word ngay.`;

    const content:
      any[] = [
        {
          type:
            "input_text",
          text:
            instructions,
        },
      ];

    for (
      const image of
      images
    ) {
      content.push({
        type:
          "input_image",
        image_url:
          image.dataUrl,
        detail:
          "high",
      });
    }

    const response =
      await fetch(
        "https://api.openai.com/v1/responses",
        {
          method:
            "POST",
          headers: {
            Authorization:
              `Bearer ${apiKey}`,
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              model:
                process.env.VLEARNING_AI_MODEL?.trim() ||
                "gpt-6-sol",
              input: [
                {
                  role:
                    "user",
                  content,
                },
              ],
              max_output_tokens:
                16000,
            }),
          cache:
            "no-store",
        }
      );

    const payload =
      await response.json()
        .catch(
          () =>
            null
        );

    if (
      !response.ok
    ) {
      console.error(
        "[LESSON PLAN AI] OpenAI request failed:",
        response.status
      );

      throw new Error(
        payload?.error?.message ||
        "AI không thể soạn giáo án."
      );
    }

    const outputText =
      extractOutputText(
        payload
      );

    if (!outputText) {
      throw new Error(
        "AI không trả về nội dung giáo án."
      );
    }

    let plan:
      unknown;

    try {
      plan =
        parseJsonText(
          outputText
        );
    } catch (
      error
    ) {
      console.error(
        "[LESSON PLAN AI] Invalid JSON:",
        outputText,
        error
      );

      throw new Error(
        "AI trả về dữ liệu giáo án chưa đúng định dạng. Vui lòng thử lại."
      );
    }

    return NextResponse.json({
      ok:
        true,
      plan,
    });
  } catch (
    error
  ) {
    if (
      error instanceof
      AuthError
    ) {
      return NextResponse.json(
        {
          ok:
            false,
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
      "[LESSON PLAN AI] Generate failed:",
      error
    );

    return NextResponse.json(
      {
        ok:
          false,
        error:
          error instanceof Error
            ? error.message
            : "Không thể soạn giáo án bằng AI.",
      },
      {
        status:
          500,
      }
    );
  }
}
