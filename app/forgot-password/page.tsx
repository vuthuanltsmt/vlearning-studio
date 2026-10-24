"use client";

import {
  FormEvent,
  useState,
} from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");
  const [busy, setBusy] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const response =
        await fetch(
          "/api/auth/forgot-password",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email,
            }),
          }
        );

      const payload =
        await response.json();

      if (
        !response.ok ||
        !payload.ok
      ) {
        throw new Error(
          payload.error ||
            "Không thể gửi yêu cầu."
        );
      }

      setMessage(
        payload.message ||
          "Nếu email đã được đăng ký, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu."
      );
    } catch (
      submitError
    ) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể gửi yêu cầu."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#061a30] px-4 py-10 text-white">
      <div className="mx-auto max-w-md rounded-[26px] border border-blue-800/70 bg-[#0c2b50] p-7 shadow-2xl sm:p-9">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
          VLEARNING STUDIO
        </div>

        <h1 className="mt-3 text-3xl font-black">
          Quên mật khẩu
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Nhập email đã đăng ký. Nếu tài khoản tồn tại, hệ thống sẽ gửi liên kết đặt lại mật khẩu có hiệu lực trong 30 phút.
        </p>

        {message && (
          <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-200">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6"
        >
          <label className="block text-xs font-black text-slate-500">
            EMAIL ĐÃ ĐĂNG KÝ
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            autoComplete="email"
            placeholder="giaovien@example.com"
            className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3.5 text-sm outline-none focus:border-cyan-500"
          />

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-3.5 text-sm font-black disabled:opacity-50"
          >
            {busy
              ? "Đang gửi..."
              : "Gửi liên kết đặt lại mật khẩu"}
          </button>
        </form>

        <a
          href="/projects"
          className="mt-5 block text-center text-sm font-bold text-cyan-300 hover:text-cyan-200"
        >
          ← Quay lại VLEARNING STUDIO
        </a>
      </div>
    </main>
  );
}
