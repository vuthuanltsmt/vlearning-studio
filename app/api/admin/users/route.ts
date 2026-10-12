import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  AuthError,
  listAdminUsers,
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

export async function GET(
  _request: NextRequest
) {
  try {
    const users =
      await listAdminUsers();

    return NextResponse.json(
      {
        ok:
          true,
        users,
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
