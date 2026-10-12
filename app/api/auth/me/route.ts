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
  currentServerUser,
} from "@/lib/authServer";

export async function GET() {
  try {
    await cleanupExpiredSessions();

    const user =
      await currentServerUser();

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
