import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  AuthError,
  requireSameOrigin,
  resetServerPassword,
} from "@/lib/authServer";

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

    await resetServerPassword(
      {
        token:
          String(
            body.token ??
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
        message:
          "Đã đặt lại mật khẩu. Hãy đăng nhập lại bằng mật khẩu mới.",
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
          "Lỗi máy chủ.",
      },
      {
        status:
          500,
      }
    );
  }
}
