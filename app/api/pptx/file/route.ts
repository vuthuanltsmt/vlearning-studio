import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  AuthError,
} from "@/lib/authServer";

import {
  assertJobOwner,
  exportedPngFiles,
  getPptxJob,
  requirePptxAuthor,
} from "@/lib/cloudConvertPptxServer";

export const runtime =
  "nodejs";

export async function GET(
  request: NextRequest
) {
  try {
    const user =
      await requirePptxAuthor();

    const jobId =
      request.nextUrl.searchParams.get(
        "jobId"
      ) ??
      "";

    const index =
      Number(
        request.nextUrl.searchParams.get(
          "index"
        )
      );

    if (
      !Number.isInteger(
        index
      ) ||
      index <
        0
    ) {
      throw new AuthError(
        "Chỉ số slide không hợp lệ.",
        400
      );
    }

    const job =
      await getPptxJob(
        jobId
      );

    assertJobOwner(
      job,
      user.id
    );

    if (
      job.status !==
      "finished"
    ) {
      throw new AuthError(
        "Tác vụ chưa hoàn tất.",
        409
      );
    }

    const files =
      exportedPngFiles(
        job
      );

    const file =
      files[index];

    if (
      !file?.url
    ) {
      throw new AuthError(
        "Không tìm thấy ảnh slide.",
        404
      );
    }

    const response =
      await fetch(
        file.url,
        {
          cache:
            "no-store",
        }
      );

    if (
      !response.ok
    ) {
      throw new Error(
        "Không tải được ảnh slide từ CloudConvert."
      );
    }

    const bytes =
      await response.arrayBuffer();

    return new NextResponse(
      bytes,
      {
        status:
          200,
        headers: {
          "Content-Type":
            response.headers.get(
              "content-type"
            ) ??
            "image/png",
          "Cache-Control":
            "private, no-store",
        },
      }
    );
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
      "[PPTX] File proxy failed:",
      error
    );

    return NextResponse.json(
      {
        ok:
          false,
        error:
          "Không tải được ảnh slide.",
      },
      {
        status:
          500,
      }
    );
  }
}
