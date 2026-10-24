import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  AuthError,
  cleanupExpiredPasswordResetTokens,
  createPasswordResetRequest,
  requireSameOrigin,
} from "@/lib/authServer";

import {
  assertPasswordResetEmailConfigured,
  sendPasswordResetEmail,
} from "@/lib/passwordResetEmail";

export const runtime =
  "nodejs";

const GENERIC_MESSAGE =
  "Nếu email đã được đăng ký, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu.";

export async function POST(
  request: NextRequest
) {
  try {
    await requireSameOrigin(
      request
    );

    assertPasswordResetEmailConfigured();

    await cleanupExpiredPasswordResetTokens();

    const body =
      await request.json();

    const reset =
      await createPasswordResetRequest(
        String(
          body.email ??
          ""
        )
      );

    if (
      reset
    ) {
      const configuredBaseUrl =
        process.env.VLEARNING_APP_URL?.trim();

      const baseUrl =
        configuredBaseUrl ||
        request.nextUrl.origin;

      const resetUrl =
        `${baseUrl.replace(
          /\/$/,
          ""
        )}/reset-password?token=${encodeURIComponent(
          reset.token
        )}`;

      try {
        await sendPasswordResetEmail(
          {
            to:
              reset.email,
            displayName:
              reset.displayName,
            resetUrl,
          }
        );
      } catch (
        emailError
      ) {
        console.error(
          "[PASSWORD RESET] Email delivery failed:",
          emailError
        );
      }
    }

    return NextResponse.json(
      {
        ok:
          true,
        message:
          GENERIC_MESSAGE,
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
          error instanceof Error &&
          error.message.includes(
            "RESEND_API_KEY"
          )
            ? "Hệ thống gửi email chưa được cấu hình."
            : "Lỗi máy chủ.",
      },
      {
        status:
          500,
      }
    );
  }
}
