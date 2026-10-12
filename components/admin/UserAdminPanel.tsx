"use client";

import {
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  UserRound,
  UserX,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from "@/lib/adminClient";

import type {
  AdminUserRow,
} from "@/lib/adminClient";

import {
  ACCESS_ROLE_LABELS,
} from "@/lib/permissions";

import type {
  AccessRole,
} from "@/lib/permissions";

type AdminUsersPanelProps = {
  onOpenMenu: () => void;
  currentUserId:
    | string
    | undefined;
};

export default function AdminUsersPanel({
  onOpenMenu,
  currentUserId,
}: AdminUsersPanelProps) {
  const [
    users,
    setUsers,
  ] =
    useState<AdminUserRow[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    busyId,
    setBusyId,
  ] =
    useState<
      string | null
    >(null);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    message,
    setMessage,
  ] =
    useState("");

  async function loadUsers() {
    setLoading(
      true
    );
    setError(
      ""
    );

    try {
      setUsers(
        await fetchAdminUsers()
      );
    } catch (
      loadError
    ) {
      setError(
        loadError instanceof
        Error
          ? loadError.message
          : "Không tải được danh sách người dùng."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const filtered =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLocaleLowerCase(
            "vi"
          );

      if (
        !keyword
      ) {
        return users;
      }

      return users.filter(
        (user) =>
          [
            user.displayName,
            user.email,
            user.organization,
            user.role,
            ACCESS_ROLE_LABELS[
              user.accessRole
            ],
          ]
            .join(
              " "
            )
            .toLocaleLowerCase(
              "vi"
            )
            .includes(
              keyword
            )
      );
    }, [
      users,
      search,
    ]);

  const stats =
    useMemo(
      () => ({
        total:
          users.length,
        admins:
          users.filter(
            (user) =>
              user.accessRole ===
              "ADMIN"
          ).length,
        teachers:
          users.filter(
            (user) =>
              user.accessRole ===
              "TEACHER"
          ).length,
        learners:
          users.filter(
            (user) =>
              user.accessRole ===
              "LEARNER"
          ).length,
        disabled:
          users.filter(
            (user) =>
              !user.isActive
          ).length,
      }),
      [
        users,
      ]
    );

  const statCards = [
    {
      label:
        "Tổng tài khoản",
      value:
        stats.total,
      Icon:
        UserRound,
    },
    {
      label:
        "Quản trị viên",
      value:
        stats.admins,
      Icon:
        ShieldCheck,
    },
    {
      label:
        "Giáo viên",
      value:
        stats.teachers,
      Icon:
        UserCog,
    },
    {
      label:
        "Học viên",
      value:
        stats.learners,
      Icon:
        UserCheck,
    },
    {
      label:
        "Đã vô hiệu",
      value:
        stats.disabled,
      Icon:
        UserX,
    },
  ];

  async function applyUpdate(
    user: AdminUserRow,
    patch: {
      accessRole?: AccessRole;
      isActive?: boolean;
    }
  ) {
    setBusyId(
      user.id
    );
    setError(
      ""
    );
    setMessage(
      ""
    );

    try {
      const updated =
        await updateAdminUser(
          user.id,
          {
            accessRole:
              patch.accessRole ??
              user.accessRole,
            isActive:
              patch.isActive ??
              user.isActive,
          }
        );

      setUsers(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              updated.id
                ? updated
                : item
          )
      );

      setMessage(
        `Đã cập nhật ${updated.displayName}.`
      );
    } catch (
      updateError
    ) {
      setError(
        updateError instanceof
        Error
          ? updateError.message
          : "Không cập nhật được người dùng."
      );
    } finally {
      setBusyId(
        null
      );
    }
  }

  async function removeUser(
    user: AdminUserRow
  ) {
    if (
      !window.confirm(
        `Xóa tài khoản "${user.displayName}" (${user.email}) khỏi database?`
      )
    ) {
      return;
    }

    setBusyId(
      user.id
    );
    setError(
      ""
    );
    setMessage(
      ""
    );

    try {
      await deleteAdminUser(
        user.id
      );

      setUsers(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              user.id
          )
      );

      setMessage(
        "Đã xóa tài khoản."
      );
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof
        Error
          ? deleteError.message
          : "Không xóa được tài khoản."
      );
    } finally {
      setBusyId(
        null
      );
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3 xl:hidden">
        <button
          type="button"
          onClick={
            onOpenMenu
          }
          aria-label="Mở menu"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/25 bg-[#0b2a4c] text-cyan-300"
        >
          <UserCog
            size={21}
          />
        </button>

        <div>
          <div className="text-lg font-black text-cyan-300">
            VLEARNING STUDIO
          </div>
          <div className="text-[10px] text-slate-400">
            Quản trị người dùng
          </div>
        </div>
      </div>

      <section className="rounded-[26px] border border-blue-700/40 bg-gradient-to-r from-[#103b68] via-[#153b6c] to-[#1d3264] px-7 py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300">
              A16 • Role-Based Access Control
            </div>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Quản trị người dùng
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Quản lý vai trò truy cập Admin / Giáo viên / Học viên và trạng thái hoạt động của từng tài khoản server.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadUsers()
            }
            disabled={
              loading
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-200 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Làm mới
          </button>
        </div>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map(
          ({
            label,
            value,
            Icon,
          }) => (
            <div
              key={
                label
              }
              className="rounded-2xl border border-blue-800/70 bg-[#0c2b50] p-5"
            >
              <Icon
                size={20}
                className="text-cyan-300"
              />
              <div className="mt-4 text-2xl font-black">
                {value}
              </div>
              <div className="mt-1 text-xs font-bold text-slate-500">
                {label}
              </div>
            </div>
          )
        )}
      </div>

      {(error ||
        message) && (
        <div
          className={`mt-5 rounded-xl border p-4 text-sm font-bold ${
            error
              ? "border-red-500/30 bg-red-500/10 text-red-200"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {error ||
            message}
        </div>
      )}

      <section className="mt-6 rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.12em] text-cyan-300">
              Danh sách tài khoản
            </div>

            <div className="mt-1 text-sm text-slate-500">
              Thay đổi quyền sẽ đăng xuất các phiên hiện tại của tài khoản đó để quyền mới có hiệu lực ngay.
            </div>
          </div>

          <div className="relative w-full md:w-[340px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Tìm tên, email, đơn vị..."
              className="w-full rounded-xl border border-blue-800 bg-[#08233f] py-3 pl-10 pr-4 text-sm outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-xl border border-dashed border-blue-800 p-10 text-center text-sm text-slate-500">
            Đang tải người dùng...
          </div>
        ) : filtered.length ===
          0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-blue-800 p-10 text-center text-sm text-slate-500">
            Không tìm thấy tài khoản phù hợp.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">
                    Người dùng
                  </th>
                  <th className="px-3 py-2">
                    Vai trò hệ thống
                  </th>
                  <th className="px-3 py-2">
                    Trạng thái
                  </th>
                  <th className="px-3 py-2">
                    Lần đăng nhập
                  </th>
                  <th className="px-3 py-2 text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (user) => {
                    const self =
                      user.id ===
                      currentUserId;

                    const busy =
                      busyId ===
                      user.id;

                    return (
                      <tr
                        key={
                          user.id
                        }
                        className="bg-[#08233f]"
                      >
                        <td className="rounded-l-xl px-3 py-4">
                          <div className="font-black text-slate-200">
                            {user.displayName}
                            {self && (
                              <span className="ml-2 rounded-full bg-cyan-500/10 px-2 py-1 text-[9px] text-cyan-300">
                                BẠN
                              </span>
                            )}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {user.email}
                          </div>

                          <div className="mt-1 text-[10px] text-slate-600">
                            {user.organization ||
                              "Chưa có đơn vị"}
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <select
                            value={
                              user.accessRole
                            }
                            disabled={
                              busy ||
                              self
                            }
                            onChange={(
                              event
                            ) =>
                              void applyUpdate(
                                user,
                                {
                                  accessRole:
                                    event.target.value as AccessRole,
                                }
                              )
                            }
                            className="rounded-lg border border-blue-700 bg-[#071d35] px-3 py-2 text-xs font-black outline-none disabled:opacity-50"
                          >
                            <option value="ADMIN">
                              Quản trị viên
                            </option>
                            <option value="TEACHER">
                              Giáo viên
                            </option>
                            <option value="LEARNER">
                              Học viên
                            </option>
                          </select>
                        </td>

                        <td className="px-3 py-4">
                          <button
                            type="button"
                            disabled={
                              busy ||
                              self
                            }
                            onClick={() =>
                              void applyUpdate(
                                user,
                                {
                                  isActive:
                                    !user.isActive,
                                }
                              )
                            }
                            className={`rounded-full px-3 py-2 text-[10px] font-black disabled:opacity-50 ${
                              user.isActive
                                ? "bg-emerald-500/10 text-emerald-300"
                                : "bg-red-500/10 text-red-300"
                            }`}
                          >
                            {user.isActive
                              ? "ĐANG HOẠT ĐỘNG"
                              : "ĐÃ VÔ HIỆU"}
                          </button>
                        </td>

                        <td className="px-3 py-4 text-xs text-slate-400">
                          {new Date(
                            user.lastLoginAt
                          ).toLocaleString(
                            "vi-VN"
                          )}
                        </td>

                        <td className="rounded-r-xl px-3 py-4 text-right">
                          <button
                            type="button"
                            disabled={
                              busy ||
                              self
                            }
                            onClick={() =>
                              void removeUser(
                                user
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-red-900 bg-red-950/25 px-3 py-2 text-[10px] font-black text-red-300 disabled:opacity-35"
                          >
                            <Trash2
                              size={13}
                            />
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
