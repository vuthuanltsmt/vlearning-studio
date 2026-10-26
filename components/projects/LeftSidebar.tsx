"use client";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Gamepad2,
  Globe2,
  LogIn,
  Landmark,
  MonitorDown,
  Palette,
  Settings,
  Shield,
  Sparkles,
  User,
  UsersRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getServerSession,
  logoutServerAccount,
  SERVER_AUTH_EVENT,
} from "@/lib/authClient";

import type {
  ServerSessionUser,
} from "@/lib/authClient";

import {
  ACCESS_ROLE_LABELS,
  canAuthor,
} from "@/lib/permissions";

type StudioSection =
  | "projects"
  | "guide"
  | "games"
  | "script"
  | "ai-settings"
  | "install"
  | "language"
  | "privacy"
  | "terms"
  | "account"
  | "admin-users";

type LeftSidebarProps = {
  active?: StudioSection;
  onNavigate?: (section: StudioSection) => void;
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  currentUser?: ServerSessionUser | null;
  onMobileClose?: () => void;
};

export default function LeftSidebar({
  active = "projects",
  onNavigate,
  collapsed = false,
  onToggle,
  mobileOpen = false,
  currentUser,
  onMobileClose,
}: LeftSidebarProps) {
  const [
    session,
    setSession,
  ] =
    useState<ServerSessionUser | null>(
      currentUser ??
      null
    );

  const avatarInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    avatarUrl,
    setAvatarUrl,
  ] =
    useState("");

  useEffect(() => {
    async function refreshAuth() {
      setSession(
        await getServerSession()
      );
    }

    void refreshAuth();

    const onAuthChanged =
      () => {
        void refreshAuth();
      };

    window.addEventListener(
      SERVER_AUTH_EVENT,
      onAuthChanged
    );

    return () => {
      window.removeEventListener(
        SERVER_AUTH_EVENT,
        onAuthChanged
      );
    };
  }, []);

  useEffect(() => {
    if (
      currentUser !==
      undefined
    ) {
      setSession(
        currentUser
      );
    }
  }, [
    currentUser,
  ]);

  useEffect(() => {
    if (!session?.email) {
      setAvatarUrl("");
      return;
    }

    try {
      const saved =
        localStorage.getItem(
          `vlearning-teacher-avatar:${session.email.toLowerCase()}`
        );

      setAvatarUrl(
        saved ?? ""
      );
    } catch {
      setAvatarUrl("");
    }
  }, [
    session?.email,
  ]);

  function handleAvatarFile(
    file: File
  ) {
    if (!session?.email) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      window.alert(
        "Vui lòng chọn file ảnh."
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload =
      () => {
        if (
          typeof reader.result !==
          "string"
        ) {
          return;
        }

        const image =
          new Image();

        image.onload =
          () => {
            const canvas =
              document.createElement(
                "canvas"
              );

            const size =
              256;

            canvas.width =
              size;
            canvas.height =
              size;

            const context =
              canvas.getContext(
                "2d"
              );

            if (!context) {
              return;
            }

            const side =
              Math.min(
                image.width,
                image.height
              );

            const sx =
              (
                image.width -
                side
              ) / 2;

            const sy =
              (
                image.height -
                side
              ) / 2;

            context.drawImage(
              image,
              sx,
              sy,
              side,
              side,
              0,
              0,
              size,
              size
            );

            const compact =
              canvas.toDataURL(
                "image/jpeg",
                0.86
              );

            try {
              localStorage.setItem(
                `vlearning-teacher-avatar:${session.email.toLowerCase()}`,
                compact
              );

              setAvatarUrl(
                compact
              );
            } catch {
              window.alert(
                "Không thể lưu ảnh đại diện trên trình duyệt."
              );
            }
          };

        image.src =
          reader.result;
      };

    reader.readAsDataURL(
      file
    );
  }

  const authorAllowed =
    canAuthor(
      session?.accessRole
    );

  const adminAllowed =
    session?.accessRole ===
    "ADMIN";

  async function sidebarLogout() {
    try {
      await logoutServerAccount();
    } finally {
      setSession(
        null
      );
      go(
        "account"
      );
    }
  }

  const menuBase =
    "flex w-full items-center rounded-xl py-2.5 text-left text-sm font-semibold transition";

  const menuSpacing =
    collapsed
      ? "gap-3 px-4 xl:justify-center xl:gap-0 xl:px-2"
      : "gap-3 px-4";

  const labelClass =
    collapsed
      ? "block xl:hidden"
      : "block";

  function go(section: StudioSection) {
    onNavigate?.(section);
    onMobileClose?.();
  }

  function stateClass(section: StudioSection) {
    return active === section
      ? "bg-cyan-500/15 text-cyan-300"
      : "text-slate-400 hover:bg-white/5 hover:text-white";
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] xl:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-[280px] flex-col overflow-x-hidden overflow-y-auto border-r border-[#17385c] bg-[#0a2849] shadow-2xl transition-all duration-300 xl:z-40 xl:translate-x-0 xl:shadow-none [scrollbar-gutter:stable] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          collapsed ? "xl:w-[78px]" : "xl:w-[224px]"
        }`}
      >
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Đóng menu"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 xl:hidden"
        >
          <X size={18} />
        </button>

        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          className="absolute -right-4 top-24 z-50 hidden h-16 w-8 items-center justify-center rounded-r-2xl border border-l-0 border-cyan-400/60 bg-gradient-to-b from-cyan-400 to-purple-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.35)] xl:flex"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div
          className={`shrink-0 ${
            collapsed
              ? "p-3 xl:px-2 xl:py-3"
              : "p-3"
          }`}
        >
          <div className={`overflow-hidden rounded-2xl border border-blue-800/70 bg-[#1a477d] shadow-lg ${collapsed ? "xl:px-2 xl:py-3" : ""}`}>
            <div className={collapsed ? "p-3 xl:p-0" : "p-3"}>
              <div className="flex flex-col items-center text-center">
                <input
                  ref={
                    avatarInputRef
                  }
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(
                    event
                  ) => {
                    const file =
                      event.target.files?.[
                        0
                      ];

                    if (file) {
                      handleAvatarFile(
                        file
                      );
                    }

                    event.currentTarget.value =
                      "";
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    avatarInputRef.current?.click()
                  }
                  title="Đổi ảnh đại diện"
                  className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white/5 text-slate-200 shadow-md transition hover:border-cyan-300/70"
                >
                  {avatarUrl ? (
                    <img
                      src={
                        avatarUrl
                      }
                      alt="Ảnh đại diện giáo viên"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User
                      size={24}
                    />
                  )}

                  <span className="absolute inset-x-0 bottom-0 hidden bg-black/55 py-1 text-[8px] font-bold text-white group-hover:block">
                    Đổi ảnh
                  </span>
                </button>

                <div className={collapsed ? "xl:hidden" : ""}>
                  <div className="mt-1.5 text-sm font-black text-slate-200">
                    {session
                      ? session.displayName
                      : "Khách truy cập"}
                  </div>

                  {session && (
                    <div className="mt-0.5 max-w-[180px] truncate text-[10px] text-slate-300/70">
                      {session.email}
                    </div>
                  )}
                  {session && (
                    <div className="mt-1 inline-flex rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-black text-cyan-200">
                      {
                        ACCESS_ROLE_LABELS[
                          session.accessRole
                        ]
                      }
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => go("account")}
                    className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-400 px-3 py-1.5 text-xs font-black text-white"
                  >
                    <User size={15} />
                    {session
                      ? "TÀI KHOẢN"
                      : "ĐĂNG NHẬP"}
                  </button>

                  {session && (
                    <div className="mt-1.5 space-y-0.5 text-center">
                      <div className="text-[9px] font-semibold text-slate-300/80">
                        Bản quyền Vũ Trọng Thuấn
                      </div>

                      <div className="flex items-center justify-center gap-1 text-[9px] text-cyan-200/80">
                        <Landmark
                          size={11}
                          aria-hidden="true"
                        />
                        <span>
                          Ngân hàng
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-col items-center">
                        <div className="rounded-lg bg-white p-1 shadow-lg">
                          <img
                            src="/agribank-qr-vutrongthuan.jpg"
                            alt="QR ngân hàng Agribank"
                            width={36}
                            height={36}
                            className="h-[36px] w-[36px] object-contain"
                          />
                        </div>

                        <div className="mt-0 text-[9px] font-semibold text-slate-300/80">
                          Quét QR ngân hàng
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`border-t border-blue-800/80 p-1.5 ${collapsed ? "xl:hidden" : ""}`}>
              <button
                type="button"
                onClick={() => go("install")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-xs font-bold text-slate-300 hover:bg-white/5"
              >
                <MonitorDown size={16} className="text-slate-400" />
                TẢI CÀI PC
              </button>

              {authorAllowed ? (
                <button
                  type="button"
                  onClick={() =>
                    go(
                      "ai-settings"
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-slate-300 hover:bg-white/5"
                >
                  <Palette
                    size={16}
                    className="text-slate-400"
                  />
                  Giao diện: Đại dương
                </button>
              ) : (
                <div className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-xs font-bold text-slate-500">
                  <Palette
                    size={16}
                    className="text-slate-500"
                  />
                  Giao diện: Đại dương
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#17385c]">
          {authorAllowed && (
            <div className="px-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  go(
                    "projects"
                  )
                }
                className={`${menuBase} ${menuSpacing} ${stateClass(
                  "projects"
                )}`}
              >
                <FolderOpen
                  size={20}
                  className="shrink-0"
                />
                <span className={labelClass}>
                  Dự án của tôi
                </span>
              </button>
              <a
                href="/ai-lessons"
                className={`${menuBase} ${menuSpacing} mt-1`}
                title="AI Lesson Studio"
              >
                <Sparkles size={20} className="shrink-0 text-cyan-300" />
                <span className={labelClass}>AI Lesson Studio</span>
              </a>



            </div>
          )}

        <nav className="space-y-1 px-2 py-2">
          <button
            type="button"
            onClick={() =>
              go(
                "guide"
              )
            }
            className={`${menuBase} ${menuSpacing} ${stateClass(
              "guide"
            )}`}
          >
            <BookOpen
              size={19}
              className="shrink-0"
            />
            <span className={labelClass}>
              Hướng dẫn
            </span>
          </button>

          {authorAllowed && (
            <>
              <button
                type="button"
                onClick={() =>
                  go(
                    "games"
                  )
                }
                className={`${menuBase} ${menuSpacing} ${stateClass(
                  "games"
                )}`}
              >
                <Gamepad2
                  size={19}
                  className="shrink-0 text-amber-400"
                />
                <span className={labelClass}>
                  Trò chơi
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  go(
                    "script"
                  )
                }
                className={`${menuBase} ${menuSpacing} ${stateClass(
                  "script"
                )}`}
              >
                <Sparkles
                  size={19}
                  className="shrink-0 text-fuchsia-400"
                />
                <span className={labelClass}>
                  AI kịch bản
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  go(
                    "ai-settings"
                  )
                }
                className={`${menuBase} ${menuSpacing} ${stateClass(
                  "ai-settings"
                )}`}
              >
                <Settings
                  size={19}
                  className="shrink-0 text-cyan-400"
                />
                <span className={labelClass}>
                  Cài đặt AI
                </span>
              </button>
            </>
          )}

          {adminAllowed && (
            <button
              type="button"
              onClick={() =>
                go(
                  "admin-users"
                )
              }
              className={`${menuBase} ${menuSpacing} ${stateClass(
                "admin-users"
              )}`}
            >
              <UsersRound
                size={19}
                className="shrink-0 text-emerald-400"
              />
              <span className={labelClass}>
                Quản trị người dùng
              </span>
            </button>
          )}
        </nav>
        </div>

        <div className="border-t border-[#17385c] bg-[#08233f]/95 px-2 py-2 backdrop-blur">
          <button
            type="button"
            onClick={() => go("language")}
            className={`${menuBase} ${menuSpacing} ${stateClass("language")}`}
          >
            <Globe2 size={18} className="shrink-0 text-cyan-300" />
            <span className={labelClass}>Tiếng Việt</span>
          </button>

          <button
            type="button"
            onClick={() => go("privacy")}
            className={`${menuBase} ${menuSpacing} ${stateClass("privacy")}`}
          >
            <Shield size={18} className="shrink-0 text-cyan-300" />
            <span className={labelClass}>Quyền riêng tư</span>
          </button>

          <button
            type="button"
            onClick={() => go("terms")}
            className={`${menuBase} ${menuSpacing} ${stateClass("terms")}`}
          >
            <FileText size={18} className="shrink-0 text-fuchsia-300" />
            <span className={labelClass}>Điều khoản dịch vụ</span>
          </button>

          <button
            type="button"
            onClick={
              session
                ? sidebarLogout
                : () =>
                    go(
                      "account"
                    )
            }
            className={`${menuBase} ${menuSpacing} mt-2 bg-cyan-500/10 font-black text-cyan-300 hover:bg-cyan-500/15`}
          >
            <LogIn
              size={18}
              className="shrink-0"
            />
            <span className={labelClass}>
              {session
                ? "Đăng xuất"
                : "Đăng nhập"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
