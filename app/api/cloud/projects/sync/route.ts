import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  AuthError,
  requireSameOrigin,
} from "@/lib/authServer";

import {
  syncCloudProjects,
} from "@/lib/cloudProjectsServer";

export const runtime =
  "nodejs";

export async function POST(
  request: NextRequest
) {
  try {
    await requireSameOrigin(
      request
    );

    const body =
      await request.json();

    const projects =
      Array.isArray(
        body.projects
      )
        ? body.projects
        : [];

    const synced =
      await syncCloudProjects(
        projects
      );

    return NextResponse.json(
      {
        ok:
          true,
        data: {
          synced:
            synced.length,
          projects:
            synced,
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
      error
    );

    return NextResponse.json(
      {
        ok:
          false,
        error:
          "Không đồng bộ được Project lên Cloud.",
      },
      {
        status:
          500,
      }
    );
  }
}
