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
  jobErrorMessage,
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

    const job =
      await getPptxJob(
        jobId
      );

    assertJobOwner(
      job,
      user.id
    );

    if (
      job.status ===
      "error"
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          status:
            "error",
          error:
            jobErrorMessage(
              job
            ),
        },
        {
          status:
            422,
        }
      );
    }

    if (
      job.status !==
      "finished"
    ) {
      return NextResponse.json({
        ok:
          true,
        status:
          job.status,
        files:
          [],
      });
    }

    const files =
      exportedPngFiles(
        job
      );

    return NextResponse.json({
      ok:
        true,
      status:
        "finished",
      files:
        files.map(
          (
            file,
            index
          ) => ({
            index,
            filename:
              file.filename ??
              `slide-${index + 1}.png`,
          })
        ),
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
      "[PPTX] Status failed:",
      error
    );

    return NextResponse.json(
      {
        ok:
          false,
        error:
          error instanceof Error
            ? error.message
            : "Không đọc được trạng thái PowerPoint.",
      },
      {
        status:
          500,
      }
    );
  }
}
