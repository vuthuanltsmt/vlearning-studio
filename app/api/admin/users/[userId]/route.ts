import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  AuthError,
  deleteAdminUser,
  requireSameOrigin,
  updateAdminUserAccess,
} from "@/lib/authServer";

export const runtime =
  "nodejs";

function errorResponse(
  error: unknown
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
        "Lỗi máy chủ.",
    },
    {
      status:
        500,
    }
  );
}

type RouteContext = {
  params:
    Promise<{
      userId: string;
    }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requireSameOrigin(
      request
    );

    const {
      userId,
    } =
      await context.params;

    const body =
      await request.json();

    const user =
      await updateAdminUserAccess(
        userId,
        {
          accessRole:
            String(
              body.accessRole ??
              ""
            ),
          isActive:
            Boolean(
              body.isActive
            ),
        }
      );

    return NextResponse.json(
      {
        ok:
          true,
        user,
      }
    );
  } catch (
    error
  ) {
    return errorResponse(
      error
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
      userId,
    } =
      await context.params;

    await deleteAdminUser(
      userId
    );

    return NextResponse.json(
      {
        ok:
          true,
      }
    );
  } catch (
    error
  ) {
    return errorResponse(
      error
    );
  }
}
