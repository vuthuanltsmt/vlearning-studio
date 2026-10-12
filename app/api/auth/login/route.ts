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
  cleanupExpiredSessions,
  loginServerUser,
} from "@/lib/authServer";

export async function POST(
  request: NextRequest
) {
  try {
    await requireSameOrigin(
      request
    );

    await cleanupExpiredSessions();

    const body =
      await request.json();

    const user =
      await loginServerUser(
        {
          email:
            String(
              body.email ??
              ""
            ),
          password:
            String(
              body.password ??
              ""
            ),
          remember:
            Boolean(
              body.remember
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
