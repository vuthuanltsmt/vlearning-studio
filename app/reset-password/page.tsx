"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

export default function ResetPasswordPage() {
  const [token, setToken] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");
  const [busy, setBusy] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [error, setError] =
    useState("");

  useEffect(() => {
    const value =
      new URLSearchParams(
        window.location.search
      ).get("token") || "";

    setToken(value);
  }, []);

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Hai mật khẩu chưa trùng nhau."
      );
      return;
    }

    setBusy(true);

    try {
      const response =
        await fetch(
          "/api/auth/reset-password",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              token,
              newPassword:
                password,
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
            "Không thể đặt lại mật khẩu."
        );
      }

      setPassword("");
      setConfirmPassword("");
      setMessage(
        payload.message ||
          "Đã đặt lại mật khẩu."
      );
    } catch (
      submitError
    ) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể đặt lại mật khẩu."
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
          Đặt lại mật khẩu
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Mật khẩu mới cần ít nhất 8 ký tự, có chữ cái và chữ số.
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

        {!token ? (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
            Liên kết đặt lại mật khẩu không hợp lệ. Hãy yêu cầu một liên kết mới.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6"
          >
            <label className="block text-xs font-black text-slate-500">
              MẬT KHẨU MỚI
            </label>

            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3.5 text-sm outline-none focus:border-cyan-500"
            />

            <label className="mt-4 block text-xs font-black text-slate-500">
              NHẬP LẠI MẬT KHẨU
            </label>

            <input
              type="password"
              required
              minLength={8}
              value={
                confirmPassword
              }
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3.5 text-sm outline-none focus:border-cyan-500"
            />

            <button
              type="submit"
              disabled={busy}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-3.5 text-sm font-black disabled:opacity-50"
            >
              {busy
                ? "Đang cập nhật..."
                : "Đặt mật khẩu mới"}
            </button>
          </form>
        )}

        <a
          href="/projects"
          className="mt-5 block text-center text-sm font-bold text-cyan-300 hover:text-cyan-200"
        >
          ← Quay lại đăng nhập
        </a>
      </div>
    </main>
  );
}
