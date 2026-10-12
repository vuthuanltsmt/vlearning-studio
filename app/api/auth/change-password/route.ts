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
  changeServerPassword,
} from "@/lib/authServer";

export async function POST(
  request: NextRequest
) {
  try {
    await requireSameOrigin(
      request
    );

    const body =
      await request.json();

    await changeServerPassword(
      {
        oldPassword:
          String(
            body.oldPassword ??
            ""
          ),
        newPassword:
          String(
            body.newPassword ??
            ""
          ),
      }
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
