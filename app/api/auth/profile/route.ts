import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  AuthError,
  requireSameOrigin,
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

import {
  updateServerProfile,
} from "@/lib/authServer";

export async function PATCH(
  request: NextRequest
) {
  try {
    await requireSameOrigin(
      request
    );

    const body =
      await request.json();

    const user =
      await updateServerProfile(
        {
          displayName:
            String(
              body.displayName ??
              ""
            ),
          role:
            String(
              body.role ??
              ""
            ),
          organization:
            String(
              body.organization ??
              ""
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
