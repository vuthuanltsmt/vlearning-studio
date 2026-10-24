import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  AuthError,
  requireSameOrigin,
} from "@/lib/authServer";

import {
  createPptxConversionJob,
  requirePptxAuthor,
} from "@/lib/cloudConvertPptxServer";

export const runtime =
  "nodejs";

export async function POST(
  request: NextRequest
) {
  try {
    await requireSameOrigin(
      request
    );

    const user =
      await requirePptxAuthor();

    const result =
      await createPptxConversionJob(
        user.id
      );

    return NextResponse.json({
      ok:
        true,
      ...result,
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
      "[PPTX] Start conversion failed:",
      error
    );

    return NextResponse.json(
      {
        ok:
          false,
        error:
          error instanceof Error
            ? error.message
            : "Không thể khởi tạo chuyển đổi PowerPoint.",
      },
      {
        status:
          500,
      }
    );
  }
}
