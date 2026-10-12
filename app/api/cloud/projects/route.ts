import {
  NextResponse,
} from "next/server";

import {
  AuthError,
} from "@/lib/authServer";

import {
  listCloudProjects,
} from "@/lib/cloudProjectsServer";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function GET() {
  try {
    const data =
      await listCloudProjects();

    return NextResponse.json(
      {
        ok:
          true,
        data,
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
          "Không tải được Project Cloud.",
      },
      {
        status:
          500,
      }
    );
  }
}
