type PasswordResetEmailInput = {
  to: string;
  displayName: string;
  resetUrl: string;
};

export function assertPasswordResetEmailConfigured() {
  if (!process.env.RESEND_API_KEY?.trim()) {
    throw new Error(
      "Thiếu RESEND_API_KEY trong biến môi trường."
    );
  }
}

export async function sendPasswordResetEmail(
  input: PasswordResetEmailInput
) {
  assertPasswordResetEmailConfigured();

  const apiKey =
    process.env.RESEND_API_KEY!.trim();

  const from =
    process.env.VLEARNING_RESET_FROM?.trim() ||
    "VLearning Studio <onboarding@resend.dev>";

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          from,
          to: [input.to],
          subject:
            "Đặt lại mật khẩu VLEARNING STUDIO",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;line-height:1.6;color:#172033">
              <h2 style="color:#0b6fd3">VLEARNING STUDIO</h2>
              <p>Xin chào ${escapeHtml(input.displayName)},</p>
              <p>Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
              <p style="margin:28px 0">
                <a href="${escapeHtml(input.resetUrl)}"
                   style="display:inline-block;background:#0b6fd3;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">
                  Đặt lại mật khẩu
                </a>
              </p>
              <p>Liên kết có hiệu lực trong <b>30 phút</b> và chỉ sử dụng được một lần.</p>
              <p>Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này.</p>
              <hr style="border:0;border-top:1px solid #e5e7eb;margin:26px 0" />
              <p style="font-size:12px;color:#64748b">
                VLEARNING STUDIO – Nền tảng thiết kế bài giảng tương tác, xuất bản SCORM
              </p>
            </div>
          `,
        }),
      }
    );

  if (!response.ok) {
    const detail =
      await response.text();

    console.error(
      "[PASSWORD RESET EMAIL] Resend error:",
      response.status,
      detail
    );

    throw new Error(
      "Không thể gửi email đặt lại mật khẩu."
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
