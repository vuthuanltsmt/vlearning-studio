import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  AuthError,
  requireSameOrigin,
} from "@/lib/authServer";

import {
  deleteCloudProject,
  getCloudProject,
} from "@/lib/cloudProjectsServer";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type RouteContext = {
  params:
    Promise<{
      projectId: string;
    }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const {
      projectId,
    } =
      await context.params;

    const data =
      await getCloudProject(
        projectId
      );

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

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requireSameOrigin(
      request
    );

    const {
      projectId,
    } =
      await context.params;

    await deleteCloudProject(
      projectId
    );

    return NextResponse.json(
      {
        ok:
          true,
        data: {
          deleted:
            true,
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
          "Không xóa được Project Cloud.",
      },
      {
        status:
          500,
      }
    );
  }
}
